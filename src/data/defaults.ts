import type {
  CloudOrder,
  CustomerReview,
  DeveloperControlConfig,
  Dish,
  Language,
  SavedOrder,
  ShopConfig,
  SpinSlice,
} from '../types';

export const STORAGE_KEYS = {
  SHOP: 'royal_biryani_shop_v1',
  MENU: 'royal_biryani_menu_v1',
  SPIN: 'royal_biryani_spin_v1',
  SPIN_REWARDS: 'royal_biryani_spin_rewards_v1',
  DEVELOPER_CONTROL: 'royal_biryani_dev_ctrl_v1',
  CART: 'royal_biryani_cart_v1',
  LANG: 'royal_biryani_lang_v1',
  ORDERS: 'royal_biryani_orders_v1',
  CLOUD_ORDERS_CACHE: 'royal_biryani_cloud_orders_log_v1',
  REVIEWS: 'royal_biryani_reviews_v1',
  THEME: 'royal_biryani_theme_v1',
} as const;

export const BASE_HISTORICAL_REVIEW_COUNT = 124;
export const BASE_HISTORICAL_RATING_SUM = 607.6; // 124 * 4.9 => starts at 4.9 across 128 reviews with 4 seed cards

export const LEGACY_DEFAULT_SHOP_NAMES = [
  'রয়েল বিরিয়ানি ও ফাস্ট ফুড',
  'রয়েল বিরিয়ানি ও ফাস্ট ফুড',
  'Royal Biryani & Fast Food',
] as const;

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  name: 'আপ্যায়ন',
  nameEn: 'Appayon',
  subtitle: 'আপ্যায়ন রেস্টুরেন্ট ও ফাস্ট ফুড • Appayon Restaurant & Fast Food',
  address: 'বাজার মোড়, মেইন রোড',
  rating: '৪.৯',
  statusText: 'এখন গরম খাবার তৈরি হচ্ছে • ৩০ মিনিটে ডেলিভারি',
  whatsappNumber: '918649853354',
  heroImage:
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1400&q=85',
  serviceChargeEnabled: true,
  serviceChargeType: 'percentage',
  serviceChargeValue: 5,
  serviceChargeLabel: 'প্যাকেজিং ও GST চার্জ',
  deliveryRadiusText: '৫ কিমি',
  shopLat: 22.5726,
  shopLng: 88.3639,
  maxDeliveryKm: 5,
};

