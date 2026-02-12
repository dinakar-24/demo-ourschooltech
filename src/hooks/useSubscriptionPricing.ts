import { useSystemSettings } from './useSystemSettings';

interface SubscriptionPricing {
  price_per_student: number;
  currency: string;
  billing_cycle: string;
}

const DEFAULT_PRICING: SubscriptionPricing = {
  price_per_student: 250,
  currency: 'INR',
  billing_cycle: 'yearly',
};

export function useSubscriptionPricing() {
  const { getSetting, isLoading } = useSystemSettings();

  const pricing = getSetting<SubscriptionPricing>('subscription_pricing', DEFAULT_PRICING);

  return {
    pricing,
    isLoading,
    pricePerStudent: pricing.price_per_student,
    currency: pricing.currency,
    billingCycle: pricing.billing_cycle,
  };
}
