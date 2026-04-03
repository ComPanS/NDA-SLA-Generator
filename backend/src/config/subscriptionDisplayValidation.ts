/**
 * Ensures display prices are not "cheaper" than RUB list prices when converted at given rates.
 * rates[currency] = foreign units per 1 RUB (same convention as CBR helper).
 */

import type { BillingFxCurrency } from '../lib/cbrFx';
import {
  BILLING_DISPLAY_CURRENCIES,
  type BillingDisplayCurrency,
  type PlanLimits,
  SINGLE_CONTRACT_PRICES_BY_CURRENCY,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanType,
} from './subscriptions';

const FOREIGN: Exclude<BillingDisplayCurrency, 'RUB'>[] = ['USD', 'EUR', 'GBP', 'THB'];

/** RUB implied by a foreign display amount at the given rate. */
export function foreignDisplayToRubEquiv(
  foreignAmount: number,
  currency: Exclude<BillingFxCurrency, 'RUB'>,
  rates: Record<BillingFxCurrency, number>,
): number {
  const r = rates[currency];
  if (r == null || !Number.isFinite(r) || r <= 0) {
    throw new Error(`Invalid FX rate for ${currency}`);
  }
  return foreignAmount / r;
}

export function validatePlanDisplayPrices(
  planId: SubscriptionPlanType,
  limits: PlanLimits,
  rates: Record<BillingFxCurrency, number>,
): void {
  const rubRow = limits.pricesByCurrency.RUB;
  if (limits.price !== rubRow.monthly) {
    throw new Error(`${planId}: RUB monthly ${rubRow.monthly} must equal price ${limits.price}`);
  }
  const expectFirst = limits.firstMonthPrice ?? null;
  if ((rubRow.first_month ?? null) !== expectFirst) {
    throw new Error(
      `${planId}: RUB first_month ${rubRow.first_month} must match firstMonthPrice ${expectFirst}`,
    );
  }

  if (limits.price === 0) {
    for (const c of BILLING_DISPLAY_CURRENCIES) {
      const row = limits.pricesByCurrency[c];
      if (row.monthly !== 0 || (row.first_month ?? 0) !== 0) {
        throw new Error(`${planId}: freemium non-zero display in ${c}`);
      }
    }
    return;
  }

  for (const c of FOREIGN) {
    const row = limits.pricesByCurrency[c];
    const eqM = foreignDisplayToRubEquiv(row.monthly, c, rates);
    if (eqM + 1e-9 < limits.price) {
      throw new Error(
        `${planId}: ${c} monthly ${row.monthly} implies ${eqM} RUB < list ${limits.price}`,
      );
    }
    if (limits.firstMonthPrice != null && limits.firstMonthPrice > 0 && row.first_month != null) {
      const eqF = foreignDisplayToRubEquiv(row.first_month, c, rates);
      if (eqF + 1e-9 < limits.firstMonthPrice) {
        throw new Error(
          `${planId}: ${c} first_month ${row.first_month} implies ${eqF} RUB < promo ${limits.firstMonthPrice}`,
        );
      }
    }
  }
}

export function validateSingleContractDisplayPrices(rates: Record<BillingFxCurrency, number>): void {
  const rub = SINGLE_CONTRACT_PRICES_BY_CURRENCY.RUB;
  for (const c of FOREIGN) {
    const amt = SINGLE_CONTRACT_PRICES_BY_CURRENCY[c];
    const eq = foreignDisplayToRubEquiv(amt, c, rates);
    if (eq + 1e-9 < rub) {
      throw new Error(
        `single_contract ${c} ${amt} implies ${eq} RUB < ${rub}`,
      );
    }
  }
}

export function validateAllSubscriptionDisplayPrices(rates: Record<BillingFxCurrency, number>): void {
  for (const id of Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanType[]) {
    validatePlanDisplayPrices(id, SUBSCRIPTION_PLANS[id], rates);
  }
  validateSingleContractDisplayPrices(rates);
}
