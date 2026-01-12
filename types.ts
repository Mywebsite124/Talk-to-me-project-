
export enum SubscriptionPlan {
  TRIAL = 'trial',
  WEEKLY = 'weekly',
  BEST_VALUE = 'best_value'
}

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: string;
  duration: string;
  features: string[];
  recommended?: boolean;
}

export interface UserProfile {
  name: string;
  bio: string;
  images: string[];
}

export interface AppConfig {
  userName: string;
  images: string[];
  trialPrice: string;
  weeklyPrice: string;
  bestValuePrice: string;
  trialRedirectUrl: string;
  premiumRedirectUrl: string;
}
