import { useState } from 'react';
import { MessageSquarePlus, Send, Star, UserCheck } from 'lucide-react';
import type { CustomerReview, Language } from '../types';
import { formatDigits } from '../utils/i18n';

interface ReviewsSectionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  lang: Language;
  reviews: CustomerReview[];
  averageRating: number;
  totalReviewCount: number;
  onAddReview: (review: {
    rating: number;
    name: string;
    comment: string;
  }) => void;
}

const STAR_LABELS = {
  bn: ['', 'ভালো লাগেনি', 'মোটামুটি', 'ভালো ছিল', 'খুব সুন্দর!', 'অসাধারণ স্বাদ!'],
  en: ['', 'Needs Work', 'Okay', 'Good', 'Very Tasty!', 'Outstanding!'],
};

function formatReviewDate(review: CustomerReview, lang: Language): string {
  if (lang === 'bn' && review.dateLabelBn) return review.dateLabelBn;
  if (lang === 'en' && review.dateLabelEn) return review.dateLabelEn;

  try {
    const date = new Date(review.createdAt);
    if (Number.isNaN(date.getTime())) {
      return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    }
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60 * 60 * 1000) {
      return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    }
    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return lang === 'bn' ? 'এইমাত্র' : 'Just now';
  }
}

export function ReviewsSection({
  sectionRef,
  lang,
  reviews,
  averageRating,
  totalReviewCount,
  onAddReview,
}: ReviewsSectionProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');

  const isBn = lang === 'bn';
  const formattedAvg = formatDigits(averageRating.toFixed(1), lang);
  const formattedCount = formatDigits(totalReviewCount, lang);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStars < 1 || selectedStars > 5) return;

    onAddReview({
      rating: selectedStars,
      name: reviewerName.trim(),
      comment: comment.trim(),
    });

    setReviewerName('');
    setComment('');
    setSelectedStars(5);
    setComposerOpen(false);
  };

  return (
    <section
      ref={sectionRef}
      id="customer-reviews"
      aria-labelledby="reviews-heading"
      className="max-w-5xl mx-auto px-4 sm:px-6 mt-8"
    >
      <div className="bg-white dark:bg-[#1a1b26] rounded-2xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-xs">
        {/* Header & Live Aggregate Score */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#1d1e2c] dark:bg-[#11121a] border border-transparent dark:border-white/10 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
              <span className="text-lg font-bold leading-none tabular-nums text-[#ffd166]">
                {formattedAvg}
              </span>
              <span className="text-[10px] text-white/75 mt-1 tabular-nums">
                / {isBn ? '৫.০' : '5.0'}
              </span>
            </div>

            <div>
              <h2
                id="reviews-heading"
                className="text-lg sm:text-xl font-bold text-[#1d1e2c] dark:text-slate-100 leading-tight"
              >
                {isBn ? '⭐ কাস্টমার রেটিং ও রিভিউ' : '⭐ Customer Ratings & Reviews'}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(averageRating)
                          ? 'fill-[#ff9f1c] text-[#ff9f1c]'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-[#1d1e2c] dark:text-slate-200 tabular-nums">
                  {isBn
                    ? `${formattedCount}+ গ্রাহক রিভিউ`
                    : `${formattedCount}+ Verified Reviews`}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setComposerOpen((prev) => !prev)}
            className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              composerOpen
                ? 'bg-slate-100 dark:bg-[#141520] text-[#1d1e2c] dark:text-slate-200 border border-transparent dark:border-white/15 hover:bg-slate-200 dark:hover:bg-[#232436]'
                : 'bg-[#ff9f1c] hover:bg-[#f2910d] text-[#1d1e2c] shadow-sm'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4 shrink-0" />
            <span>
              {composerOpen
                ? isBn
                  ? 'বন্ধ করুন'
                  : 'Close'
                : isBn
                ? '✍️ রেটিং দিন'
                : '✍️ Rate Us'}
            </span>
          </button>
        </div>

        {/* 1-Tap Interactive Rate Us Widget */}
        {composerOpen && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-2xl bg-[#f4f5f7] dark:bg-[#141520] border border-slate-200 dark:border-white/10 p-4 space-y-3.5"
          >
            <div className="text-center">
              <p className="text-sm font-bold text-[#1d1e2c] dark:text-slate-100">
                {isBn
                  ? 'আমাদের খাবার ও সার্ভিস কেমন লাগলো?'
                  : 'How was our food & service?'}
              </p>

              {/* Tactile 1–5 Star Selector */}
              <div
                role="radiogroup"
                aria-label={isBn ? 'স্টার রেটিং বেছে নিন' : 'Choose star rating'}
                className="mt-2 flex items-center justify-center gap-1.5"
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= selectedStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={selectedStars === star}
                      aria-label={`${star} ${isBn ? 'স্টার' : 'stars'}`}
                      onClick={() => setSelectedStars(star)}
                      className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active
                            ? 'fill-[#ff9f1c] text-[#ff9f1c]'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-[#d90429] dark:text-[#ffd166] mt-0.5">
                {STAR_LABELS[lang][selectedStars]}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder={
                  isBn ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (optional)'
                }
                maxLength={40}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#1a1b26] text-sm text-[#1d1e2c] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#d90429] focus:outline-none"
              />

              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isBn
                    ? 'ছোট মন্তব্য লিখুন (ঐচ্ছিক)'
                    : 'Write a short review (optional)'
                }
                maxLength={160}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#1a1b26] text-sm text-[#1d1e2c] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#d90429] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-[#d90429] hover:bg-[#b30322] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>{isBn ? 'রিভিউ জমা দিন' : 'Submit Review'}</span>
            </button>
          </form>
        )}

        {/* Recent Customer Reviews List */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {reviews.slice(0, 6).map((rev) => {
            const displayName =
              lang === 'en' && rev.nameEn ? rev.nameEn : rev.name;
            const displayComment =
              lang === 'en' && rev.commentEn ? rev.commentEn : rev.comment;

            return (
              <article
                key={rev.id}
                className="rounded-2xl bg-[#f9fafb] dark:bg-[#141520] border border-slate-200/80 dark:border-white/10 p-3.5 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-sm font-bold text-[#1d1e2c] dark:text-slate-100 truncate">
                        {displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-[#ff9f1c] text-[#ff9f1c]'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {displayComment && (
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      “{displayComment}”
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {formatReviewDate(rev, lang)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
