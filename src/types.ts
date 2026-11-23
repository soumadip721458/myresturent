export type MenuCategory = 'all' | 'biryani' | 'fastfood';

export type DishCategory = 'biryani' | 'fastfood';

export type DishBadge = '' | '🔥 বেস্টসেলার' | '⭐ শেফ স্পেশাল';

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  price: number;
  oldPrice?: number;
  description: string;
  image: string;
  badge?: DishBadge;
}

export interface ShopConfig {
  name: string;
  address: string;
  rating: string;
  statusText: string;
  whatsappNumber: string;
  heroImage: string;
}

export type SpinPrizeId =
  | 'free_biryani'
  | 'discount_10_pct'
  | 'free_cold_drink'
  | 'free_extra_egg'
  | 'discount_30_flat';

export interface SpinSlice {
  id: SpinPrizeId;
  wheelLabel: string;
  shortTitle: string;
  fullLabel: string;
  conditionText: string;
  color: string;
  textColor: string;
  weight: number;
  isJackpot?: boolean;
}

export interface SavedSpinRecord {
  date: string; // YYYY-MM-DD
  prizeId: SpinPrizeId;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
}

export interface OrderPricing {
  subtotal: number;
  itemCount: number;
  hasBiryani: boolean;
  deliveryCharge: number;
  isFreeDelivery: boolean;
  amountForFreeDelivery: number;
  spinDiscountAmount: number;
  spinRewardActive: boolean;
  spinRewardSummary: string;
  spinRewardHint: string;
  menuMrpSavings: number;
  totalSavings: number;
  finalTotal: number;
}
