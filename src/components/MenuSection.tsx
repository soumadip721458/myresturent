import { Minus, Plus } from 'lucide-react';
import type { Dish, MenuCategory } from '../types';
import { formatRupees, toBengaliDigits } from '../utils/bengali';
import { FoodImage } from './FoodImage';

interface MenuSectionProps {
  dishes: Dish[];
  activeCategory: MenuCategory;
  onCategoryChange: (cat: MenuCategory) => void;
  cart: Record<string, number>;
  onUpdateQty: (dishId: string, delta: number) => void;
}

const CATEGORY_TABS: { id: MenuCategory; label: string }[] = [
  { id: 'all', label: '🍽️ সব খাবার' },
  { id: 'biryani', label: '🍛 বিরিয়ানি' },
  { id: 'fastfood', label: '🍜 চাউমিন ও রোল' },
];

export function MenuSection({
  dishes,
  activeCategory,
  onCategoryChange,
  cart,
  onUpdateQty,
}: MenuSectionProps) {
  const filteredDishes =
    activeCategory === 'all'
      ? dishes
      : dishes.filter((d) => d.category === activeCategory);

  return (
    <section aria-labelledby="menu-heading" className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
      {/* Section Heading + Horizontally Scrollable Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2
            id="menu-heading"
            className="text-xl sm:text-2xl font-bold text-[#1d1e2c]"
          >
            আমাদের স্পেশাল মেনু
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            টাটকা ও গরম খাবার বেছে নিন • ক্যাশ অন ডেলিভারি উপলব্ধ
          </p>
        </div>

        <div
          role="tablist"
          aria-label="খাবারের ক্যাটাগরি"
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
                    : 'bg-white text-[#1d1e2c] border border-slate-200 hover:border-[#d90429]/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs tabular-nums ${
                    isActive ? 'text-white/85' : 'text-slate-400'
                  }`}
                >
                  ({toBengaliDigits(count)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredDishes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-[#1d1e2c]">
            এই ক্যাটাগরিতে এখনো কোনো খাবার যোগ করা হয়নি।
          </p>
          <p className="text-sm text-slate-500 mt-1">
            অনুগ্রহ করে অন্য ক্যাটাগরি দেখুন অথবা অ্যাডমিন প্যানেল থেকে নতুন পদ যোগ করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredDishes.map((dish) => {
            const qty = cart[dish.id] ?? 0;
            const discountPct =
              dish.oldPrice && dish.oldPrice > dish.price
                ? Math.round(((dish.oldPrice - dish.price) / dish.oldPrice) * 100)
                : 0;

            return (
              <article
                key={dish.id}
                className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col ${
                  qty > 0
                    ? 'border-[#d90429]/50 shadow-md shadow-[#d90429]/5'
                    : 'border-slate-200/90 hover:shadow-md'
                }`}
              >
                {/* High-Resolution Dish Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1d1e2c]">
                  <FoodImage
                    src={dish.image}
                    alt={dish.name}
                    fallbackLabel={dish.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />

                  {/* Subtle dark top/bottom edge for photo badge readability */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none"
                  />

                  {dish.badge && (
                    <span className="absolute top-3 left-3 bg-[#1d1e2c]/90 backdrop-blur-sm text-[#ffd166] text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                      {dish.badge}
                    </span>
                  )}

                  {discountPct > 0 && (
                    <span className="absolute top-3 right-3 bg-[#d90429] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm tabular-nums">
                      {toBengaliDigits(discountPct)}% ছাড়
                    </span>
                  )}
                </div>

                {/* Dish Details */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#1d1e2c] leading-snug">
                      {dish.name}
                    </h3>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2 flex-1">
                    {dish.description}
                  </p>

                  {/* Price & - 0 + Quantity Stepper */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-xl font-bold text-[#1d1e2c]">
                        {formatRupees(dish.price)}
                      </span>
                      {dish.oldPrice && dish.oldPrice > dish.price && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatRupees(dish.oldPrice)}
                        </span>
                      )}
                    </div>

                    {/* - 0 + Controls */}
                    <div
                      aria-label={`${dish.name} পরিমাণ নিয়ন্ত্রণ`}
                      className={`inline-flex items-center rounded-xl border overflow-hidden ${
                        qty > 0
                          ? 'border-[#d90429] bg-[#fff5f6]'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onUpdateQty(dish.id, -1)}
                        disabled={qty === 0}
                        aria-label={`${dish.name} কমান`}
                        className="w-10 h-10 flex items-center justify-center text-[#1d1e2c] hover:bg-[#d90429]/10 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="min-w-[28px] text-center text-sm font-bold text-[#1d1e2c] tabular-nums select-none">
                        {toBengaliDigits(qty)}
                      </span>

                      <button
                        type="button"
                        onClick={() => onUpdateQty(dish.id, 1)}
                        aria-label={`${dish.name} বাড়ান`}
                        className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                          qty > 0
                            ? 'bg-[#d90429] text-white hover:bg-[#b30322]'
                            : 'text-[#d90429] hover:bg-[#d90429] hover:text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
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
