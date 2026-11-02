export type PlanId = 'free' | 'growth' | 'scale';

export interface PlanDefinition {
  id: PlanId;
  label: string;
  maxSubscribers: number;
  maxNotificationsPerDay: number;
}

// Placeholder quotas until pricing is finalised; the backend should enforce its own limits.
export const PLANS: PlanDefinition[] = [
  { id: 'free', label: 'Free', maxSubscribers: 1000, maxNotificationsPerDay: 500 },
  { id: 'growth', label: 'Growth', maxSubscribers: 25000, maxNotificationsPerDay: 10000 },
  { id: 'scale', label: 'Scale', maxSubscribers: 100000, maxNotificationsPerDay: 100000 },
];

export const getPlan = (id: PlanId): PlanDefinition =>
  PLANS.find((plan) => plan.id === id) ?? PLANS[0];
