export type Language = 'bn' | 'en';

export type MenuCategory = 'all' | 'biryani' | 'fastfood';

export type DishCategory = 'biryani' | 'fastfood';

export type DishBadge = '' | '🔥 বেস্টসেলার' | '⭐ শেফ স্পেশাল';

export interface Dish {
  id: string;
  name: string;
  nameEn?: string;
  category: DishCategory;
  price: number;
  oldPrice?: number;
  description: string;
  descriptionEn?: string;
  image: string;
  badge?: DishBadge;
}

export type ExtraChargeType = 'percentage' | 'flat';

export interface ShopConfig {
  name: string;
  address: string;
  rating: string;
  statusText: string;
  whatsappNumber: string;
  heroImage: string;
  serviceChargeEnabled: boolean;
  serviceChargeType: ExtraChargeType;
  serviceChargeValue: number;
  serviceChargeLabel: string;
  deliveryRadiusText: string;
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
  serviceChargeEnabled: boolean;
  serviceChargeAmount: number;
  serviceChargeDisplayLabel: string;
  spinDiscountAmount: number;
  spinRewardActive: boolean;
  spinRewardSummary: string;
  spinRewardHint: string;
  menuMrpSavings: number;
  totalSavings: number;
  finalTotal: number;
}

export interface SavedOrderItem {
  dishId: string;
  name: string;
  nameEn?: string;
  qty: number;
  priceAtOrder: number;
}

export interface SavedOrder {
  id: string;
  createdAt: string;
  items: SavedOrderItem[];
  total: number;
  customer: CustomerDetails;
}

export interface CustomerReview {
  id: string;
  name: string;
  nameEn?: string;
  rating: number;
  comment: string;
  commentEn?: string;
  createdAt: string;
  dateLabelBn?: string;
  dateLabelEn?: string;
}
