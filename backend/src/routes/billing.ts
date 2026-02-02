import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { toBilling } from '../lib/mappers';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_BILLING_INTERVAL_MS,
  SINGLE_CONTRACT_PRICE,
  SubscriptionPlanType,
  SUBSCRIPTION_NAMES,
  SUBSCRIPTION_FEATURES,
} from '../config/subscriptions';
import {
  createSubscriptionPayment,
  createSingleContractPayment,
  parseWebhookEvent,
  getPayment,
} from '../lib/yookassa';
import { getUsageSummary, addExtraContractPaid, getUserPlan } from '../lib/limits';
import { env } from '../config/env';

const router = Router();

// Small helper to keep billing logs grouped
// Logging disabled in production; keep stub to avoid console noise
const logBilling = (..._args: unknown[]) => {};

/**
 * Make sure return_url includes payment=success to trigger client fallback flow.
 */
const buildReturnUrlWithSuccess = (raw?: string): string => {
  const fallback = env.yookassaReturnUrl || env.frontendUrl;
  try {
    const url = new URL(raw || fallback);
    url.searchParams.set('payment', 'success');
    return url.toString();
  } catch (_err) {
    return `${fallback.replace(/\/$/, '')}/billing?payment=success`;
  }
};

// Validation schemas
const subscribeSchema = z.object({
  plan: z.enum(['basic', 'standard', 'pro']),
  return_url: z.string().url().optional(),
});

const singleContractSchema = z.object({
  return_url: z.string().url().optional(),
});

/**
 * GET /billing - Get current billing info
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active',
      },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(toBilling(sub));
  } catch (error) {
    console.error('Error fetching billing:', error);
    return res.status(500).json({ detail: 'Failed to fetch billing info' });
  }
});

/**
 * GET /billing/usage - Get current usage stats
 */
router.get('/usage', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }
    const usage = await getUsageSummary(req.userId);
    return res.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return res.status(500).json({ detail: 'Failed to fetch usage info' });
  }
});

/**
 * GET /billing/plans - Get available plans
 */
router.get('/plans', async (_req, res) => {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, config]) => ({
    id: key,
    name: SUBSCRIPTION_NAMES[key as SubscriptionPlanType],
    price: config.price,
    features: SUBSCRIPTION_FEATURES[key as SubscriptionPlanType],
    limits: {
      contracts_per_month: config.contractsPerMonth,
      max_templates: config.maxTemplates,
      ai_clarifications: config.aiClarifications,
      export_formats: config.exportFormats,
      has_risk_check: config.hasRiskCheck,
      has_sections: config.hasSections,
      has_statuses: config.hasStatuses,
      has_priority_support: config.hasPrioritySupport,
    },
  }));
  return res.json({ plans, single_contract_price: SINGLE_CONTRACT_PRICE });
});

/**
 * POST /billing/subscribe - Create subscription payment
 */
router.post('/subscribe', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ detail: parsed.error.flatten() });
    }

    const { plan, return_url } = parsed.data;

    const finalReturnUrl = buildReturnUrlWithSuccess(return_url || `${env.frontendUrl}/billing`);

    // Check if user already has an active subscription of same or higher tier
    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (existingSub && existingSub.plan === plan) {
      return res.status(400).json({
        detail: 'You already have this plan',
      });
    }

    // Create payment with YooKassa
    const { paymentUrl, paymentId } = await createSubscriptionPayment(
      req.userId,
      plan,
      finalReturnUrl,
    );

    logBilling('subscription payment created', {
      userId: req.userId,
      plan,
      paymentId,
      returnUrl: finalReturnUrl,
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: req.userId,
        amount: SUBSCRIPTION_PLANS[plan].price * 100, // convert to kopeks
        type: 'subscription',
        status: 'pending',
        yookassaPaymentId: paymentId,
        description: `Subscription ${plan}`,
      },
    });

    return res.json({ payment_url: paymentUrl, payment_id: paymentId });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ detail: 'Failed to create subscription payment' });
  }
});

/**
 * POST /billing/single-contract - Pay for one extra contract
 */
router.post('/single-contract', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const parsed = singleContractSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ detail: parsed.error.flatten() });
    }

    const { return_url } = parsed.data;

    const finalReturnUrl = buildReturnUrlWithSuccess(return_url || `${env.frontendUrl}/dashboard`);

    // Create payment with YooKassa
    const { paymentUrl, paymentId } = await createSingleContractPayment(req.userId, finalReturnUrl);

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: req.userId,
        amount: SINGLE_CONTRACT_PRICE * 100, // convert to kopeks
        type: 'single_contract',
        status: 'pending',
        yookassaPaymentId: paymentId,
        description: 'Single contract purchase',
      },
    });

    return res.json({ payment_url: paymentUrl, payment_id: paymentId });
  } catch (error) {
    console.error('Error creating single contract payment:', error);
    return res.status(500).json({ detail: 'Failed to create payment' });
  }
});

