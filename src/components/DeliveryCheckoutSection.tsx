import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  ReceiptText,
  Truck,
  User,
} from 'lucide-react';
import type {
  CustomerDetails,
  Dish,
  Language,
  OrderPricing,
  ShopConfig,
} from '../types';
import {
  formatCurrency,
  formatDigits,
  getDishCopy,
  getShopCopy,
} from '../utils/i18n';

interface DeliveryCheckoutSectionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  shop: ShopConfig;
  lang: Language;
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
  shop,
  lang,
  dishes,
  cart,
  pricing,
  customer,
  errors,
  onCustomerChange,
  onPlaceOrder,
}: DeliveryCheckoutSectionProps) {
  const isBn = lang === 'bn';
  const orderedItems = dishes.filter((d) => (cart[d.id] ?? 0) > 0);
  const { deliveryRadiusText } = getShopCopy(shop, lang);
  const hasSpinReward =
    pricing.spinRewardSummary !== 'কোনো অফার প্রযোজ্য নেই' &&
    pricing.spinRewardSummary !== 'No offer applied';

  return (
    <section
      ref={sectionRef}
      id="delivery-form"
      aria-labelledby="delivery-heading"
      className="max-w-5xl mx-auto px-4 sm:px-6 mt-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Customer Delivery Information Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a1b26] rounded-2xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#d90429]/10 dark:bg-[#d90429]/20 text-[#d90429] dark:text-[#ff6b81] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="delivery-heading"
                className="text-lg sm:text-xl font-bold text-[#1d1e2c] dark:text-slate-100"
              >
                {isBn ? '🚚 ডেলিভারি তথ্য' : '🚚 Delivery Details'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                {isBn
                  ? '🚚 হোম ডেলিভারি: সম্পূর্ণ ফ্রি (FREE)'
                  : '🚚 Home Delivery: Completely FREE'}
              </p>
            </div>
          </div>

          <div className="mt-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-200">
            <span>
              {isBn
                ? `📍 শুধুমাত্র ${deliveryRadiusText}-এর মধ্যে হোম ডেলিভারি উপলব্ধ`
                : `📍 Home delivery available within ${deliveryRadiusText} only`}
            </span>
          </div>

          {errors.cart && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.cart}</span>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="customer-name"
                className="block text-sm font-semibold text-[#1d1e2c] dark:text-slate-200 mb-1.5"
              >
                {isBn ? 'আপনার নাম' : 'Your Full Name'}{' '}
                <span className="text-[#d90429] dark:text-[#ff6b81]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="customer-name"
                  type="text"
                  value={customer.name}
                  onChange={(e) => onCustomerChange('name', e.target.value)}
                  placeholder={isBn ? 'যেমন: সুমন মণ্ডল' : 'e.g., Suman Mondal'}
                  autoComplete="name"
                  className={`w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border text-sm sm:text-base text-[#1d1e2c] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-[#f9fafb] dark:bg-[#141520] focus:bg-white dark:focus:bg-[#181926] focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-[#d90429] focus:ring-[#d90429]/20'
                      : 'border-slate-200 dark:border-white/12 focus:border-[#d90429] focus:ring-[#d90429]/15'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-[#d90429] dark:text-[#ff6b81]">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="customer-phone"
                className="block text-sm font-semibold text-[#1d1e2c] dark:text-slate-200 mb-1.5"
              >
                {isBn
                  ? 'আপনার মোবাইল নম্বর (১০ সংখ্যার)'
                  : 'Mobile Number (10 digits)'}{' '}
                <span className="text-[#d90429] dark:text-[#ff6b81]">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="customer-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={customer.phone}
                  onChange={(e) => onCustomerChange('phone', e.target.value)}
                  placeholder={isBn ? 'যেমন: 9876543210' : 'e.g., 9876543210'}
                  autoComplete="tel"
                  className={`w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border text-sm sm:text-base text-[#1d1e2c] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-[#f9fafb] dark:bg-[#141520] focus:bg-white dark:focus:bg-[#181926] focus:outline-none focus:ring-2 transition-all tabular-nums ${
                    errors.phone
                      ? 'border-[#d90429] focus:ring-[#d90429]/20'
                      : 'border-slate-200 dark:border-white/12 focus:border-[#d90429] focus:ring-[#d90429]/15'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-[#d90429] dark:text-[#ff6b81]">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="customer-address"
                className="block text-sm font-semibold text-[#1d1e2c] dark:text-slate-200 mb-1.5"
              >
                {isBn
                  ? 'গ্রামের নাম / পাড়া / বাড়ির কাছের চিহ্ন'
                  : 'Delivery Address / Village & Landmark'}{' '}
                <span className="text-[#d90429] dark:text-[#ff6b81]">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <textarea
                  id="customer-address"
                  rows={3}
                  value={customer.address}
                  onChange={(e) => onCustomerChange('address', e.target.value)}
                  placeholder={
                    isBn
                      ? 'যেমন: উত্তরপাড়া, শিব মন্দিরের পাশে, সবুজ গেট বাড়ি'
                      : 'e.g., Uttarpara, near Shiv Temple, Green Gate House'
                  }
                  autoComplete="street-address"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm sm:text-base text-[#1d1e2c] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-[#f9fafb] dark:bg-[#141520] focus:bg-white dark:focus:bg-[#181926] focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.address
                      ? 'border-[#d90429] focus:ring-[#d90429]/20'
                      : 'border-slate-200 dark:border-white/12 focus:border-[#d90429] focus:ring-[#d90429]/15'
                  }`}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-xs font-medium text-[#d90429] dark:text-[#ff6b81]">
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Live Bill Summary Card */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1a1b26] rounded-2xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-[#d90429] dark:text-[#ff6b81]" />
              <h3 className="text-lg font-bold text-[#1d1e2c] dark:text-slate-100">
                {isBn ? 'বিলের বিবরণ' : 'Bill Breakdown'}
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isBn ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
            </span>
          </div>

          {orderedItems.length === 0 ? (
            <div className="py-7 text-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {isBn ? 'আপনার কার্ট এখন খালি রয়েছে।' : 'Your cart is empty.'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {isBn
                  ? 'উপরের মেনু থেকে পছন্দের খাবারের পাশে ‘+’ বাটনে ক্লিক করুন।'
                  : 'Tap ‘+’ on any dish above to add it to your order.'}
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100 dark:divide-white/10 my-2">
                {orderedItems.map((item) => {
                  const qty = cart[item.id] ?? 0;
                  const itemName = getDishCopy(item, lang).name;
                  return (
                    <li
                      key={item.id}
                      className="py-2.5 flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-[#1d1e2c] dark:text-slate-100 font-medium">
                        {itemName}{' '}
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                          × {formatDigits(qty, lang)}
                        </span>
                      </span>
                      <span className="font-semibold text-[#1d1e2c] dark:text-white tabular-nums shrink-0">
                        {formatCurrency(item.price * qty, lang)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{isBn ? 'খাবারের মোট মূল্য' : 'Item Subtotal'}</span>
                  <span className="font-semibold text-[#1d1e2c] dark:text-white tabular-nums">
                    {formatCurrency(pricing.subtotal, lang)}
                  </span>
                </div>

                {pricing.serviceChargeEnabled &&
                  pricing.serviceChargeAmount > 0 && (
                    <div className="flex justify-between gap-2 text-slate-600 dark:text-slate-300">
                      <span>{pricing.serviceChargeDisplayLabel}</span>
                      <span className="font-semibold text-[#1d1e2c] dark:text-white tabular-nums shrink-0">
                        {formatCurrency(pricing.serviceChargeAmount, lang)}
                      </span>
                    </div>
                  )}

                <div className="flex justify-between items-start gap-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span>{isBn ? '🚚 হোম ডেলিভারি' : '🚚 Home Delivery'}</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                      {isBn
                        ? `📍 শুধুমাত্র ${deliveryRadiusText}-এর মধ্যে উপলব্ধ`
                        : `📍 Available within ${deliveryRadiusText} only`}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    {isBn ? 'সম্পূর্ণ ফ্রি (FREE)' : 'FREE (₹0)'}
                  </span>
                </div>

                {hasSpinReward && (
                  <div className="flex items-start justify-between gap-2 text-xs sm:text-sm pt-1">
                    <span className="text-slate-600 dark:text-slate-300">
                      {isBn ? 'স্পিন পুরস্কার' : 'Spin Reward'}
                    </span>
                    <span
                      className={`font-semibold text-right ${
                        pricing.spinRewardActive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-[#ffd166]'
                      }`}
                    >
                      {pricing.spinRewardSummary}
                    </span>
                  </div>
                )}

                <div className="pt-3 mt-2 border-t border-slate-200 dark:border-white/15 flex items-center justify-between">
                  <span className="text-base font-bold text-[#1d1e2c] dark:text-slate-100">
                    {isBn ? 'সর্বমোট দেয় (COD)' : 'Final Total (COD)'}
                  </span>
                  <span className="text-xl font-bold text-[#d90429] dark:text-[#ff6b81] tabular-nums">
                    {formatCurrency(pricing.finalTotal, lang)}
                  </span>
                </div>

                {pricing.totalSavings > 0 && (
                  <div className="mt-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {isBn
                        ? `এই অর্ডারে আপনি মোট ${formatCurrency(pricing.totalSavings, 'bn')} সাশ্রয় করছেন!`
                        : `You're saving a total of ${formatCurrency(pricing.totalSavings, 'en')} on this order!`}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onPlaceOrder}
                className="mt-4 w-full min-h-[48px] rounded-xl bg-[#d90429] hover:bg-[#b30322] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-[#d90429]/20 transition-all cursor-pointer"
              >
                {isBn
                  ? 'WhatsApp-এ অর্ডার কনফার্ম করুন ➔'
                  : 'Confirm Order on WhatsApp ➔'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
