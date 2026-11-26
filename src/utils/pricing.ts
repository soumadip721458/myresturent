import { SPIN_SLICES } from '../data/defaults';
import type {
  CustomerDetails,
  Dish,
  Language,
  OrderPricing,
  ShopConfig,
  SpinPrizeId,
  SpinSlice,
} from '../types';
import { buildGoogleMapsLink } from './geo';
import {
  formatCurrency,
  formatDigits,
  getDishCopy,
  getShopCopy,
  getSpinSliceCopy,
} from './i18n';

export function getSpinSliceById(
  prizeId: SpinPrizeId | null,
  spinRewards: SpinSlice[] = SPIN_SLICES
) {
  if (!prizeId) return null;
  const list = spinRewards.length > 0 ? spinRewards : SPIN_SLICES;
  return list.find((s) => s.id === prizeId) ?? null;
}

export function formatServiceChargeLabel(
  shop: ShopConfig,
  lang: Language = 'bn'
): string {
  const { serviceChargeLabel } = getShopCopy(shop, lang);
  if (shop.serviceChargeType === 'percentage') {
    const hasPercent =
      serviceChargeLabel.includes('%') || serviceChargeLabel.includes('শতাংশ');
    const suffix = hasPercent
      ? ''
      : ` (${formatDigits(shop.serviceChargeValue, lang)}%)`;
    return `📦 ${serviceChargeLabel}${suffix}`;
  }
  return `📦 ${serviceChargeLabel}`;
}