/**
 * POST /billing/cancel - Cancel auto-renewal
 */
router.post('/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active',
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!subscription) {
      return res.status(404).json({ detail: 'No active subscription found' });
    }

    // Disable auto-renewal
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { autoRenew: false },
    });

    return res.json({ success: true, message: 'Auto-renewal disabled' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ detail: 'Failed to cancel subscription' });
  }
});

/**
 * POST /billing/reactivate - Reactivate auto-renewal
 */
router.post('/reactivate', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: 'active',
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!subscription) {
      return res.status(404).json({ detail: 'No active subscription found' });
    }

    // Enable auto-renewal
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { autoRenew: true },
    });

    return res.json({ success: true, message: 'Auto-renewal enabled' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return res.status(500).json({ detail: 'Failed to reactivate subscription' });
  }
});

/**
 * POST /billing/confirm-payment - Confirm payment and apply changes (fallback for webhook)
 */
router.post('/confirm-payment', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    logBilling('confirm-payment called', { userId: req.userId });

    // Find the most recent pending payment for this user
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        userId: req.userId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pendingPayment || !pendingPayment.yookassaPaymentId) {
      logBilling('no pending payment found', { userId: req.userId });
      // Check if there's a recently succeeded payment (already processed)
      const recentSucceeded = await prisma.payment.findFirst({
        where: {
          userId: req.userId,
          status: 'succeeded',
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // last 5 min
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentSucceeded) {
        // Already processed, return success
        return res.json({
          success: true,
          status: 'succeeded',
          type: recentSucceeded.type,
          message:
            recentSucceeded.type === 'single_contract'
              ? 'Дополнительный договор добавлен'
              : 'Подписка активирована',
        });
      }

      return res.status(404).json({ detail: 'No pending payment found' });
    }

    // Check payment status with YooKassa
    const yooPayment = await getPayment(pendingPayment.yookassaPaymentId);
    logBilling('yookassa payment fetched', {
      userId: req.userId,
      paymentId: pendingPayment.yookassaPaymentId,
      status: yooPayment.status,
      type: pendingPayment.type,
      metadata: yooPayment.metadata,
    });

    if (yooPayment.status === 'succeeded') {
      // Use atomic updateMany to prevent race condition - only update if still pending
      const updateResult = await prisma.payment.updateMany({
        where: {
          id: pendingPayment.id,
          status: 'pending', // Only update if still pending (atomic check)
        },
        data: { status: 'succeeded' },
      });

      // If no rows were updated, payment was already processed
      if (updateResult.count === 0) {
        console.log(`Payment ${pendingPayment.id} already processed, skipping`);
        return res.json({
          success: true,
          status: 'succeeded',
          type: pendingPayment.type,
          message:
            pendingPayment.type === 'single_contract'
              ? 'Дополнительный договор добавлен'
              : 'Подписка активирована',
        });
      }

      // Apply the benefit based on payment type
      if (pendingPayment.type === 'single_contract') {
        await addExtraContractPaid(req.userId);
        logBilling('extra contract confirmed', { userId: req.userId });
      } else if (pendingPayment.type === 'subscription') {
        // For subscription, the plan info would be in metadata
        // This case is typically handled by webhook, but as fallback:
        const metadata = yooPayment.metadata || {};
        const plan = metadata.plan as SubscriptionPlanType;

        if (plan) {
          const expiresAt = new Date(Date.now() + SUBSCRIPTION_BILLING_INTERVAL_MS);

          await prisma.subscription.updateMany({
            where: { userId: req.userId, status: 'active' },
            data: { status: 'canceled' },
          });

          await prisma.subscription.create({
            data: {
              userId: req.userId,
              plan,
              status: 'active',
              expiresAt,
              autoRenew: true,
              yookassaPaymentMethodId: yooPayment.payment_method?.id || null,
            },
          });

          logBilling('subscription confirmed via confirm-payment', {
            userId: req.userId,
            plan,
            expiresAt: expiresAt.toISOString(),
          });
        }
      }

      return res.json({
        success: true,
        status: 'succeeded',
        type: pendingPayment.type,
        message:
          pendingPayment.type === 'single_contract'
            ? 'Дополнительный договор добавлен'
            : 'Подписка активирована',
      });
    } else if (yooPayment.status === 'canceled') {
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: { status: 'canceled' },
      });

      logBilling('payment canceled at yookassa', {
        userId: req.userId,
        paymentId: pendingPayment.yookassaPaymentId,
      });

      return res.json({
        success: false,
        status: 'canceled',
        message: 'Платёж отменён',
      });
    } else {
      // Still pending
      return res.json({
        success: false,
        status: yooPayment.status,
        message: 'Платёж обрабатывается',
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ detail: 'Failed to confirm payment' });
  }
});

