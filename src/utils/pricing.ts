import {
  FREE_DELIVERY_THRESHOLD,
  SPIN_SLICES,
  STANDARD_DELIVERY_CHARGE,
} from '../data/defaults';
import type {
  CustomerDetails,
  Dish,
  OrderPricing,
  ShopConfig,
  SpinPrizeId,
} from '../types';
import { formatRupees, toBengaliDigits } from './bengali';

export function getSpinSliceById(prizeId: SpinPrizeId | null) {
  if (!prizeId) return null;
  return SPIN_SLICES.find((s) => s.id === prizeId) ?? null;
}

export function calculateOrderPricing(
  dishes: Dish[],
  cart: Record<string, number>,
  wonPrizeId: SpinPrizeId | null
): OrderPricing {
  let subtotal = 0;
  let itemCount = 0;
  let hasBiryani = false;
  let menuMrpSavings = 0;

  for (const dish of dishes) {
    const qty = cart[dish.id] ?? 0;
    if (qty > 0) {
      subtotal += dish.price * qty;
      itemCount += qty;
      if (dish.category === 'biryani') {
        hasBiryani = true;
      }
      if (dish.oldPrice && dish.oldPrice > dish.price) {
        menuMrpSavings += (dish.oldPrice - dish.price) * qty;
      }
    }
  }

  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge =
    itemCount === 0 ? 0 : isFreeDelivery ? 0 : STANDARD_DELIVERY_CHARGE;
  const amountForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  let spinDiscountAmount = 0;
  let spinRewardActive = false;
  let spinRewardSummary = 'কোনো অফার প্রযোজ্য নেই';
  let spinRewardHint = '';

  const slice = getSpinSliceById(wonPrizeId);

  if (slice) {
    switch (slice.id) {
      case 'free_biryani': {
        spinRewardActive = itemCount > 0;
        spinRewardSummary = '🍛 ১ প্লেট ফ্রি বিরিয়ানি (জ্যাকপট)';
        spinRewardHint = 'আপনার অর্ডারের সাথে ১ প্লেট ফ্রি বিরিয়ানি যুক্ত হবে!';
        break;
      }
      case 'discount_10_pct': {
        if (subtotal >= 199) {
          spinDiscountAmount = Math.round(subtotal * 0.1);
          spinRewardActive = true;
          spinRewardSummary = `🎉 ১০% ছাড় (−${formatRupees(spinDiscountAmount)})`;
          spinRewardHint = `অভিনন্দন! আপনার অর্ডারে ${formatRupees(spinDiscountAmount)} ছাড় যুক্ত হয়েছে`;
        } else {
          const needed = 199 - subtotal;
          spinRewardSummary = '🎉 ১০% ছাড় (₹১৯৯+ অর্ডারে প্রযোজ্য)';
          spinRewardHint = `আর ${formatRupees(needed)} যোগ করলেই ১০% ছাড় চালু হবে`;
        }
        break;
      }
      case 'free_cold_drink': {
        if (subtotal >= 249) {
          spinRewardActive = true;
          spinRewardSummary = '🥤 ফ্রি কোল্ড ড্রিংক (যুক্ত হয়েছে)';
          spinRewardHint = 'দারুণ! আপনার অর্ডারের সাথে ১টি ফ্রি কোল্ড ড্রিংক যাবে';
        } else {
          const needed = 249 - subtotal;
          spinRewardSummary = '🥤 ফ্রি কোল্ড ড্রিংক (₹২৪৯+ অর্ডারে প্রযোজ্য)';
          spinRewardHint = `আর ${formatRupees(needed)} যোগ করলেই ফ্রি কোল্ড ড্রিংক পাবেন`;
        }
        break;
      }
      case 'free_extra_egg': {
        if (hasBiryani) {
          spinRewardActive = true;
          spinRewardSummary = '🥚 ফ্রি এক্সট্রা ডিম (বিরিয়ানির সাথে যুক্ত)';
          spinRewardHint = 'দারুণ! আপনার বিরিয়ানির সাথে ১টি এক্সট্রা ডিম ফ্রি পাবেন';
        } else {
          spinRewardSummary = '🥚 ফ্রি এক্সট্রা ডিম (বিরিয়ানি অর্ডারে প্রযোজ্য)';
          spinRewardHint = 'যেকোনো বিরিয়ানি যোগ করলেই ফ্রি এক্সট্রা ডিম চালু হবে';
        }
        break;
      }
      case 'discount_30_flat': {
        if (subtotal >= 299) {
          spinDiscountAmount = 30;
          spinRewardActive = true;
          spinRewardSummary = '💸 ₹৩০ ছাড় (−₹৩০)';
          spinRewardHint = 'অভিনন্দন! আপনার অর্ডারে ₹৩০ ছাড় যুক্ত হয়েছে';
        } else {
          const needed = 299 - subtotal;
          spinRewardSummary = '💸 ₹৩০ ছাড় (₹২৯৯+ অর্ডারে প্রযোজ্য)';
          spinRewardHint = `আর ${formatRupees(needed)} যোগ করলেই ₹৩০ ছাড় চালু হবে`;
        }
        break;
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - spinDiscountAmount + deliveryCharge);
  const deliverySavings = itemCount > 0 && isFreeDelivery ? STANDARD_DELIVERY_CHARGE : 0;
  const totalSavings = menuMrpSavings + spinDiscountAmount + deliverySavings;

  return {
    subtotal,
    itemCount,
    hasBiryani,
    deliveryCharge,
    isFreeDelivery,
    amountForFreeDelivery,
    spinDiscountAmount,
    spinRewardActive,
    spinRewardSummary,
    spinRewardHint,
    menuMrpSavings,
    totalSavings,
    finalTotal,
  };
}

/**
 * Generates a neatly formatted Bengali WhatsApp receipt message & wa.me link.
 */
export function buildWhatsAppOrder(
  shop: ShopConfig,
  dishes: Dish[],
  cart: Record<string, number>,
  customer: CustomerDetails,
  wonPrizeId: SpinPrizeId | null,
  pricing: OrderPricing
): { receiptText: string; whatsappUrl: string } {
  const orderedLines = dishes
    .filter((d) => (cart[d.id] ?? 0) > 0)
    .map((d, idx) => {
      const qty = cart[d.id] ?? 0;
      const lineTotal = d.price * qty;
      return `${toBengaliDigits(idx + 1)}. ${d.name} × ${toBengaliDigits(qty)} = ${formatRupees(lineTotal)}`;
    });

  const deliveryLine = pricing.isFreeDelivery
    ? 'ফ্রি (₹০) 🎉'
    : `${formatRupees(pricing.deliveryCharge)}`;

  const rewardLine = wonPrizeId
    ? pricing.spinRewardActive
      ? pricing.spinRewardSummary
      : `${pricing.spinRewardSummary} (শর্ত পূরণ হয়নি)`
    : 'নেই';

  const lines: string[] = [
    `🍽️ *নতুন ফুড অর্ডার — ${shop.name}*`,
    `━━━━━━━━━━━━━━━━━━`,
    `👤 *গ্রাহকের নাম:* ${customer.name.trim()}`,
    `📞 *মোবাইল নম্বর:* ${customer.phone.trim()}`,
    `📍 *ডেলিভারি ঠিকানা:* ${customer.address.trim()}`,
    `━━━━━━━━━━━━━━━━━━`,
    `📋 *অর্ডার করা খাবার:*`,
    ...orderedLines,
    `━━━━━━━━━━━━━━━━━━`,
    `🧾 *খাবারের মোট মূল্য (Subtotal):* ${formatRupees(pricing.subtotal)}`,
    `🎁 *স্পিন অফার / ছাড়:* ${rewardLine}`,
    `🚚 *ডেলিভারি চার্জ:* ${deliveryLine}`,
    `━━━━━━━━━━━━━━━━━━`,
    `💰 *সর্বমোট দেয় (Cash on Delivery):* *${formatRupees(pricing.finalTotal)}*`,
    `━━━━━━━━━━━━━━━━━━`,
    `🙏 অনুগ্রহ করে আমার অর্ডারটি কনফার্ম করুন।`,
  ];

  const receiptText = lines.join('\n');
  const cleanPhone = shop.whatsappNumber.replace(/\D/g, '') || '919876543210';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptText)}`;

  return { receiptText, whatsappUrl };
}
