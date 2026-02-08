/**
 * Subscription Limit Checking Utilities
 */

import { prisma } from '../config/prisma';
import {
  SUBSCRIPTION_PLANS,
  SINGLE_CONTRACT_PRICE,
  SubscriptionPlanType,
  isUnlimited,
  getUpgradeOptions,
  SUBSCRIPTION_NAMES,
} from '../config/subscriptions';

function getCurrentPeriodStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export interface LimitCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  isUnlimited: boolean;
  upgradeOptions?: UpgradeOption[];
  singleContractPrice?: number;
}

export interface UpgradeOption {
  plan: SubscriptionPlanType;
  name: string;
  price: number;
  newLimit: number;
}

/**
 * Get or create usage record for user
 */
export async function getOrCreateUsageRecord(userId: string) {
  let usage = await prisma.usageRecord.findUnique({
    where: { userId },
  });

  if (!usage) {
    usage = await prisma.usageRecord.create({
      data: {
        userId,
        contractsThisMonth: 0,
        clarificationsUsed: 0,
        extraContractsPaid: 0,
        periodStart: getCurrentPeriodStart(),
      },
    });
  }

  // Check if period needs reset (monthly)
  const currentPeriodStart = getCurrentPeriodStart();
  const periodStart = new Date(usage.periodStart);
  const monthDiff =
    (currentPeriodStart.getFullYear() - periodStart.getFullYear()) * 12 +
    (currentPeriodStart.getMonth() - periodStart.getMonth());

  if (monthDiff >= 1 || periodStart.getTime() !== currentPeriodStart.getTime()) {
    // Clean up old per-document clarification usages
    await prisma.clarificationUsage.deleteMany({
      where: {
        userId,
        periodStart: { lt: currentPeriodStart },
      },
    });

    // Reset monthly counters
    usage = await prisma.usageRecord.update({
      where: { userId },
      data: {
        contractsThisMonth: 0,
        clarificationsUsed: 0,
        extraContractsPaid: 0,
        periodStart: currentPeriodStart,
      },
    });
  }

  return usage;
}

/**
 * Get user's current subscription plan
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlanType> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!subscription) {
    return 'freemium';
  }

  return subscription.plan as SubscriptionPlanType;
}

/**
 * Check if user can create a new contract
 */
export async function checkContractLimit(userId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId);
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const usage = await getOrCreateUsageRecord(userId);

  const limit = planConfig.contractsPerMonth;
  const currentUsage = usage.contractsThisMonth;
  const extraPaid = usage.extraContractsPaid;

  // Effective limit includes extra paid contracts
  const effectiveLimit = isUnlimited(limit) ? -1 : limit + extraPaid;

  if (isUnlimited(limit)) {
    return {
      allowed: true,
      currentUsage,
      limit: -1,
      isUnlimited: true,
    };
  }

  if (currentUsage < effectiveLimit) {
    return {
      allowed: true,
      currentUsage,
      limit: effectiveLimit,
      isUnlimited: false,
    };
  }

  // Limit reached - provide upgrade options
  const upgradeOptions = getUpgradeOptions(plan).map((upgradePlan) => ({
    plan: upgradePlan,
    name: SUBSCRIPTION_NAMES[upgradePlan],
    price: SUBSCRIPTION_PLANS[upgradePlan].price,
    newLimit: SUBSCRIPTION_PLANS[upgradePlan].contractsPerMonth,
  }));

  return {
    allowed: false,
    currentUsage,
    limit: effectiveLimit,
    isUnlimited: false,
    upgradeOptions,
    singleContractPrice: SINGLE_CONTRACT_PRICE,
  };
}

/**
 * Check if user can use AI clarification
 */
export async function checkClarificationLimit(
  userId: string,
  documentId?: string,
): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId);
  const planConfig = SUBSCRIPTION_PLANS[plan];
  await getOrCreateUsageRecord(userId);
  const currentPeriodStart = getCurrentPeriodStart();
  const currentUsage = await prisma.clarificationUsage.count({
    where: { userId, periodStart: currentPeriodStart },
  });
  const alreadyUsedForDoc =
    documentId &&
    (await prisma.clarificationUsage.findFirst({
      where: { userId, documentId, periodStart: currentPeriodStart },
    }));

  const limit = planConfig.aiClarifications;

  if (alreadyUsedForDoc) {
    return {
      allowed: true,
      currentUsage,
      limit: isUnlimited(limit) ? -1 : limit,
      isUnlimited: isUnlimited(limit),
    };
  }

  if (isUnlimited(limit)) {
    return {
      allowed: true,
      currentUsage,
      limit: -1,
      isUnlimited: true,
    };
  }

  if (currentUsage < limit) {
    return {
      allowed: true,
      currentUsage,
      limit,
      isUnlimited: false,
    };
  }

  // Limit reached - provide upgrade options
  const upgradeOptions = getUpgradeOptions(plan).map((upgradePlan) => ({
    plan: upgradePlan,
    name: SUBSCRIPTION_NAMES[upgradePlan],
    price: SUBSCRIPTION_PLANS[upgradePlan].price,
    newLimit: SUBSCRIPTION_PLANS[upgradePlan].aiClarifications,
  }));

  return {
    allowed: false,
    currentUsage,
    limit,
    isUnlimited: false,
    upgradeOptions,
  };
}

