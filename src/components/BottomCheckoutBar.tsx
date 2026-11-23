import { ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';
import type { Language, OrderPricing, ShopConfig } from '../types';
import { formatCurrency, formatDigits, getShopCopy } from '../utils/i18n';

interface BottomCheckoutBarProps {
  shop: ShopConfig;
  lang: Language;
  pricing: OrderPricing;
  onCheckoutClick: () => void;
}

export function BottomCheckoutBar({
  shop,
  lang,
  pricing,
  onCheckoutClick,
}: BottomCheckoutBarProps) {
  const isBn = lang === 'bn';
  const { deliveryRadiusText } = getShopCopy(shop, lang);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 shadow-[0_-8px_28px_rgba(29,30,44,0.2)]">
      {/* Always-Free Home Delivery Trust Strip */}
      <div className="w-full bg-emerald-600 text-white border-t border-emerald-500/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm font-semibold text-center leading-tight">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>
              {isBn
                ? '🚚 হোম ডেলিভারি: সম্পূর্ণ ফ্রি (FREE)'
                : '🚚 Home Delivery: FREE'}
            </span>
          </span>
          <span aria-hidden="true" className="text-emerald-200/75 hidden sm:inline">
            •
          </span>
          <span className="text-emerald-50/95 text-[11px] sm:text-xs font-medium">
            {isBn
              ? `📍 শুধুমাত্র ${deliveryRadiusText}-এর মধ্যে হোম ডেলিভারি উপলব্ধ`
              : `📍 Available within ${deliveryRadiusText} only`}
          </span>
        </div>
      </div>

      {/* Fixed Dark Charcoal Checkout Bar */}
      <div className="bg-[#1d1e2c] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Left: Payable Total & Breakdown */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white/10 items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#ff9f1c]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-white tabular-nums leading-none">
                  {formatCurrency(pricing.finalTotal, lang)}
                </span>
                <span className="text-xs text-white/80 tabular-nums whitespace-nowrap">
                  {pricing.itemCount > 0
                    ? isBn
                      ? `${formatDigits(pricing.itemCount, 'bn')}টি আইটেম • ফ্রি ডেলিভারি${
                          pricing.serviceChargeEnabled &&
                          pricing.serviceChargeAmount > 0
                            ? ` (+${formatCurrency(pricing.serviceChargeAmount, 'bn')} চার্জ)`
                            : ''
                        }`
                      : `${pricing.itemCount} ${
                          pricing.itemCount === 1 ? 'item' : 'items'
                        } • Free Delivery${
                          pricing.serviceChargeEnabled &&
                          pricing.serviceChargeAmount > 0
                            ? ` (+${formatCurrency(pricing.serviceChargeAmount, 'en')} GST/Pkg)`
                            : ''
                        }`
                    : isBn
                    ? 'খাবার বেছে নিন'
                    : 'Select dishes'}
                </span>
              </div>

              {pricing.totalSavings > 0 ? (
                <p className="text-xs font-semibold text-[#ffd166] truncate mt-0.5 tabular-nums">
                  {isBn
                    ? `মোট সাশ্রয়: ${formatCurrency(pricing.totalSavings, 'bn')}${
                        pricing.spinRewardActive ? ' • স্পিন অফার যুক্ত!' : ''
                      }`
                    : `Total Savings: ${formatCurrency(pricing.totalSavings, 'en')}${
                        pricing.spinRewardActive ? ' • Spin Reward Applied!' : ''
                      }`}
                </p>
              ) : (
                <p className="text-xs text-white/65 truncate mt-0.5">
                  {isBn
                    ? 'ক্যাশ অন ডেলিভারি • দ্রুত হোয়াটসঅ্যাপ অর্ডার'
                    : 'Cash on Delivery • Fast WhatsApp Order'}
                </p>
              )}
            </div>
          </div>

          {/* Right: Primary Order CTA */}
          <button
            type="button"
            onClick={onCheckoutClick}
            className="min-h-[46px] px-5 sm:px-6 py-2.5 rounded-xl bg-[#d90429] hover:bg-[#b30322] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-black/30 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer"
          >
            <span>{isBn ? 'অর্ডার করুন' : 'Order Now'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
