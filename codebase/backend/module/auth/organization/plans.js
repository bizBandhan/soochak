// Server-side source of truth for plan quotas. Keep in sync with frontend/src/constants/plans.ts display values.
export const PLANS = {
    free: { maxSubscribers: 1000, maxNotificationsPerDay: 500 },
    growth: { maxSubscribers: 25000, maxNotificationsPerDay: 10000 },
    scale: { maxSubscribers: 100000, maxNotificationsPerDay: 100000 }
};

export const DEFAULT_PLAN = "free";
export const PLAN_IDS = Object.keys(PLANS);

export const limitsForPlan = (plan) => ({ ...PLANS[plan] });
