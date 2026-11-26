import { useState } from 'react';
import { Clock, RotateCcw, ShoppingCart, Zap } from 'lucide-react';
import type { Dish, Language, SavedOrder } from '../types';
import { formatCurrency, formatDigits, getDishCopy } from '../utils/i18n';

interface RepeatOrderCardProps {
  orders: SavedOrder[];
  dishes: Dish[];
  lang: Language;
  onQuickReorder: (order: SavedOrder) => void;
  onLoadToCart: (order: SavedOrder) => void;
}

function formatOrderDate(isoString: string, lang: Language): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

export function RepeatOrderCard({
  orders,
  dishes,
  lang,
  onQuickReorder,
  onLoadToCart,
}: RepeatOrderCardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (orders.length === 0) return null;

  const isBn = lang === 'bn';
  const activeOrder = orders[selectedIndex] ?? orders[0];
  const dishMap = new Map(dishes.map((d) => [d.id, d]));

  const itemStatuses = activeOrder.items.map((item) => {
    const liveDish = dishMap.get(item.dishId);
    const displayName = liveDish
      ? getDishCopy(liveDish, lang).name
      : lang === 'en' && item.nameEn
      ? item.nameEn
      : item.name;
    const isSoldOut = Boolean(liveDish && liveDish.inStock === false);
    const isMissing = !liveDish;
    return {
      dishId: item.dishId,
      displayName,
      qty: item.qty,
      isSoldOut,
      isMissing,
      available: Boolean(liveDish && liveDish.inStock !== false),
    };
  });

  const soldOutNames = itemStatuses
    .filter((i) => i.isSoldOut)
    .map((i) => i.displayName);
  const hasSoldOutItem = soldOutNames.length > 0;
  const availableCount = itemStatuses.filter((i) => i.available).length;
  const disableQuickReorder = hasSoldOutItem || availableCount === 0;
  const disableLoadToCart = availableCount === 0;

  const formattedDate = formatOrderDate(activeOrder.createdAt, lang);

  return (
    <section
      aria-labelledby="repeat-order-heading"
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-5"
    >
      <div className="bg-white dark:bg-[#1a1b26] rounded-2xl border border-[#ff9f1c]/55 dark:border-[#ff9f1c]/35 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#fff8eb] via-white to-[#fff5f6] dark:from-[#231e18] dark:via-[#1a1b26] dark:to-[#24161c] px-4 py-3.5 sm:px-5 sm:py-4">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#d90429]/10 dark:bg-[#d90429]/20 text-[#d90429] dark:text-[#ff6b81] flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  id="repeat-order-heading"
                  className="text-sm sm:text-base font-bold text-[#1d1e2c] dark:text-slate-100 leading-tight"
                >
                  {isBn ? '🔄 আপনার আগের অর্ডার' : '🔄 Your Previous Order'}
                </h2>
                {formattedDate && (
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{formattedDate}</span>
                    <span aria-hidden="true">•</span>
                    <span className="font-semibold text-[#1d1e2c] dark:text-[#ffd166] tabular-nums">
                      {formatCurrency(activeOrder.total, lang)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Selector if multiple past orders exist (up to last 3) */}
            {orders.length > 1 && (
              <div
                role="tablist"
                aria-label={isBn ? 'আগের অর্ডার বেছে নিন' : 'Select past order'}
                className="flex items-center gap-1 bg-slate-100 dark:bg-[#11121a] p-1 rounded-xl border border-transparent dark:border-white/10"
              >
                {orders.map((ord, idx) => {
                  const active = idx === selectedIndex;
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#1d1e2c] dark:bg-[#ff9f1c] text-white dark:text-[#1d1e2c] shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-[#1d1e2c] dark:hover:text-white'
                      }`}
                    >
                      {idx === 0
                        ? isBn
                          ? 'সর্বশেষ'
                          : 'Latest'
                        : isBn
                        ? `আগের #${formatDigits(idx + 1, 'bn')}`
                        : `#${idx + 1}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items Summary */}
          <p className="mt-2.5 text-sm font-semibold text-[#1d1e2c] dark:text-slate-100 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {itemStatuses.map((item, idx) => (
              <span key={`${item.dishId}-${idx}`} className="inline-flex items-center gap-1">
                <span
                  className={
                    item.isSoldOut || item.isMissing
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : ''
                  }
                >
                  {item.displayName} × {formatDigits(item.qty, lang)}
                </span>
                {item.isSoldOut && (
                  <span className="text-[11px] font-extrabold text-[#d90429] dark:text-red-400">
                    ({isBn ? 'শেষ' : 'Sold Out'})
                  </span>
                )}
                {idx < itemStatuses.length - 1 && (
                  <span className="text-slate-400">,</span>
                )}
              </span>
            ))}
          </p>

          {/* Sold Out Warning Notice */}
          {hasSoldOutItem && (
            <div
              role="alert"
              className="mt-2.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/35 text-xs font-bold text-[#d90429] dark:text-red-300 leading-snug"
            >
              {isBn
                ? `🚫 "${soldOutNames.join(', ')}" আজকের মতো শেষ (Sold Out) — তাই ১-ক্লিক রি-অর্ডার বন্ধ আছে।`
                : `🚫 "${soldOutNames.join(', ')}" is currently Sold Out — 1-Tap Re-Order is disabled.`}
            </div>
          )}

          {/* Two Clean Action Buttons */}
          <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              disabled={disableQuickReorder}
              aria-disabled={disableQuickReorder}
              onClick={() => onQuickReorder(activeOrder)}
              className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                disableQuickReorder
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-[#d90429] hover:bg-[#b30322] active:scale-[0.99] text-white shadow-sm cursor-pointer'
              }`}
            >
              <Zap
                className={`w-4 h-4 shrink-0 ${
                  disableQuickReorder ? 'text-slate-400' : 'text-[#ffd166]'
                }`}
              />
              <span>
                {hasSoldOutItem
                  ? isBn
                    ? '🚫 খাবার শেষ (রি-অর্ডার বন্ধ)'
                    : '🚫 Item Sold Out (Unavailable)'
                  : isBn
                  ? '⚡ ১-ক্লিকে আবার অর্ডার করুন'
                  : '⚡ 1-Tap Re-Order via WhatsApp'}
              </span>
            </button>

            <button
              type="button"
              disabled={disableLoadToCart}
              aria-disabled={disableLoadToCart}
              onClick={() => onLoadToCart(activeOrder)}
              className={`sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                disableLoadToCart
                  ? 'bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 cursor-not-allowed'
                  : 'bg-white dark:bg-[#141520] hover:bg-slate-50 dark:hover:bg-[#232436] active:scale-[0.99] text-[#1d1e2c] dark:text-slate-100 border-slate-200 dark:border-white/15 cursor-pointer'
              }`}
            >
              <ShoppingCart
                className={`w-4 h-4 shrink-0 ${
                  disableLoadToCart
                    ? 'text-slate-400'
                    : 'text-[#d90429] dark:text-[#ff9f1c]'
                }`}
              />
              <span>
                {hasSoldOutItem && availableCount > 0
                  ? isBn
                    ? '🛒 উপলব্ধ খাবার কার্টে নিন'
                    : '🛒 Load Available Items'
                  : isBn
                  ? '🛒 কার্টে যোগ করুন'
                  : '🛒 Load to Cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