export const DEFAULT_MENU: Dish[] = [
  {
    id: 'special-chicken-biryani',
    name: 'স্পেশাল চিকেন বিরিয়ানি',
    nameEn: 'Special Chicken Biryani',
    category: 'biryani',
    price: 130,
    oldPrice: 160,
    description:
      'সুগন্ধি দেরাদুন বাসমতি চাল, রসালো বড় চিকেন পিস ও কলকাতা স্পেশাল আলু দিয়ে দমে রান্না।',
    descriptionEn:
      'Fragrant Dehradun basmati rice slow-cooked on dum with tender chicken leg and signature Kolkata spiced potato.',
    image:
      'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 বেস্টসেলার',
    inStock: true,
  },
  {
    id: 'shahi-mutton-biryani',
    name: 'শাহী মাটন বিরিয়ানি',
    nameEn: 'Shahi Mutton Biryani',
    category: 'biryani',
    price: 190,
    oldPrice: 230,
    description:
      'নরম রেওয়াজি খাসির মাংস, কেশর, ঘি ও শাহী মশলার অতুলনীয় সুবাসে তৈরি স্পেশাল বিরিয়ানি।',
    descriptionEn:
      'Melt-in-the-mouth slow-cooked mutton, saffron strands, pure ghee, and royal aromatic spices.',
    image:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    badge: '⭐ শেফ স্পেশাল',
    inStock: true,
  },
  {
    id: 'egg-chicken-biryani',
    name: 'এগ চিকেন বিরিয়ানি',
    nameEn: 'Egg Chicken Biryani',
    category: 'biryani',
    price: 150,
    oldPrice: 180,
    description:
      'স্পেশাল চিকেন বিরিয়ানির সাথে ১টি গোটা সেদ্ধ ডিম, নরম আলু ও বেরেস্তার দারুণ কম্বো।',
    descriptionEn:
      'Our classic Chicken Biryani upgraded with a whole boiled egg, golden potato, and crispy birista.',
    image:
      'https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 বেস্টসেলার',
    inStock: true,
  },
  {
    id: 'egg-chicken-chowmein',
    name: 'এগ চিকেন চাউমিন',
    nameEn: 'Egg Chicken Chowmein',
    category: 'fastfood',
    price: 70,
    oldPrice: 90,
    description:
      'হাই-ফ্লেমে ভাজা হাক্কা নুডলস, কুচানো চিকেন, ভাজা ডিম ও তাজা সবজির স্ট্রিট-স্টাইল স্বাদ।',
    descriptionEn:
      'High-flame wok-tossed Hakka noodles loaded with shredded chicken, scrambled egg, and crunchy veggies.',
    image:
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 বেস্টসেলার',
    inStock: true,
  },
  {
    id: 'double-egg-chicken-roll',
    name: 'ডাবল এগ চিকেন রোল',
    nameEn: 'Double Egg Chicken Roll',
    category: 'fastfood',
    price: 65,
    oldPrice: 80,
    description:
      'মচমচে লাচ্ছা পরোটায় ডাবল ডিম, জুসি চিকেন টিক্কা, কাঁচা পেঁয়াজ, চাট মশলা ও লেবুর রস।',
    descriptionEn:
      'Flaky laccha paratha layered with double egg, juicy chicken tikka, sliced onions, chaat masala, and fresh lime.',
    image:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    badge: '⭐ শেফ স্পেশাল',
    inStock: true,
  },
  {
    id: 'mixed-chowmein',
    name: 'মিক্সড চাউমিন',
    nameEn: 'Special Mixed Chowmein',
    category: 'fastfood',
    price: 90,
    oldPrice: 115,
    description:
      'চিকেন, কুচো চিংড়ি, ডিম ও স্পেশাল চিলি সসে ভরপুর আমাদের দারুণ টেস্টি মিক্সড চাউমিন।',
    descriptionEn:
      'Signature wok-fried noodles generously packed with juicy chicken, baby prawns, egg, and house chili glaze.',
    image:
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80',
    badge: '',
    inStock: true,
  },
];

/**
 * 5 Wheel Slices — Grand Jackpot ("১ প্লেট ফ্রি বিরিয়ানি!") has 0 weight for regular spins
 * to protect restaurant profit while providing exciting jackpot visibility.
 */
export const SPIN_SLICES: SpinSlice[] = [
  {
    id: 'free_biryani',
    wheelLabel: '১ প্লেট ফ্রি\nবিরিয়ানি!',
    shortTitle: '🍛 ১ প্লেট ফ্রি বিরিয়ানি!',
    fullLabel: '🍛 ১ প্লেট ফ্রি বিরিয়ানি!',
    conditionText: 'মেগা জ্যাকপট পুরস্কার',
    color: '#ffb703',
    textColor: '#1d1e2c',
    weight: 0,
    isJackpot: true,
  },
  {
    id: 'discount_10_pct',
    wheelLabel: '১০% ছাড়\n(₹১৯৯+ অর্ডার)',
    shortTitle: '🎉 ১০% ছাড় (₹১৯৯+ অর্ডারে)',
    fullLabel: '🎉 ১০% ছাড় (₹১৯৯+ অর্ডারে)',
    conditionText: 'ন্যূনতম ₹১৯৯ অর্ডারে প্রযোজ্য',
    color: '#d90429',
    textColor: '#ffffff',
    weight: 30,
  },
  {
    id: 'free_cold_drink',
    wheelLabel: 'ফ্রি কোল্ড\nড্রিংক (₹২৪৯+)',
    shortTitle: '🥤 ফ্রি কোল্ড ড্রিংক (₹২৪৯+ অর্ডারে)',
    fullLabel: '🥤 ফ্রি কোল্ড ড্রিংক (₹২৪৯+ অর্ডারে)',
    conditionText: 'ন্যূনতম ₹২৪৯ অর্ডারে ১টি কোল্ড ড্রিংক ফ্রি',
    color: '#0f766e',
    textColor: '#ffffff',
    weight: 25,
  },
  {
    id: 'free_extra_egg',
    wheelLabel: 'ফ্রি এক্সট্রা\nডিম (বিরিয়ানি)',
    shortTitle: '🥚 ফ্রি এক্সট্রা ডিম (বিরিয়ানি অর্ডারে)',
    fullLabel: '🥚 ফ্রি এক্সট্রা ডিম (বিরিয়ানি অর্ডারে)',
    conditionText: 'যেকোনো বিরিয়ানি অর্ডারের সাথে ফ্রি',
    color: '#ea580c',
    textColor: '#ffffff',
    weight: 25,
  },
  {
    id: 'discount_30_flat',
    wheelLabel: '₹৩০ ছাড়\n(₹২৯৯+ অর্ডার)',
    shortTitle: '💸 ₹৩০ ছাড় (₹২৯৯+ অর্ডারে)',
    fullLabel: '💸 ₹৩০ ছাড় (₹২৯৯+ অর্ডারে)',
    conditionText: 'ন্যূনতম ₹২৯৯ অর্ডারে ₹৩০ ছাড়',
    color: '#1d1e2c',
    textColor: '#ffd166',
    weight: 20,
  },
];

