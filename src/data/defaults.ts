import type { Dish, ShopConfig, SpinSlice } from '../types';

export const STORAGE_KEYS = {
  SHOP: 'royal_biryani_shop_v1',
  MENU: 'royal_biryani_menu_v1',
  SPIN: 'royal_biryani_spin_v1',
  CART: 'royal_biryani_cart_v1',
} as const;

export const FREE_DELIVERY_THRESHOLD = 199;
export const STANDARD_DELIVERY_CHARGE = 49;

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  name: 'রয়েল বিরিয়ানি ও ফাস্ট ফুড',
  address: 'বাজার মোড়, মেইন রোড',
  rating: '৪.৯',
  statusText: 'এখন গরম খাবার তৈরি হচ্ছে • ৩০ মিনিটে ডেলিভারি',
  whatsappNumber: '918649853354',
  heroImage:
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1400&q=85',
};

export const DEFAULT_MENU: Dish[] = [
  {
    id: 'special-chicken-biryani',
    name: 'স্পেশাল চিকেন বিরিয়ানি',
    category: 'biryani',
    price: 130,
    oldPrice: 160,
    description:
      'সুগন্ধি দেরাদুন বাসমতি চাল, রসালো বড় চিকেন পিস ও কলকাতা স্পেশাল আলু দিয়ে দমে রান্না।',
    image:
      'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 বেস্টসেলার',
  },
  {
    id: 'shahi-mutton-biryani',
    name: 'শাহী মাটন বিরিয়ানি',
    category: 'biryani',
    price: 190,
    oldPrice: 230,
    description:
      'নরম রেওয়াজি খাসির মাংস, কেশর, ঘি ও শাহী মশলার অতুলনীয় সুবাসে তৈরি স্পেশাল বিরিয়ানি।',
    image:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    badge: '⭐ শেফ স্পেশাল',
  },
  {
    id: 'egg-chicken-biryani',
    name: 'এগ চিকেন বিরিয়ানি',
    category: 'biryani',
    price: 150,
    oldPrice: 180,
    description:
      'স্পেশাল চিকেন বিরিয়ানির সাথে ১টি গোটা সেদ্ধ ডিম, নরম আলু ও বেরেস্তার দারুণ কম্বো।',
    image:
      'https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 বেস্টসেলার',
  },
  {
    id: 'egg-chicken-chowmein',
    name: 'এগ চিকেন চাউমিন',
    category: 'fastfood',
    price: 70,
    oldPrice: 90,
    description:
      'হাই-ফ্লেমে ভাজা হাক্কা নুডলস, কুচানো চিকেন, ভাজা ডিম ও তাজা সবজির স্ট্রিট-স্টাইল স্বাদ।',
    image:
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 বেস্টসেলার',
  },
  {
    id: 'double-egg-chicken-roll',
    name: 'ডাবল এগ চিকেন রোল',
    category: 'fastfood',
    price: 65,
    oldPrice: 80,
    description:
      'মচমচে লাচ্ছা পরোটায় ডাবল ডিম, জুসি চিকেন টিক্কা, কাঁচা পেঁয়াজ, চাট মশলা ও লেবুর রস।',
    image:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    badge: '⭐ শেফ স্পেশাল',
  },
  {
    id: 'mixed-chowmein',
    name: 'মিক্সড চাউমিন',
    category: 'fastfood',
    price: 90,
    oldPrice: 115,
    description:
      'চিকেন, কুচো চিংড়ি, ডিম ও স্পেশাল চিলি সসে ভরপুর আমাদের দারুণ টেস্টি মিক্সড চাউমিন।',
    image:
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80',
    badge: '',
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

export function loadShopConfig(): ShopConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOP);
    if (!raw) return DEFAULT_SHOP_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ShopConfig>;
    return {
      ...DEFAULT_SHOP_CONFIG,
      ...parsed,
    };
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
      return parsed as Dish[];
    }
    return DEFAULT_MENU;
  } catch {
    return DEFAULT_MENU;
  }
}
