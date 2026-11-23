import { ArrowRight, CheckCircle2, ShoppingBag, Truck } from 'lucide-react';
import { FREE_DELIVERY_THRESHOLD } from '../data/defaults';
import type { OrderPricing } from '../types';
import { formatRupees, toBengaliDigits } from '../utils/bengali';

interface BottomCheckoutBarProps {
  pricing: OrderPricing;
  onCheckoutClick: () => void;
}

export function BottomCheckoutBar({
  pricing,
  onCheckoutClick,
}: BottomCheckoutBarProps) {
  const progressPct = Math.min(
    100,
    Math.round((pricing.subtotal / FREE_DELIVERY_THRESHOLD) * 100)
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 shadow-[0_-8px_28px_rgba(29,30,44,0.2)]">
      {/* Motivating Profit-Protection Free Delivery Progress Strip */}
      <div
        className={`w-full transition-colors ${
          pricing.itemCount > 0 && pricing.isFreeDelivery
            ? 'bg-emerald-600 text-white'
            : 'bg-[#fff3db] text-[#1d1e2c] border-t border-[#ff9f1c]/40'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-center leading-tight">
            {pricing.itemCount === 0 ? (
              <>
                <Truck className="w-4 h-4 text-[#d90429] shrink-0" />
                <span>
                  🚚 ₹১৯৯ বা তার বেশি অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি! (নিচে ₹৪৯ চার্জ)
                </span>
              </>
            ) : pricing.isFreeDelivery ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
                <span>🎉 অভিনন্দন! আপনি ফ্রি ডেলিভারি পেয়েছেন</span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 text-[#d90429] shrink-0" />
                <span>
                  🚚 আর মাত্র{' '}
                  <strong className="text-[#d90429] tabular-nums">
                    {formatRupees(pricing.amountForFreeDelivery)}
                  </strong>
                  -এর খাবার যোগ করলেই ফ্রি ডেলিভারি পাবেন!
                </span>
              </>
            )}
          </div>

          {pricing.itemCount > 0 && !pricing.isFreeDelivery && (
            <div className="mt-1.5 h-1.5 w-full max-w-md mx-auto bg-[#1d1e2c]/12 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff9f1c] to-[#d90429] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Dark Charcoal Checkout Bar */}
      <div className="bg-[#1d1e2c] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Left: Payable Total & Savings */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white/10 items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#ff9f1c]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-white tabular-nums leading-none">
                  {formatRupees(pricing.finalTotal)}
                </span>
                <span className="text-xs text-white/75 tabular-nums whitespace-nowrap">
                  {pricing.itemCount > 0
                    ? `${toBengaliDigits(pricing.itemCount)}টি আইটেম • ${
                        pricing.isFreeDelivery
                          ? 'ফ্রি ডেলিভারি'
                          : `+${formatRupees(pricing.deliveryCharge)} ডেলিভারি`
                      }`
                    : 'খাবার বেছে নিন'}
                </span>
              </div>

              {pricing.totalSavings > 0 ? (
                <p className="text-xs font-semibold text-[#ffd166] truncate mt-0.5 tabular-nums">
                  মোট সাশ্রয়: {formatRupees(pricing.totalSavings)}
                  {pricing.spinRewardActive ? ' • স্পিন অফার যুক্ত!' : ''}
                </p>
              ) : (
                <p className="text-xs text-white/60 truncate mt-0.5">
                  ক্যাশ অন ডেলিভারি • দ্রুত হোয়াটসঅ্যাপ অর্ডার
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
            <span>অর্ডার করুন</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
