import { DEFAULT_MENU, DEFAULT_SHOP_CONFIG, LIVE_WINNERS_TICKER } from '../data/defaults';
import type { Dish, Language, ShopConfig, SpinPrizeId, SpinSlice } from '../types';
import { formatRupees, toBengaliDigits } from './bengali';

const BENGALI_TO_WESTERN: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function toWesternDigits(value: string): string {
  return value.replace(/[০-৯]/g, (ch) => BENGALI_TO_WESTERN[ch] ?? ch);
}

export function formatDigits(value: number | string, lang: Language): string {
  return lang === 'bn' ? toBengaliDigits(value) : toWesternDigits(String(value));
}

export function formatCurrency(amount: number, lang: Language): string {
  const rounded = Math.max(0, Math.round(amount));
  return lang === 'bn' ? formatRupees(rounded) : `₹${rounded}`;
}

export const LIVE_WINNERS_TICKER_EN: string[] = [
  '🎉 Suman Mondal just won 10% OFF!',
  "🔥 Today's Mega Winner: Amit Das won 1 Plate Free Biryani!",
  '🥤 Riya Ghosh just won a Free Cold Drink!',
  '🥚 Tanmoy Roy just won a Free Extra Egg!',
  '💸 Priyanka Sen just won ₹30 OFF!',
  '🍛 Sourav Banerjee just ordered Shahi Mutton Biryani!',
  '🎉 Kaushik Pal just won 10% OFF!',
];

export function getLiveWinnersTicker(lang: Language): string[] {
  return lang === 'bn' ? LIVE_WINNERS_TICKER : LIVE_WINNERS_TICKER_EN;
}

const DEFAULT_DISH_EN_MAP: Record<string, { name: string; description: string }> =
  Object.fromEntries(
    DEFAULT_MENU.map((d) => [
      d.id,
      {
        name: d.nameEn || d.name,
        description: d.descriptionEn || d.description,
      },
    ])
  );

export function getDishCopy(
  dish: Dish,
  lang: Language
): { name: string; description: string; badge: string } {
  if (lang === 'bn') {
    return {
      name: dish.name,
      description: dish.description,
      badge: dish.badge ?? '',
    };
  }

  const fallback = DEFAULT_DISH_EN_MAP[dish.id];
  const name = dish.nameEn || fallback?.name || dish.name;
  const description =
    dish.descriptionEn || fallback?.description || dish.description;

  let badge = '';
  if (dish.badge === '🔥 বেস্টসেলার') {
    badge = '🔥 Bestseller';
  } else if (dish.badge === '⭐ শেফ স্পেশাল') {
    badge = '⭐ Chef Special';
  } else if (dish.badge) {
    badge = dish.badge;
  }

  return { name, description, badge };
}

export function getShopCopy(shop: ShopConfig, lang: Language) {
  const subtitle = (
    shop.subtitle?.trim() ||
    DEFAULT_SHOP_CONFIG.subtitle ||
    ''
  ).trim();

  if (lang === 'bn') {
    return {
      name: shop.name,
      subtitle,
      address: shop.address,
      rating: shop.rating,
      statusText: shop.statusText,
      deliveryRadiusText: shop.deliveryRadiusText.trim() || '৫ কিমি',
      serviceChargeLabel:
        shop.serviceChargeLabel.trim() || 'প্যাকেজিং ও GST চার্জ',
    };
  }

  const name =
    shop.nameEn?.trim() ||
    (shop.name.trim() === DEFAULT_SHOP_CONFIG.name ? 'Appayon' : shop.name);

  const trimmedAddr = shop.address.trim();
  const address =
    trimmedAddr === DEFAULT_SHOP_CONFIG.address ||
    trimmedAddr === 'বাজার মোড়, মেইন রোড'
      ? 'Bazar More, Main Road, West Bengal'
      : shop.address;

  const rating = toWesternDigits(shop.rating || '4.9');

  const statusText =
    shop.statusText.trim() === DEFAULT_SHOP_CONFIG.statusText
      ? 'Cooking Fresh & Hot Now • 30 Min Delivery'
      : shop.statusText;

  const rawRadius = shop.deliveryRadiusText.trim() || '৫ কিমি';
  const deliveryRadiusText = rawRadius
    .replace(/কিমি|কিলোমিটার/g, 'km')
    .replace(/[০-৯]/g, (ch) => BENGALI_TO_WESTERN[ch] ?? ch);

  const rawChargeLabel =
    shop.serviceChargeLabel.trim() || 'প্যাকেজিং ও GST চার্জ';
  const serviceChargeLabel =
    rawChargeLabel === 'প্যাকেজিং ও GST চার্জ'
      ? 'Packaging & GST'
      : rawChargeLabel === 'প্যাকেজিং ও সার্ভিস চার্জ'
      ? 'Packaging & Service Charge'
      : rawChargeLabel;

  return {
    name,
    subtitle,
    address,
    rating,
    statusText,
    deliveryRadiusText,
    serviceChargeLabel,
  };
}

const SPIN_SLICE_EN: Record<
  SpinPrizeId,
  {
    wheelLabel: string;
    shortTitle: string;
    fullLabel: string;
    conditionText: string;
    jackpotTag: string;
  }
> = {
  free_biryani: {
    wheelLabel: '1 Plate Free\nBiryani!',
    shortTitle: '🍛 1 Plate Free Biryani!',
    fullLabel: '🍛 1 Plate Free Biryani!',
    conditionText: 'Mega Jackpot Prize',
    jackpotTag: '★ MEGA ★',
  },
  discount_10_pct: {
    wheelLabel: '10% OFF\n(₹199+ Order)',
    shortTitle: '🎉 10% OFF (₹199+ Order)',
    fullLabel: '🎉 10% OFF (on ₹199+ orders)',
    conditionText: 'Valid on orders of ₹199 or more',
    jackpotTag: '',
  },
  free_cold_drink: {
    wheelLabel: 'Free Cold\nDrink (₹249+)',
    shortTitle: '🥤 Free Cold Drink (₹249+)',
    fullLabel: '🥤 Free Cold Drink (on ₹249+ orders)',
    conditionText: '1 Free Cold Drink on orders of ₹249+',
    jackpotTag: '',
  },
  free_extra_egg: {
    wheelLabel: 'Free Extra\nEgg (Biryani)',
    shortTitle: '🥚 Free Extra Egg (Biryani)',
    fullLabel: '🥚 Free Extra Egg (with Biryani)',
    conditionText: 'Free with any Biryani order',
    jackpotTag: '',
  },
  discount_30_flat: {
    wheelLabel: '₹30 OFF\n(₹299+ Order)',
    shortTitle: '💸 ₹30 OFF (₹299+ Order)',
    fullLabel: '💸 ₹30 OFF (on ₹299+ orders)',
    conditionText: 'Flat ₹30 OFF on orders of ₹299+',
    jackpotTag: '',
  },
};

export function getSpinSliceCopy(slice: SpinSlice, lang: Language) {
  if (lang === 'bn') {
    return {
      wheelLabel: slice.wheelLabel,
      shortTitle: slice.shortTitle,
      fullLabel: slice.fullLabel,
      conditionText: slice.conditionText,
      jackpotTag: '★ মেগা ★',
    };
  }
  return SPIN_SLICE_EN[slice.id];
}
