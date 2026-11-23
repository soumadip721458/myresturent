import { AlertCircle, CheckCircle2, MapPin, Phone, ReceiptText, Truck, User } from 'lucide-react';
import type { CustomerDetails, Dish, OrderPricing } from '../types';
import { formatRupees, toBengaliDigits } from '../utils/bengali';

interface DeliveryCheckoutSectionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  dishes: Dish[];
  cart: Record<string, number>;
  pricing: OrderPricing;
  customer: CustomerDetails;
  errors: Partial<Record<keyof CustomerDetails | 'cart', string>>;
  onCustomerChange: (field: keyof CustomerDetails, value: string) => void;
  onPlaceOrder: () => void;
}

export function DeliveryCheckoutSection({
  sectionRef,
  dishes,
  cart,
  pricing,
  customer,
  errors,
  onCustomerChange,
  onPlaceOrder,
}: DeliveryCheckoutSectionProps) {
  const orderedItems = dishes.filter((d) => (cart[d.id] ?? 0) > 0);

  return (
    <section
      ref={sectionRef}
      id="delivery-form"
      aria-labelledby="delivery-heading"
      className="max-w-5xl mx-auto px-4 sm:px-6 mt-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Customer Delivery Information Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-[#d90429]/10 text-[#d90429] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="delivery-heading"
                className="text-lg sm:text-xl font-bold text-[#1d1e2c]"
              >
                🚚 ডেলিভারি তথ্য
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                সঠিক ঠিকানা ও ফোন নম্বর দিন, ৩০ মিনিটে গরম খাবার পৌঁছে যাবে
              </p>
            </div>
          </div>

          {errors.cart && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.cart}</span>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="customer-name"
                className="block text-sm font-semibold text-[#1d1e2c] mb-1.5"
              >
                আপনার নাম <span className="text-[#d90429]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="customer-name"
                  type="text"
                  value={customer.name}
                  onChange={(e) => onCustomerChange('name', e.target.value)}
                  placeholder="যেমন: সুমন মণ্ডল"
                  autoComplete="name"
                  className={`w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border text-sm sm:text-base text-[#1d1e2c] bg-[#f9fafb] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-[#d90429] focus:ring-[#d90429]/20'
                      : 'border-slate-200 focus:border-[#d90429] focus:ring-[#d90429]/15'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-[#d90429]">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="customer-phone"
                className="block text-sm font-semibold text-[#1d1e2c] mb-1.5"
              >
                আপনার মোবাইল নম্বর (১০ সংখ্যার) <span className="text-[#d90429]">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="customer-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={customer.phone}
                  onChange={(e) => onCustomerChange('phone', e.target.value)}
                  placeholder="যেমন: 9876543210"
                  autoComplete="tel"
                  className={`w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border text-sm sm:text-base text-[#1d1e2c] bg-[#f9fafb] focus:bg-white focus:outline-none focus:ring-2 transition-all tabular-nums ${
                    errors.phone
                      ? 'border-[#d90429] focus:ring-[#d90429]/20'
                      : 'border-slate-200 focus:border-[#d90429] focus:ring-[#d90429]/15'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-[#d90429]">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="customer-address"
                className="block text-sm font-semibold text-[#1d1e2c] mb-1.5"
              >
                গ্রামের নাম / পাড়া / বাড়ির কাছের চিহ্ন{' '}
                <span className="text-[#d90429]">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <textarea
                  id="customer-address"
                  rows={3}
                  value={customer.address}
                  onChange={(e) => onCustomerChange('address', e.target.value)}
                  placeholder="যেমন: উত্তরপাড়া, শিব মন্দিরের পাশে, সবুজ গেট বাড়ি"
                  autoComplete="street-address"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm sm:text-base text-[#1d1e2c] bg-[#f9fafb] focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.address
                      ? 'border-[#d90429] focus:ring-[#d90429]/20'
                      : 'border-slate-200 focus:border-[#d90429] focus:ring-[#d90429]/15'
                  }`}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-xs font-medium text-[#d90429]">
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Live Bill Summary Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-[#d90429]" />
              <h3 className="text-lg font-bold text-[#1d1e2c]">বিলের বিবরণ</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              ক্যাশ অন ডেলিভারি (COD)
            </span>
          </div>

          {orderedItems.length === 0 ? (
            <div className="py-7 text-center">
              <p className="text-sm font-medium text-slate-600">
                আপনার কার্ট এখন খালি রয়েছে।
              </p>
              <p className="text-xs text-slate-400 mt-1">
                উপরের মেনু থেকে পছন্দের খাবারের পাশে ‘+’ বাটনে ক্লিক করুন।
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100 my-2">
                {orderedItems.map((item) => {
                  const qty = cart[item.id] ?? 0;
                  return (
                    <li
                      key={item.id}
                      className="py-2.5 flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-[#1d1e2c] font-medium">
                        {item.name}{' '}
                        <span className="text-slate-500 tabular-nums">
                          × {toBengaliDigits(qty)}
                        </span>
                      </span>
                      <span className="font-semibold text-[#1d1e2c] tabular-nums shrink-0">
                        {formatRupees(item.price * qty)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>খাবারের মোট মূল্য</span>
                  <span className="font-semibold text-[#1d1e2c] tabular-nums">
                    {formatRupees(pricing.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ</span>
                  {pricing.isFreeDelivery ? (
                    <span className="font-bold text-emerald-600">
                      ফ্রি (₹০)
                    </span>
                  ) : (
                    <span className="font-semibold text-[#1d1e2c] tabular-nums">
                      {formatRupees(pricing.deliveryCharge)}
                    </span>
                  )}
                </div>

                {pricing.spinRewardSummary !== 'কোনো অফার প্রযোজ্য নেই' && (
                  <div className="flex items-start justify-between gap-2 text-xs sm:text-sm pt-1">
                    <span className="text-slate-600">স্পিন পুরস্কার</span>
                    <span
                      className={`font-semibold text-right ${
                        pricing.spinRewardActive
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {pricing.spinRewardSummary}
                    </span>
                  </div>
                )}

                <div className="pt-3 mt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-base font-bold text-[#1d1e2c]">
                    সর্বমোট দেয় (COD)
                  </span>
                  <span className="text-xl font-bold text-[#d90429] tabular-nums">
                    {formatRupees(pricing.finalTotal)}
                  </span>
                </div>

                {pricing.totalSavings > 0 && (
                  <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      এই অর্ডারে আপনি মোট {formatRupees(pricing.totalSavings)}{' '}
                      সাশ্রয় করছেন!
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onPlaceOrder}
                className="mt-4 w-full min-h-[48px] rounded-xl bg-[#d90429] hover:bg-[#b30322] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-[#d90429]/20 transition-all cursor-pointer"
              >
                WhatsApp-এ অর্ডার কনফার্ম করুন ➔
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
