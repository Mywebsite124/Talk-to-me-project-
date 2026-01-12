
import { SubscriptionPlan, PlanDetails, UserProfile, AppConfig } from './types';

export const USER_PROFILE: UserProfile = {
  name: "Alisha Rahman",
  bio: "Fashion enthusiast, traveler, and your future favorite conversation partner. Let's connect and make some memories.",
  images: [] // Managed by config now
};

export const DEFAULT_CONFIG: AppConfig = {
  userName: "Alisha Rahman",
  images: [
    "https://picsum.photos/id/64/800/1000",
    "https://picsum.photos/id/65/800/1000",
    "https://picsum.photos/id/177/800/1000",
    "https://picsum.photos/id/338/800/1000",
    "https://picsum.photos/id/342/800/1000",
    "https://picsum.photos/id/364/800/1000",
    "https://picsum.photos/id/373/800/1000",
    "https://picsum.photos/id/399/800/1000",
    "https://picsum.photos/id/445/800/1000",
    "https://picsum.photos/id/453/800/1000"
  ],
  trialPrice: "$0",
  weeklyPrice: "$29",
  bestValuePrice: "$100",
  trialRedirectUrl: "https://example.com/trial",
  premiumRedirectUrl: "https://example.com/subscribe"
};

export const GET_PLANS = (config: AppConfig): PlanDetails[] => [
  {
    id: SubscriptionPlan.TRIAL,
    name: "Free Trial",
    price: config.trialPrice,
    duration: "One-time",
    features: ["5 Minutes Video Call", "Real-time interaction", "Crystal clear HD audio", "Limited to 1 session"]
  },
  {
    id: SubscriptionPlan.WEEKLY,
    name: "Weekly Premium",
    price: config.weeklyPrice,
    duration: "Per Week",
    features: ["5 Video Calls per week", "Priority scheduling", "Message support", "Ad-free experience"]
  },
  {
    id: SubscriptionPlan.BEST_VALUE,
    name: "Unlimited Elite",
    price: config.bestValuePrice,
    duration: "Per Month",
    recommended: true,
    features: ["Unlimited Video Calls", "Instant Connection", "Private VIP Lounge access", "24/7 Availability", "Exclusive Content Access"]
  }
];
