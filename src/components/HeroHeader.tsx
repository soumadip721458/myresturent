import { Gift, MapPin, Moon, Star, Sun } from 'lucide-react';
import type { Language, ShopConfig } from '../types';
import { formatDigits, getLiveWinnersTicker, getShopCopy } from '../utils/i18n';
import { FoodImage } from './FoodImage';

interface HeroHeaderProps {
  shop: ShopConfig;
  lang: Language;
  onToggleLanguage: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  hasWonToday: boolean;
  onOpenSpin: () => void;
  liveRating: number;
  totalReviews: number;
  onRatingClick: () => void;
}

export function HeroHeader({
  shop,
  lang,
  onToggleLanguage,
  isDarkMode,
  onToggleDarkMode,
  hasWonToday,
  onOpenSpin,
  liveRating,
  totalReviews,
  onRatingClick,
}: HeroHeaderProps) {
  const isBn = lang === 'bn';
  const shopCopy = getShopCopy(shop, lang);
  const tickerItems = getLiveWinnersTicker(lang);
  const ratingText = formatDigits(liveRating.toFixed(1), lang);
  const reviewCountText = formatDigits(totalReviews, lang);

  return (
    <header className="w-full">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden bg-[#1d1e2c]">
        {/* Background Food / Storefront Photography */}
        <div className="absolute inset-0">
          <FoodImage
            src={shop.heroImage}
            alt={shopCopy.name}
            fallbackLabel={shopCopy.name}
            className="w-full h-full object-cover object-center scale-[1.01]"
          />
          {/* Measured dark contrast scrim for crisp legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#1d1e2c] via-[#1d1e2c]/78 to-[#1d1e2c]/55"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-8 sm:pt-8 sm:pb-11">
          {/* Top Utility Row: Language Switcher + Dark Mode Toggle (Left) & Prize Button (Right) */}
          <div className="flex items-center justify-between gap-2.5 mb-5 sm:mb-6">
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onToggleLanguage}
                aria-label={
                  isBn ? 'Switch language to English' : 'ভাষা বাংলায় পরিবর্তন করুন'
                }
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/25 text-xs sm:text-sm font-bold text-white shadow-md active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span aria-hidden="true">🌐</span>
                <span
                  className={
                    isBn
                      ? 'text-[#ffd166] underline underline-offset-4 decoration-2'
                      : 'text-white/70'
                  }
                >
                  বাংলা
                </span>
                <span aria-hidden="true" className="text-white/35">
                  |
                </span>
                <span
                  className={
                    !isBn
                      ? 'text-[#ffd166] underline underline-offset-4 decoration-2'
                      : 'text-white/70'
                  }
                >
                  EN
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={
                  isDarkMode
                    ? isBn
                      ? 'লাইট মোড চালু করুন'
                      : 'Switch to Light Mode'
                    : isBn
                    ? 'ডার্ক মোড চালু করুন'
                    : 'Switch to Dark Mode'
                }
                title={
                  isDarkMode
                    ? isBn
                      ? 'লাইট মোড'
                      : 'Light Mode'
                    : isBn
                    ? 'ডার্ক মোড'
                    : 'Dark Mode'
                }
                className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-md active:scale-[0.95] transition-all cursor-pointer shrink-0"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-[#ffd166]" />
                ) : (
                  <Moon className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenSpin}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#ff9f1c] hover:bg-[#f2910d] active:scale-[0.98] text-[#1d1e2c] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Gift className="w-4 h-4 shrink-0" />
              <span>
                {hasWonToday
                  ? isBn
                    ? 'আপনার পুরস্কার দেখুন'
                    : 'View Your Prize'
                  : isBn
                  ? 'চাকা ঘোরান ও জিতুন'
                  : 'Spin & Win'}
              </span>
            </button>
          </div>

          {/* Live Kitchen Status Badge */}
          <div className="mb-3.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur-sm border border-emerald-400/35 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-100 shadow-sm">
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full bg-emerald-400 live-dot-glow shrink-0"
              />
              <span>🟢 {shopCopy.statusText}</span>
            </div>
          </div>

          {/* Restaurant Title, Tagline & Location Metadata */}
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight tracking-tight [text-wrap:balance] drop-shadow-sm">
              {shopCopy.name}
            </h1>
            {shopCopy.subtitle && (
              <p className="mt-1 text-sm sm:text-base font-semibold text-[#ffd166]/95 tracking-tight">
                {shopCopy.subtitle}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base text-white/90 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#ff9f1c] shrink-0" />
                <span>📍 {shopCopy.address}</span>
              </span>
              <span aria-hidden="true" className="text-white/35 hidden sm:inline">
                •
              </span>
              <button
                type="button"
                onClick={onRatingClick}
                aria-label={
                  isBn
                    ? 'কাস্টমার রেটিং ও রিভিউ দেখুন'
                    : 'View customer ratings and reviews'
                }
                className="inline-flex items-center gap-1.5 text-[#ffd166] hover:text-white font-semibold tabular-nums underline-offset-4 hover:underline transition-colors cursor-pointer"
              >
                <Star className="w-4 h-4 fill-[#ff9f1c] text-[#ff9f1c] shrink-0" />
                <span>⭐ {ratingText}</span>
                <span className="text-white/80 font-normal text-xs sm:text-sm">
                  ({reviewCountText}+ {isBn ? 'রিভিউ' : 'Reviews'})
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Scrolling Live Winners Ticker */}
      <div
        aria-label={isBn ? 'সাম্প্রতিক বিজয়ীদের তালিকা' : 'Recent winners ticker'}
        className="w-full bg-[#1d1e2c] border-t border-white/10 border-b border-black/20 overflow-hidden py-2.5"
      >
        <div className="animate-ticker flex items-center gap-8 text-xs sm:text-sm font-medium text-white/95">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span className="text-[#ffd166]">{item}</span>
              <span aria-hidden="true" className="text-white/25 pl-4">
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
