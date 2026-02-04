/**
 * YooKassa Payment Integration
 * Documentation: https://yookassa.ru/developers/api
 */

import crypto from 'crypto';
import { env } from '../config/env';
import {
  SUBSCRIPTION_PLANS,
  SINGLE_CONTRACT_PRICE,
  SubscriptionPlanType,
} from '../config/subscriptions';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

// Logging disabled in production; keep stub to avoid console noise
const logBilling = (..._args: unknown[]) => {
  void _args;
};

interface YooKassaPaymentRequest {
  amount: {
    value: string;
    currency: string;
  };
  capture: boolean;
  confirmation?: {
    type: string;
    return_url: string;
  };
  description: string;
  metadata?: Record<string, string>;
  save_payment_method?: boolean;
  payment_method_id?: string;
}

interface YooKassaPaymentResponse {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  payment_method?: {
    type: string;
    id: string;
    saved: boolean;
  };
  metadata?: Record<string, string>;
  created_at: string;
}

interface YooKassaError {
  type: string;
  id: string;
  code: string;
  description: string;
  parameter?: string;
}

function getAuthHeader(): string {
  const credentials = `${env.yookassaShopId}:${env.yookassaSecretKey}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

function generateIdempotenceKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a subscription payment (with saved payment method for recurring)
 */
export async function createSubscriptionPayment(
  userId: string,
  plan: SubscriptionPlanType,
  returnUrl?: string,
): Promise<{ paymentUrl: string; paymentId: string }> {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  if (planConfig.price === 0) {
    throw new Error('Cannot create payment for free plan');
  }

  const amountInRubles = planConfig.price;

  const payload: YooKassaPaymentRequest = {
    amount: {
      value: amountInRubles.toFixed(2),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl || `${env.yookassaReturnUrl}/billing?payment=success`,
    },
    description: `Подписка ${plan} на ДоговорAI`,
    metadata: {
      user_id: userId,
      plan: plan,
      type: 'subscription',
    },
    save_payment_method: true, // Save for recurring payments
  };

  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      'Idempotence-Key': generateIdempotenceKey(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: YooKassaError = await response.json();
    logBilling('createSubscriptionPayment error', { userId, plan, error });
    throw new Error(`YooKassa error: ${error.description || error.code}`);
  }

  const data: YooKassaPaymentResponse = await response.json();

  if (!data.confirmation?.confirmation_url) {
    throw new Error('No confirmation URL in YooKassa response');
  }

  logBilling('createSubscriptionPayment success', {
    userId,
    plan,
    returnUrl: payload.confirmation?.return_url,
    paymentId: data.id,
    status: data.status,
    metadata: data.metadata,
  });

  return {
    paymentUrl: data.confirmation.confirmation_url,
    paymentId: data.id,
  };
}

/**
 * Create a recurring payment using saved payment method
 */
export async function createRecurringPayment(
  userId: string,
  plan: SubscriptionPlanType,
  paymentMethodId: string,
): Promise<{ success: boolean; paymentId: string }> {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  if (planConfig.price === 0) {
    throw new Error('Cannot create payment for free plan');
  }

  const amountInRubles = planConfig.price;

  const payload: YooKassaPaymentRequest = {
    amount: {
      value: amountInRubles.toFixed(2),
      currency: 'RUB',
    },
    capture: true,
    description: `Автопродление подписки ${plan} на ДоговорAI`,
    metadata: {
      user_id: userId,
      plan: plan,
      type: 'subscription_renewal',
    },
    payment_method_id: paymentMethodId,
  };

  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      'Idempotence-Key': generateIdempotenceKey(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: YooKassaError = await response.json();
    logBilling('createRecurringPayment error', { userId, plan, error });
    throw new Error(`YooKassa error: ${error.description || error.code}`);
  }

  const data: YooKassaPaymentResponse = await response.json();

  logBilling('createRecurringPayment response', {
    userId,
    plan,
    paymentId: data.id,
    status: data.status,
    paid: data.paid,
    metadata: data.metadata,
  });

  return {
    success: data.status === 'succeeded',
    paymentId: data.id,
  };
}

/**
 * Create a single contract payment (99₽)
 */
export async function createSingleContractPayment(
  userId: string,
  returnUrl?: string,
): Promise<{ paymentUrl: string; paymentId: string }> {
  const payload: YooKassaPaymentRequest = {
    amount: {
      value: SINGLE_CONTRACT_PRICE.toFixed(2),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl || `${env.yookassaReturnUrl}/dashboard?payment=success`,
    },
    description: 'Дополнительный договор на ДоговорAI',
    metadata: {
      user_id: userId,
      type: 'single_contract',
    },
  };

  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      'Idempotence-Key': generateIdempotenceKey(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: YooKassaError = await response.json();
    logBilling('createSingleContractPayment error', { userId, error });
    throw new Error(`YooKassa error: ${error.description || error.code}`);
  }

  const data: YooKassaPaymentResponse = await response.json();

  if (!data.confirmation?.confirmation_url) {
    throw new Error('No confirmation URL in YooKassa response');
  }

  logBilling('createSingleContractPayment success', {
    userId,
    paymentId: data.id,
    status: data.status,
    metadata: data.metadata,
    returnUrl: payload.confirmation?.return_url,
  });

  return {
    paymentUrl: data.confirmation.confirmation_url,
    paymentId: data.id,
  };
}

/**
 * Get payment details
 */
export async function getPayment(paymentId: string): Promise<YooKassaPaymentResponse> {
  const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error: YooKassaError = await response.json();
    throw new Error(`YooKassa error: ${error.description || error.code}`);
  }

  return response.json();
}

/**
 * Verify webhook signature (if webhook secret is configured)
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!env.yookassaWebhookSecret) {
    // Skip verification if no secret configured
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.yookassaWebhookSecret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Parse webhook event
 */
export interface YooKassaWebhookEvent {
  type: 'notification';
  event:
    | 'payment.succeeded'
    | 'payment.canceled'
    | 'payment.waiting_for_capture'
    | 'refund.succeeded';
  object: YooKassaPaymentResponse;
}

export function parseWebhookEvent(body: unknown): YooKassaWebhookEvent | null {
  if (
    typeof body === 'object' &&
    body !== null &&
    'type' in body &&
    'event' in body &&
    'object' in body
  ) {
    return body as YooKassaWebhookEvent;
  }
  return null;
}
