import { prisma } from '../config/prisma';
import { env } from '../config/env';
import {
  SUBSCRIPTION_BILLING_INTERVAL_MS,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
} from '../config/subscriptions';
import { createRecurringPayment } from './yookassa';

const CHECK_INTERVAL_MS = env.subscriptionExpiryCheckIntervalMs;
const log = (..._args: unknown[]) => {};
const logWarn = (..._args: unknown[]) => {};
const logError = (..._args: unknown[]) => {};

async function processExpiredSubscription(sub: {
  id: string;
  userId: string;
  plan: SubscriptionPlanType;
  autoRenew: boolean;
  yookassaPaymentMethodId: string | null;
}) {
  // Auto-renewal path
  if (sub.autoRenew && sub.yookassaPaymentMethodId) {
    const planConfig = SUBSCRIPTION_PLANS[sub.plan];

    // If free plan somehow here, just extend
    if (planConfig.price === 0) {
      const newExpiresAt = new Date(Date.now() + SUBSCRIPTION_BILLING_INTERVAL_MS);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'active', expiresAt: newExpiresAt },
      });
      log('[subscription-expiry] auto-extended free plan', {
        subscriptionId: sub.id,
        plan: sub.plan,
        expiresAt: newExpiresAt.toISOString(),
      });
      return { renewed: true, canceled: false, pastDue: false };
    }

    const amount = planConfig.price * 100; // kopeks
    const newExpiresAt = new Date(Date.now() + SUBSCRIPTION_BILLING_INTERVAL_MS);

    // Create local payment record (pending)
    const payment = await prisma.payment.create({
      data: {
        userId: sub.userId,
        amount,
        type: 'subscription',
        status: 'pending',
        description: `Subscription renewal ${sub.plan}`,
      },
    });

    try {
      const recurring = await createRecurringPayment(
        sub.userId,
        sub.plan,
        sub.yookassaPaymentMethodId,
      );

      if (recurring.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'succeeded', yookassaPaymentId: recurring.paymentId },
        });

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'active',
            expiresAt: newExpiresAt,
          },
        });

        log('[subscription-expiry] auto-renew succeeded', {
          subscriptionId: sub.id,
          userId: sub.userId,
          plan: sub.plan,
          paymentId: recurring.paymentId,
          newExpiresAt: newExpiresAt.toISOString(),
        });

        return { renewed: true, canceled: false, pastDue: false };
      }

      // Failed charge -> mark past_due
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'canceled', yookassaPaymentId: recurring.paymentId },
      });
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'past_due' },
      });

      logWarn('[subscription-expiry] auto-renew failed (past_due)', {
        subscriptionId: sub.id,
        userId: sub.userId,
        plan: sub.plan,
        paymentId: recurring.paymentId,
      });

      return { renewed: false, canceled: false, pastDue: true };
    } catch (err) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'canceled' },
      });
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'past_due' },
      });

      logError('[subscription-expiry] auto-renew exception (past_due)', {
        subscriptionId: sub.id,
        userId: sub.userId,
        plan: sub.plan,
        error: err instanceof Error ? err.message : String(err),
      });

      return { renewed: false, canceled: false, pastDue: true };
    }
  }

  // No auto-renewal or no payment method: cancel
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'canceled' },
  });

  log('[subscription-expiry] canceled (no auto-renew or payment method)', {
    subscriptionId: sub.id,
    userId: sub.userId,
    plan: sub.plan,
    autoRenew: sub.autoRenew,
    hasPaymentMethod: Boolean(sub.yookassaPaymentMethodId),
  });

  return { renewed: false, canceled: true, pastDue: false };
}

async function expireSubscriptionsNow() {
  const now = new Date();
  const mskTime = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
  const expired = await prisma.subscription.findMany({
    where: {
      status: 'active',
      expiresAt: {
        not: null,
        lte: now,
      },
    },
  });

  if (expired.length === 0) {
    log('[subscription-expiry] no expired subscriptions found', {
      asOfUtc: now.toISOString(),
      asOfMsk: mskTime,
    });
    return;
  }

  let renewed = 0;
  let canceled = 0;
  let pastDue = 0;

  for (const sub of expired) {
    const res = await processExpiredSubscription({
      id: sub.id,
      userId: sub.userId,
      plan: sub.plan as SubscriptionPlanType,
      autoRenew: (sub as any).autoRenew ?? false,
      yookassaPaymentMethodId: (sub as any).yookassaPaymentMethodId ?? null,
    });
    if (res.renewed) renewed += 1;
    if (res.canceled) canceled += 1;
    if (res.pastDue) pastDue += 1;
  }

  log('[subscription-expiry] processed expired subscriptions', {
    total: expired.length,
    renewed,
    canceled,
    pastDue,
    asOfUtc: now.toISOString(),
    asOfMsk: mskTime,
  });
}

/**
 * Starts a daily job that marks expired subscriptions as canceled.
 * Returns a stop function to clear the interval.
 */
export function startSubscriptionExpiryJob() {
  // Run once on startup
  expireSubscriptionsNow().catch((err) => {
    logError('[subscription-expiry] initial run failed', err);
  });

  const timer = setInterval(() => {
    expireSubscriptionsNow().catch((err) => {
      logError('[subscription-expiry] scheduled run failed', err);
    });
  }, CHECK_INTERVAL_MS);

  // Do not block exit
  timer.unref?.();

  log('[subscription-expiry] job started', {
    intervalMs: CHECK_INTERVAL_MS,
  });

  return () => clearInterval(timer);
}