export function calculateOrderPricing(
  dishes: Dish[],
  cart: Record<string, number>,
  wonPrizeId: SpinPrizeId | null,
  shop: ShopConfig,
  lang: Language = 'bn',
  spinRewards: SpinSlice[] = SPIN_SLICES
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

  const serviceChargeEnabled = Boolean(shop.serviceChargeEnabled);
  const rawChargeValue = Number.isFinite(shop.serviceChargeValue)
    ? Math.max(0, shop.serviceChargeValue)
    : 0;

  let serviceChargeAmount = 0;
  if (itemCount > 0 && serviceChargeEnabled && rawChargeValue > 0) {
    serviceChargeAmount =
      shop.serviceChargeType === 'percentage'
        ? Math.round((subtotal * rawChargeValue) / 100)
        : Math.round(rawChargeValue);
  }

  const serviceChargeDisplayLabel = formatServiceChargeLabel(shop, lang);

  let spinDiscountAmount = 0;
  let spinRewardActive = false;
  let spinRewardSummary =
    lang === 'bn' ? 'কোনো অফার প্রযোজ্য নেই' : 'No offer applied';
  let spinRewardHint = '';

  const slice = getSpinSliceById(wonPrizeId, spinRewards);

  if (slice) {
    const isBn = lang === 'bn';
    switch (slice.id) {
      case 'free_biryani': {
        spinRewardActive = itemCount > 0;
        spinRewardSummary = isBn
          ? '🍛 ১ প্লেট ফ্রি বিরিয়ানি (জ্যাকপট)'
          : '🍛 1 Plate Free Biryani (Jackpot)';
        spinRewardHint = isBn
          ? 'আপনার অর্ডারের সাথে ১ প্লেট ফ্রি বিরিয়ানি যুক্ত হবে!'
          : '1 Plate Free Biryani will be included with your order!';
        break;
      }
      case 'discount_10_pct': {
        if (subtotal >= 199) {
          spinDiscountAmount = Math.round(subtotal * 0.1);
          spinRewardActive = true;
          spinRewardSummary = isBn
            ? `🎉 ১০% ছাড় (−${formatCurrency(spinDiscountAmount, 'bn')})`
            : `🎉 10% OFF (−${formatCurrency(spinDiscountAmount, 'en')})`;
          spinRewardHint = isBn
            ? `অভিনন্দন! আপনার অর্ডারে ${formatCurrency(spinDiscountAmount, 'bn')} ছাড় যুক্ত হয়েছে`
            : `Congrats! ${formatCurrency(spinDiscountAmount, 'en')} discount applied to your bill`;
        } else {
          const needed = 199 - subtotal;
          spinRewardSummary = isBn
            ? '🎉 ১০% ছাড় (₹১৯৯+ অর্ডারে প্রযোজ্য)'
            : '🎉 10% OFF (Valid on ₹199+ orders)';
          spinRewardHint = isBn
            ? `আর ${formatCurrency(needed, 'bn')} যোগ করলেই ১০% ছাড় চালু হবে`
            : `Add ${formatCurrency(needed, 'en')} more to unlock 10% OFF`;
        }
        break;
      }
      case 'free_cold_drink': {
        if (subtotal >= 249) {
          spinRewardActive = true;
          spinRewardSummary = isBn
            ? '🥤 ফ্রি কোল্ড ড্রিংক (যুক্ত হয়েছে)'
            : '🥤 Free Cold Drink (Applied)';
          spinRewardHint = isBn
            ? 'দারুণ! আপনার অর্ডারের সাথে ১টি ফ্রি কোল্ড ড্রিংক যাবে'
            : 'Awesome! 1 Free Cold Drink will be sent with your order';
        } else {
          const needed = 249 - subtotal;
          spinRewardSummary = isBn
            ? '🥤 ফ্রি কোল্ড ড্রিংক (₹২৪৯+ অর্ডারে প্রযোজ্য)'
            : '🥤 Free Cold Drink (Valid on ₹249+ orders)';
          spinRewardHint = isBn
            ? `আর ${formatCurrency(needed, 'bn')} যোগ করলেই ফ্রি কোল্ড ড্রিংক পাবেন`
            : `Add ${formatCurrency(needed, 'en')} more to unlock a Free Cold Drink`;
        }
        break;
      }
      case 'free_extra_egg': {
        if (hasBiryani) {
          spinRewardActive = true;
          spinRewardSummary = isBn
            ? '🥚 ফ্রি এক্সট্রা ডিম (বিরিয়ানির সাথে যুক্ত)'
            : '🥚 Free Extra Egg (Applied with Biryani)';
          spinRewardHint = isBn
            ? 'দারুণ! আপনার বিরিয়ানির সাথে ১টি এক্সট্রা ডিম ফ্রি পাবেন'
            : 'Awesome! 1 Free Extra Egg will be added to your Biryani';
        } else {
          spinRewardSummary = isBn
            ? '🥚 ফ্রি এক্সট্রা ডিম (বিরিয়ানি অর্ডারে প্রযোজ্য)'
            : '🥚 Free Extra Egg (Valid with Biryani)';
          spinRewardHint = isBn
            ? 'যেকোনো বিরিয়ানি যোগ করলেই ফ্রি এক্সট্রা ডিম চালু হবে'
            : 'Add any Biryani to unlock your Free Extra Egg';
        }
        break;
      }
      case 'discount_30_flat': {
        if (subtotal >= 299) {
          spinDiscountAmount = 30;
          spinRewardActive = true;
          spinRewardSummary = isBn ? '💸 ₹৩০ ছাড় (−₹৩০)' : '💸 ₹30 OFF (−₹30)';
          spinRewardHint = isBn
            ? 'অভিনন্দন! আপনার অর্ডারে ₹৩০ ছাড় যুক্ত হয়েছে'
            : 'Congrats! Flat ₹30 discount applied to your bill';
        } else {
          const needed = 299 - subtotal;
          spinRewardSummary = isBn
            ? '💸 ₹৩০ ছাড় (₹২৯৯+ অর্ডারে প্রযোজ্য)'
            : '💸 ₹30 OFF (Valid on ₹299+ orders)';
          spinRewardHint = isBn
            ? `আর ${formatCurrency(needed, 'bn')} যোগ করলেই ₹৩০ ছাড় চালু হবে`
            : `Add ${formatCurrency(needed, 'en')} more to unlock ₹30 OFF`;
        }
        break;
      }
    }
  }

  const finalTotal = Math.max(
    0,
    subtotal + serviceChargeAmount - spinDiscountAmount
  );
  const totalSavings = menuMrpSavings + spinDiscountAmount;

  return {
    subtotal,
    itemCount,
    hasBiryani,
    serviceChargeEnabled,
    serviceChargeAmount,
    serviceChargeDisplayLabel,
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
 * Generates a neatly formatted WhatsApp receipt message & wa.me link in the
 * customer's chosen language (with bilingual EN + BN dish names in English mode
 * so kitchen staff can read every item effortlessly).
 */
export function buildWhatsAppOrder(
  shop: ShopConfig,
  dishes: Dish[],
  cart: Record<string, number>,
  customer: CustomerDetails,
  wonPrizeId: SpinPrizeId | null,
  pricing: OrderPricing,
  lang: Language = 'bn',
  spinRewards: SpinSlice[] = SPIN_SLICES,
  orderId?: string
): { receiptText: string; whatsappUrl: string } {
  const shopCopy = getShopCopy(shop, lang);
  const wonSlice = getSpinSliceById(wonPrizeId, spinRewards);
  const wonSliceLabel = wonSlice ? getSpinSliceCopy(wonSlice, lang).shortTitle : '';

  const orderedLines = dishes
    .filter((d) => (cart[d.id] ?? 0) > 0)
    .map((d, idx) => {
      const qty = cart[d.id] ?? 0;
      const lineTotal = d.price * qty;
      const enName = getDishCopy(d, 'en').name;
      const itemLabel =
        lang === 'en' && enName !== d.name ? `${enName} (${d.name})` : d.name;

      return `${formatDigits(idx + 1, lang)}. ${itemLabel} × ${formatDigits(qty, lang)} = ${formatCurrency(lineTotal, lang)}`;
    });

  const cleanPhone = shop.whatsappNumber.replace(/\D/g, '') || '918649853354';

  if (lang === 'en') {
    const rewardLine = wonPrizeId
      ? pricing.spinRewardActive
        ? pricing.spinRewardSummary
        : `${wonSliceLabel} (Min. condition not met)`
      : 'None';

    const lines: string[] = [
      `🍽️ *New Food Order — ${shopCopy.name}*`,
      ...(orderId ? [`🆔 *Order ID:* ${orderId}`] : []),
      `━━━━━━━━━━━━━━━━━━`,
      `👤 *Customer Name:* ${customer.name.trim()}`,
      `📞 *Mobile Number:* ${customer.phone.trim()}`,
      `📍 *Delivery Address:* ${customer.address.trim()}`,
    ];

    if (customer.location) {
      const distText = customer.location.distanceKm.toFixed(1);
      const mapsUrl = buildGoogleMapsLink(
        customer.location.lat,
        customer.location.lng
      );
      lines.push(`📏 *Distance:* ${distText} km`);
      lines.push(`🗺️ *Google Maps Link:* ${mapsUrl}`);
      if (customer.location.distanceKm > (shop.maxDeliveryKm || 5)) {
        lines.push(
          `⚠️ _(Outside ${shop.maxDeliveryKm || 5} km delivery radius — please confirm by phone)_`
        );
      }
    }

    lines.push(
      `━━━━━━━━━━━━━━━━━━`,
      `📋 *Ordered Items:*`,
      ...orderedLines,
      `━━━━━━━━━━━━━━━━━━`,
      `🧾 *Item Subtotal:* ${formatCurrency(pricing.subtotal, 'en')}`
    );

    if (pricing.serviceChargeEnabled && pricing.serviceChargeAmount > 0) {
      lines.push(
        `*${pricing.serviceChargeDisplayLabel}:* ${formatCurrency(pricing.serviceChargeAmount, 'en')}`
      );
    }

    lines.push(
      `🎁 *Spin Offer / Discount:* ${rewardLine}`,
      `🚚 *Home Delivery:* FREE (₹0) 🎉`,
      `📍 _(Home delivery available within ${shopCopy.deliveryRadiusText} only)_`,
      `━━━━━━━━━━━━━━━━━━`,
      `💰 *Final Payable (Cash on Delivery):* *${formatCurrency(pricing.finalTotal, 'en')}*`,
      `━━━━━━━━━━━━━━━━━━`,
      `🙏 Please confirm my order.`
    );

    const receiptText = lines.join('\n');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptText)}`;
    return { receiptText, whatsappUrl };
  }

  const rewardLine = wonPrizeId
    ? pricing.spinRewardActive
      ? pricing.spinRewardSummary
      : `${pricing.spinRewardSummary} (শর্ত পূরণ হয়নি)`
    : 'নেই';

  const lines: string[] = [
    `🍽️ *নতুন ফুড অর্ডার — ${shop.name}*`,
    ...(orderId ? [`🆔 *অর্ডার আইডি:* ${orderId}`] : []),
    `━━━━━━━━━━━━━━━━━━`,
    `👤 *গ্রাহকের নাম:* ${customer.name.trim()}`,
    `📞 *মোবাইল নম্বর:* ${customer.phone.trim()}`,
    `📍 *ডেলিভারি ঠিকানা:* ${customer.address.trim()}`,
  ];

  if (customer.location) {
    const distBn = formatDigits(customer.location.distanceKm.toFixed(1), 'bn');
    const mapsUrl = buildGoogleMapsLink(
      customer.location.lat,
      customer.location.lng
    );
    lines.push(`📏 *দূরত্ব:* ${distBn} কিমি`);
    lines.push(`🗺️ *Google Maps লোকেশন:* ${mapsUrl}`);
    if (customer.location.distanceKm > (shop.maxDeliveryKm || 5)) {
      lines.push(
        `⚠️ _(${formatDigits(shop.maxDeliveryKm || 5, 'bn')} কিমি ডেলিভারি সীমার বাইরে — কল করে কনফার্ম করুন)_`
      );
    }
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━`,
    `📋 *অর্ডার করা খাবার:*`,
    ...orderedLines,
    `━━━━━━━━━━━━━━━━━━`,
    `🧾 *খাবারের মোট মূল্য (Subtotal):* ${formatCurrency(pricing.subtotal, 'bn')}`
  );

  if (pricing.serviceChargeEnabled && pricing.serviceChargeAmount > 0) {
    lines.push(
      `*${pricing.serviceChargeDisplayLabel}:* ${formatCurrency(pricing.serviceChargeAmount, 'bn')}`
    );
  }

  lines.push(
    `🎁 *স্পিন অফার / ছাড়:* ${rewardLine}`,
    `🚚 *হোম ডেলিভারি:* সম্পূর্ণ ফ্রি (FREE) 🎉`,
    `📍 _(শুধুমাত্র ${shopCopy.deliveryRadiusText}-এর মধ্যে হোম ডেলিভারি উপলব্ধ)_`,
    `━━━━━━━━━━━━━━━━━━`,
    `💰 *সর্বমোট দেয় (Cash on Delivery):* *${formatCurrency(pricing.finalTotal, 'bn')}*`,
    `━━━━━━━━━━━━━━━━━━`,
    `🙏 অনুগ্রহ করে আমার অর্ডারটি কনফার্ম করুন।`
  );

  const receiptText = lines.join('\n');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptText)}`;

  return { receiptText, whatsappUrl };
}