/**
 * Check if user can create a new template
 */
export async function checkTemplateLimit(userId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId);
  const planConfig = SUBSCRIPTION_PLANS[plan];

  const limit = planConfig.maxTemplates;

  // Count user's templates
  const currentUsage = await prisma.template.count({
    where: { createdById: userId },
  });

  if (isUnlimited(limit)) {
    return {
      allowed: true,
      currentUsage,
      limit: -1,
      isUnlimited: true,
    };
  }

  if (currentUsage < limit) {
    return {
      allowed: true,
      currentUsage,
      limit,
      isUnlimited: false,
    };
  }

  // Limit reached - provide upgrade options
  const upgradeOptions = getUpgradeOptions(plan).map((upgradePlan) => ({
    plan: upgradePlan,
    name: SUBSCRIPTION_NAMES[upgradePlan],
    price: SUBSCRIPTION_PLANS[upgradePlan].price,
    newLimit: SUBSCRIPTION_PLANS[upgradePlan].maxTemplates,
  }));

  return {
    allowed: false,
    currentUsage,
    limit,
    isUnlimited: false,
    upgradeOptions,
  };
}

/**
 * Check if user's plan has a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: 'riskCheck' | 'sections' | 'statuses' | 'docxExport' | 'prioritySupport',
): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const planConfig = SUBSCRIPTION_PLANS[plan];

  switch (feature) {
    case 'riskCheck':
      return planConfig.hasRiskCheck;
    case 'sections':
      return planConfig.hasSections;
    case 'statuses':
      return planConfig.hasStatuses;
    case 'docxExport':
      return planConfig.exportFormats.includes('docx');
    case 'prioritySupport':
      return planConfig.hasPrioritySupport;
    default:
      return false;
  }
}

/**
 * Increment contract usage counter
 */
export async function incrementContractUsage(userId: string): Promise<void> {
  await getOrCreateUsageRecord(userId);
  await prisma.usageRecord.update({
    where: { userId },
    data: {
      contractsThisMonth: { increment: 1 },
    },
  });
}

/**
 * Increment clarification usage counter
 */
export async function incrementClarificationUsage(userId: string, documentId: string): Promise<void> {
  await getOrCreateUsageRecord(userId);
  const currentPeriodStart = getCurrentPeriodStart();

  const existing = await prisma.clarificationUsage.findFirst({
    where: { userId, documentId, periodStart: currentPeriodStart },
  });

  if (existing) {
    return;
  }

  await prisma.$transaction([
    prisma.clarificationUsage.create({
      data: {
        userId,
        documentId,
        periodStart: currentPeriodStart,
      },
    }),
    prisma.usageRecord.update({
      where: { userId },
      data: {
        clarificationsUsed: { increment: 1 },
      },
    }),
  ]);
}

/**
 * Add extra paid contract
 */
export async function addExtraContractPaid(userId: string): Promise<void> {
  await getOrCreateUsageRecord(userId);
  await prisma.usageRecord.update({
    where: { userId },
    data: {
      extraContractsPaid: { increment: 1 },
    },
  });
}

/**
 * Get user's usage summary
 */
export async function getUsageSummary(userId: string) {
  const plan = await getUserPlan(userId);
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const usage = await getOrCreateUsageRecord(userId);
  const currentPeriodStart = getCurrentPeriodStart();
  const clarificationsUsed = await prisma.clarificationUsage.count({
    where: { userId, periodStart: currentPeriodStart },
  });

  const templateCount = await prisma.template.count({
    where: { createdById: userId },
  });

  return {
    plan,
    planName: SUBSCRIPTION_NAMES[plan],
    contracts: {
      used: usage.contractsThisMonth,
      limit: planConfig.contractsPerMonth,
      extraPaid: usage.extraContractsPaid,
      isUnlimited: isUnlimited(planConfig.contractsPerMonth),
    },
    clarifications: {
      used: clarificationsUsed,
      limit: planConfig.aiClarifications,
      isUnlimited: isUnlimited(planConfig.aiClarifications),
    },
    templates: {
      used: templateCount,
      limit: planConfig.maxTemplates,
      isUnlimited: isUnlimited(planConfig.maxTemplates),
    },
    features: {
      hasRiskCheck: planConfig.hasRiskCheck,
      hasSections: planConfig.hasSections,
      hasStatuses: planConfig.hasStatuses,
      hasDocxExport: planConfig.exportFormats.includes('docx'),
      hasVersions: planConfig.hasVersions,
      hasPrioritySupport: planConfig.hasPrioritySupport,
    },
    periodStart: usage.periodStart,
  };
}
