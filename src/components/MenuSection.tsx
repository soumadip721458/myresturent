import { Minus, Plus } from 'lucide-react';
import type { Dish, Language, MenuCategory } from '../types';
import { formatCurrency, formatDigits, getDishCopy } from '../utils/i18n';
import { FoodImage } from './FoodImage';

interface MenuSectionProps {
  dishes: Dish[];
  lang: Language;
  activeCategory: MenuCategory;
  onCategoryChange: (cat: MenuCategory) => void;
  cart: Record<string, number>;
  onUpdateQty: (dishId: string, delta: number) => void;
}

const CATEGORY_TABS: { id: MenuCategory; bn: string; en: string }[] = [
  { id: 'all', bn: '🍽️ সব খাবার', en: '🍽️ All Items' },
  { id: 'biryani', bn: '🍛 বিরিয়ানি', en: '🍛 Biryani' },
  { id: 'fastfood', bn: '🍜 চাউমিন ও রোল', en: '🍜 Chowmein & Rolls' },
];

export function MenuSection({
  dishes,
  lang,
  activeCategory,
  onCategoryChange,
  cart,
  onUpdateQty,
}: MenuSectionProps) {
  const isBn = lang === 'bn';
  const filteredDishes =
    activeCategory === 'all'
      ? dishes
      : dishes.filter((d) => d.category === activeCategory);

  return (
    <section
      aria-labelledby="menu-heading"
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-5"
    >
      {/* Section Heading + Horizontally Scrollable Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2
            id="menu-heading"
            className="text-xl sm:text-2xl font-bold text-[#1d1e2c] dark:text-slate-100"
          >
            {isBn ? 'আমাদের স্পেশাল মেনু' : 'Our Special Menu'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isBn
              ? 'টাটকা ও গরম খাবার বেছে নিন • ক্যাশ অন ডেলিভারি উপলব্ধ'
              : 'Freshly prepared piping hot food • Cash on Delivery available'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={isBn ? 'খাবারের ক্যাটাগরি' : 'Food categories'}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            const count =
              tab.id === 'all'
                ? dishes.length
                : dishes.filter((d) => d.category === tab.id).length;

            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onCategoryChange(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#d90429] text-white shadow-sm shadow-[#d90429]/25'
                    : 'bg-white dark:bg-[#1a1b26] text-[#1d1e2c] dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:border-[#d90429]/40 dark:hover:border-[#ff9f1c]/45'
                }`}
              >
                <span>{isBn ? tab.bn : tab.en}</span>
                <span
                  className={`text-xs tabular-nums ${
                    isActive
                      ? 'text-white/85'
                      : 'text-slate-400 dark:text-slate-400'
                  }`}
                >
                  ({formatDigits(count, lang)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredDishes.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1b26] rounded-2xl border border-slate-200 dark:border-white/10 p-8 text-center">
          <p className="text-base font-semibold text-[#1d1e2c] dark:text-slate-100">
            {isBn
              ? 'এই ক্যাটাগরিতে এখনো কোনো খাবার যোগ করা হয়নি।'
              : 'No dishes added in this category yet.'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isBn
              ? 'অনুগ্রহ করে অন্য ক্যাটাগরি দেখুন।'
              : 'Please browse another category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredDishes.map((dish) => {
            const isSoldOut = dish.inStock === false;
            const qty = isSoldOut ? 0 : cart[dish.id] ?? 0;
            const dishCopy = getDishCopy(dish, lang);
            const discountPct =
              dish.oldPrice && dish.oldPrice > dish.price
                ? Math.round(((dish.oldPrice - dish.price) / dish.oldPrice) * 100)
                : 0;

            return (
              <article
                key={dish.id}
                aria-disabled={isSoldOut || undefined}
                className={`group bg-white dark:bg-[#1a1b26] rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col ${
                  isSoldOut
                    ? 'opacity-80 border-red-200/80 dark:border-red-500/30'
                    : qty > 0
                    ? 'border-[#d90429]/50 dark:border-[#d90429]/75 shadow-md shadow-[#d90429]/5 dark:shadow-[#d90429]/15'
                    : 'border-slate-200/90 dark:border-white/10 hover:shadow-md dark:hover:border-white/20'
                }`}
              >
                {/* High-Resolution Dish Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1d1e2c]">
                  <FoodImage
                    src={dish.image}
                    alt={dishCopy.name}
                    fallbackLabel={dishCopy.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isSoldOut
                        ? 'grayscale-[80%] brightness-75'
                        : 'group-hover:scale-[1.03]'
                    }`}
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none"
                  />

                  {dishCopy.badge && !isSoldOut && (
                    <span className="absolute top-3 left-3 bg-[#1d1e2c]/90 backdrop-blur-sm text-[#ffd166] text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                      {dishCopy.badge}
                    </span>
                  )}

                  {discountPct > 0 && !isSoldOut && (
                    <span className="absolute top-3 right-3 bg-[#d90429] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm tabular-nums">
                      {formatDigits(discountPct, lang)}%{' '}
                      {isBn ? 'ছাড়' : 'OFF'}
                    </span>
                  )}

                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-3">
                      <span className="bg-[#d90429] text-white text-xs sm:text-sm font-extrabold px-3.5 py-2 rounded-xl shadow-lg border border-white/25 tracking-tight text-center">
                        {isBn
                          ? '🚫 আজকের মতো শেষ (Sold Out)'
                          : '🚫 Sold Out for Today'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Details */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-lg font-bold leading-snug ${
                        isSoldOut
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'text-[#1d1e2c] dark:text-slate-100'
                      }`}
                    >
                      {dishCopy.name}
                    </h3>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 flex-1">
                    {dishCopy.description}
                  </p>

                  {/* Price & - 0 + Quantity Stepper or Disabled Sold Out Control */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span
                        className={`text-xl font-bold ${
                          isSoldOut
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-[#1d1e2c] dark:text-white'
                        }`}
                      >
                        {formatCurrency(dish.price, lang)}
                      </span>
                      {dish.oldPrice && dish.oldPrice > dish.price && (
                        <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                          {formatCurrency(dish.oldPrice, lang)}
                        </span>
                      )}
                    </div>

                    {isSoldOut ? (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#d90429] dark:text-red-300 border border-red-200 dark:border-red-500/35 text-xs font-extrabold cursor-not-allowed select-none whitespace-nowrap"
                      >
                        {isBn ? '🚫 শেষ হয়ে গেছে' : '🚫 Sold Out'}
                      </button>
                    ) : (
                      /* - 0 + Controls */
                      <div
                        aria-label={
                          isBn
                            ? `${dishCopy.name} পরিমাণ নিয়ন্ত্রণ`
                            : `${dishCopy.name} quantity control`
                        }
                        className={`inline-flex items-center rounded-xl border overflow-hidden ${
                          qty > 0
                            ? 'border-[#d90429] bg-[#fff5f6] dark:bg-[#2a141b]'
                            : 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#141520]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQty(dish.id, -1)}
                          disabled={qty === 0}
                          aria-label={
                            isBn
                              ? `${dishCopy.name} কমান`
                              : `Decrease ${dishCopy.name}`
                          }
                          className="w-10 h-10 flex items-center justify-center text-[#1d1e2c] dark:text-slate-100 hover:bg-[#d90429]/10 dark:hover:bg-[#d90429]/25 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="min-w-[28px] text-center text-sm font-bold text-[#1d1e2c] dark:text-white tabular-nums select-none">
                          {formatDigits(qty, lang)}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQty(dish.id, 1)}
                          aria-label={
                            isBn
                              ? `${dishCopy.name} বাড়ান`
                              : `Increase ${dishCopy.name}`
                          }
                          className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                            qty > 0
                              ? 'bg-[#d90429] text-white hover:bg-[#b30322]'
                              : 'text-[#d90429] dark:text-[#ff6b81] hover:bg-[#d90429] hover:text-white'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