export const LIVE_WINNERS_TICKER: string[] = [
  '🎉 এইমাত্র সুমন মণ্ডল জিতলেন ১০% ছাড়!',
  '🔥 আজকের মেগা উইনার: অমিত দাস জিতলেন ১ প্লেট ফ্রি বিরিয়ানি!',
  '🥤 রিয়া ঘোষ জিতলেন ফ্রি কোল্ড ড্রিংক!',
  '🥚 তন্ময় রায় জিতলেন ফ্রি এক্সট্রা ডিম!',
  '💸 প্রিয়াঙ্কা সেন জিতলেন ₹৩০ ছাড়!',
  '🍛 সৌরভ ব্যানার্জী এইমাত্র অর্ডার করলেন শাহী মাটন বিরিয়ানি!',
  '🎉 কৌশিক পাল জিতলেন ১০% ছাড়!',
];

export function normalizeShopBranding(raw: Partial<ShopConfig>): ShopConfig {
  const merged: ShopConfig = {
    ...DEFAULT_SHOP_CONFIG,
    ...raw,
  };
  const trimmedName = (merged.name || '').trim();
  const isLegacyName = (LEGACY_DEFAULT_SHOP_NAMES as readonly string[]).includes(
    trimmedName
  );
  if (!trimmedName || isLegacyName) {
    merged.name = DEFAULT_SHOP_CONFIG.name;
    if (!raw.nameEn || (LEGACY_DEFAULT_SHOP_NAMES as readonly string[]).includes(raw.nameEn.trim())) {
      merged.nameEn = DEFAULT_SHOP_CONFIG.nameEn;
    }
  }
  if (!merged.subtitle || !merged.subtitle.trim()) {
    merged.subtitle = DEFAULT_SHOP_CONFIG.subtitle;
  }
  return merged;
}

export function loadShopConfig(): ShopConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOP);
    if (!raw) return DEFAULT_SHOP_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ShopConfig>;
    return normalizeShopBranding(parsed);
  } catch {
    return DEFAULT_SHOP_CONFIG;
  }
}

export function loadMenuDishes(): Dish[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU);
    if (!raw) return DEFAULT_MENU;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as Dish[]).map((d) => ({
        ...d,
        inStock: d.inStock !== false,
      }));
    }
    return DEFAULT_MENU;
  } catch {
    return DEFAULT_MENU;
  }
}

