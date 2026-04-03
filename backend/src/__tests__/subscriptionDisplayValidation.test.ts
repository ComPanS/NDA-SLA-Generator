import { describe, expect, it } from 'vitest';
import type { BillingFxCurrency } from '../lib/cbrFx';
import {
  validateAllSubscriptionDisplayPrices,
  validatePlanDisplayPrices,
} from '../config/subscriptionDisplayValidation';
import { SUBSCRIPTION_PLANS, type PlanLimits } from '../config/subscriptions';

/** Fixture: foreign units per 1 RUB (same as production CBR convention). */
const FIXTURE_RATES: Record<BillingFxCurrency, number> = {
  RUB: 1,
  USD: 0.011,
  EUR: 0.01,
  GBP: 0.0085,
  THB: 0.38,
};

describe('subscriptionDisplayValidation', () => {
  it('accepts current config against fixture rates', () => {
    expect(() => validateAllSubscriptionDisplayPrices(FIXTURE_RATES)).not.toThrow();
  });

  it('rejects foreign monthly below RUB floor', () => {
    const bad: PlanLimits = {
      ...SUBSCRIPTION_PLANS.basic,
      pricesByCurrency: {
        ...SUBSCRIPTION_PLANS.basic.pricesByCurrency,
        USD: { monthly: 1, first_month: 0.5 },
      },
    };
    expect(() => validatePlanDisplayPrices('basic', bad, FIXTURE_RATES)).toThrow(/monthly/);
  });
});