/**
 * GET /billing/payment/:id - Check payment status
 */
router.get('/payment/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const paymentId = String(req.params.id);

    // Find local payment record
    const localPayment = await prisma.payment.findFirst({
      where: {
        yookassaPaymentId: paymentId,
        userId: req.userId,
      },
    });

    if (!localPayment) {
      return res.status(404).json({ detail: 'Payment not found' });
    }

    // Get status from YooKassa
    const yooPayment = await getPayment(paymentId);

    return res.json({
      id: localPayment.id,
      yookassa_id: paymentId,
      status: yooPayment.status,
      amount: localPayment.amount / 100, // convert back to rubles
      type: localPayment.type,
      created_at: localPayment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({ detail: 'Failed to fetch payment status' });
  }
});

/**
 * POST /billing/webhook - YooKassa webhook handler
 */
router.post('/webhook', async (req, res) => {
  try {
    const event = parseWebhookEvent(req.body);
    if (!event) {
      logBilling('webhook invalid payload', { body: req.body });
      return res.status(400).json({ detail: 'Invalid webhook event' });
    }

    logBilling('webhook received', {
      event: event.event,
      paymentId: event.object.id,
      metadata: event.object.metadata,
      status: event.object.status,
    });

    if (event.event === 'payment.succeeded') {
      const payment = event.object;
      const metadata = payment.metadata || {};

      // Find local payment record
      const localPayment = await prisma.payment.findUnique({
        where: { yookassaPaymentId: payment.id },
      });

      if (!localPayment) {
        logBilling('payment not found for webhook', { paymentId: payment.id, metadata });
        return res.status(200).json({ received: true });
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: localPayment.id },
        data: { status: 'succeeded' },
      });

      if (metadata.type === 'subscription' || metadata.type === 'subscription_renewal') {
        const plan = metadata.plan as SubscriptionPlanType;
        const userId = metadata.user_id;

        if (!plan || !userId) {
          logBilling('missing plan or user_id in metadata', { metadata });
          return res.status(200).json({ received: true });
        }

        // Calculate expiration date
        const expiresAt = new Date(Date.now() + SUBSCRIPTION_BILLING_INTERVAL_MS);

        // Deactivate existing subscriptions
        await prisma.subscription.updateMany({
          where: { userId, status: 'active' },
          data: { status: 'canceled' },
        });

        // Create new subscription
        await prisma.subscription.create({
          data: {
            userId,
            plan,
            status: 'active',
            expiresAt,
            autoRenew: true,
            yookassaPaymentMethodId: payment.payment_method?.id || null,
          },
        });

        logBilling('subscription created via webhook', {
          userId,
          plan,
          paymentId: payment.id,
          expiresAt: expiresAt.toISOString(),
        });
      } else if (metadata.type === 'single_contract') {
        const userId = metadata.user_id;

        if (!userId) {
          logBilling('missing user_id in metadata for single_contract', { metadata });
          return res.status(200).json({ received: true });
        }

        // Add extra contract to user's allowance
        await addExtraContractPaid(userId);

        logBilling('extra contract added via webhook', { userId, paymentId: payment.id });
      } else {
        logBilling('payment.succeeded with unhandled metadata.type', {
          type: metadata.type,
          metadata,
          paymentId: payment.id,
        });
      }
    } else if (event.event === 'payment.canceled') {
      const payment = event.object;

      // Update local payment status
      await prisma.payment.updateMany({
        where: { yookassaPaymentId: payment.id },
        data: { status: 'canceled' },
      });

      logBilling('payment canceled via webhook', { paymentId: payment.id });
    } else {
      logBilling('webhook event ignored (not handled)', {
        event: event.event,
        paymentId: event.object.id,
        status: event.object.status,
        metadata: event.object.metadata,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logBilling('error processing webhook', { error });
    // Always return 200 to YooKassa to prevent retries
    return res.status(200).json({ received: true, error: 'Processing error' });
  }
});

/**
 * GET /billing/payments - Get payment history
 */
router.get('/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount / 100, // convert to rubles
        currency: p.currency,
        type: p.type,
        status: p.status,
        description: p.description,
        created_at: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ detail: 'Failed to fetch payment history' });
  }
});

export default router;