export const DEFAULT_REVIEWS: CustomerReview[] = [
  {
    id: 'seed-rev-1',
    name: 'অরিন্দম চক্রবর্তী',
    nameEn: 'Arindam Chakraborty',
    rating: 5,
    comment:
      'বিরিয়ানির স্বাদ অসাধারণ, একদম গরম গরম ডেলিভারি পেয়েছি! চিকেনের পিস আর আলু দুটোই দারুণ ছিল।',
    commentEn:
      'Amazing biryani taste and delivered piping hot! Both the chicken piece and Kolkata potato were top-notch.',
    createdAt: '2026-11-20T14:30:00.000Z',
    dateLabelBn: '২ দিন আগে',
    dateLabelEn: '2 days ago',
  },
  {
    id: 'seed-rev-2',
    name: 'মৌমিতা দাস',
    nameEn: 'Moumita Das',
    rating: 5,
    comment:
      'শাহী মাটন বিরিয়ানি আর ডাবল এগ চিকেন রোল অর্ডার করেছিলাম। প্যাকিং খুব সুন্দর আর ফ্রি ডেলিভারি দারুণ লেগেছে।',
    commentEn:
      'Ordered Shahi Mutton Biryani and Double Egg Chicken Roll. Very neat packaging and loved the free home delivery.',
    createdAt: '2026-11-18T19:15:00.000Z',
    dateLabelBn: '৪ দিন আগে',
    dateLabelEn: '4 days ago',
  },
  {
    id: 'seed-rev-3',
    name: 'শুভজিৎ মণ্ডল',
    nameEn: 'Subhajit Mondal',
    rating: 5,
    comment:
      'স্পিন হুইলে ১০% ছাড় জিতেছিলাম, সরাসরি বিলে ছাড় পেয়ে গেছি! ২৫ মিনিটের মধ্যে বাড়িতে খাবার পৌঁছে গেছে।',
    commentEn:
      'Won 10% OFF on the spin wheel and got instant discount on the bill! Delivered to my doorstep in 25 minutes.',
    createdAt: '2026-11-15T13:05:00.000Z',
    dateLabelBn: '১ সপ্তাহ আগে',
    dateLabelEn: '1 week ago',
  },
  {
    id: 'seed-rev-4',
    name: 'সৌমেন পাল',
    nameEn: 'Soumen Pal',
    rating: 4,
    comment:
      'মিক্সড চাউমিন আর এগ চিকেন বিরিয়ানি দুটোই খুব টেস্টি ছিল। পরিমাণও বেশ ভালো।',
    commentEn:
      'Both Mixed Chowmein and Egg Chicken Biryani were super tasty with generous portion sizes.',
    createdAt: '2026-11-12T20:40:00.000Z',
    dateLabelBn: '১ সপ্তাহ আগে',
    dateLabelEn: '1 week ago',
  },
];

export function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn';
  }
}

export function loadSavedOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3) as SavedOrder[];
    }
    return [];
  } catch {
    return [];
  }
}

export function loadCustomerReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!raw) return DEFAULT_REVIEWS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as CustomerReview[];
    }
    return DEFAULT_REVIEWS;
  } catch {
    return DEFAULT_REVIEWS;
  }
}

export const DEFAULT_DEVELOPER_CONTROL: DeveloperControlConfig = {
  serviceActive: true,
  subscriptionExpiry: '2027-12-31',
  developerBrandName: 'Soumdip Digital',
  developerWhatsapp: '918649853354',
};

export function loadSpinRewards(): SpinSlice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SPIN_REWARDS);
    if (!raw) return SPIN_SLICES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SpinSlice[];
    }
    return SPIN_SLICES;
  } catch {
    return SPIN_SLICES;
  }
}

export function loadDeveloperControl(): DeveloperControlConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEVELOPER_CONTROL);
    if (!raw) return DEFAULT_DEVELOPER_CONTROL;
    const parsed = JSON.parse(raw) as Partial<DeveloperControlConfig>;
    return {
      ...DEFAULT_DEVELOPER_CONTROL,
      ...parsed,
    };
  } catch {
    return DEFAULT_DEVELOPER_CONTROL;
  }
}

export function isSubscriptionBlocked(
  ctrl: DeveloperControlConfig,
  todayKey: string
): { blocked: boolean; reason: 'paused' | 'expired' | null } {
  if (!ctrl.serviceActive) {
    return { blocked: true, reason: 'paused' };
  }
  const expiry = (ctrl.subscriptionExpiry || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(expiry) && todayKey > expiry) {
    return { blocked: true, reason: 'expired' };
  }
  return { blocked: false, reason: null };
}

export function loadCachedCloudOrders(): CloudOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLOUD_ORDERS_CACHE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 100) as CloudOrder[];
    }
    return [];
  } catch {
    return [];
  }
}

export function loadDarkMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
  } catch {
    return false;
  }
}
