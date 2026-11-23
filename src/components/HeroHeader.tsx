import { Gift, MapPin, Star } from 'lucide-react';
import { LIVE_WINNERS_TICKER } from '../data/defaults';
import type { ShopConfig } from '../types';
import { FoodImage } from './FoodImage';

interface HeroHeaderProps {
  shop: ShopConfig;
  hasWonToday: boolean;
  onOpenSpin: () => void;
}

export function HeroHeader({
  shop,
  hasWonToday,
  onOpenSpin,
}: HeroHeaderProps) {
  return (
    <header className="w-full">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden bg-[#1d1e2c]">
        {/* Background Food / Storefront Photography */}
        <div className="absolute inset-0">
          <FoodImage
            src={shop.heroImage}
            alt={shop.name}
            fallbackLabel={shop.name}
            className="w-full h-full object-cover object-center scale-[1.01]"
          />
          {/* Measured dark contrast scrim for crisp Bengali legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#1d1e2c] via-[#1d1e2c]/78 to-[#1d1e2c]/55"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-10 sm:pb-11">
          {/* Top Utility Row: Live Status + Spin Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur-sm border border-emerald-400/35 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-100 shadow-sm">
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full bg-emerald-400 live-dot-glow shrink-0"
              />
              <span>🟢 {shop.statusText}</span>
            </div>

            <button
              type="button"
              onClick={onOpenSpin}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#ff9f1c] hover:bg-[#f2910d] active:scale-[0.98] text-[#1d1e2c] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Gift className="w-4 h-4 shrink-0" />
              <span>{hasWonToday ? 'আপনার পুরস্কার দেখুন' : 'চাকা ঘোরান ও জিতুন'}</span>
            </button>
          </div>

          {/* Restaurant Title & Location Metadata */}
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight tracking-tight [text-wrap:balance] drop-shadow-sm">
              {shop.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base text-white/90 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#ff9f1c] shrink-0" />
                <span>📍 {shop.address}</span>
              </span>
              <span aria-hidden="true" className="text-white/35 hidden sm:inline">
                •
              </span>
              <span className="inline-flex items-center gap-1 text-[#ffd166] font-semibold tabular-nums">
                <Star className="w-4 h-4 fill-[#ff9f1c] text-[#ff9f1c] shrink-0" />
                <span>⭐ {shop.rating}</span>
                <span className="text-white/75 font-normal text-xs sm:text-sm ml-1">
                  (বিশ্বস্ত স্থানীয় স্বাদ)
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Scrolling Live Winners Ticker */}
      <div
        aria-label="সাম্প্রতিক বিজয়ীদের তালিকা"
        className="w-full bg-[#1d1e2c] border-t border-white/10 border-b border-black/20 overflow-hidden py-2.5"
      >
        <div className="animate-ticker flex items-center gap-8 text-xs sm:text-sm font-medium text-white/95">
          {[...LIVE_WINNERS_TICKER, ...LIVE_WINNERS_TICKER].map((item, idx) => (
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
