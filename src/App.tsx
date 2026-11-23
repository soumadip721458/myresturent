import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BottomCheckoutBar } from './components/BottomCheckoutBar';
import { ConfettiBurst } from './components/ConfettiBurst';
import { DeliveryCheckoutSection } from './components/DeliveryCheckoutSection';
import { HeroHeader } from './components/HeroHeader';
import { MenuSection } from './components/MenuSection';
import { RepeatOrderCard } from './components/RepeatOrderCard';
import { ReviewsSection } from './components/ReviewsSection';
import { SpinWheelModal } from './components/SpinWheelModal';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import {
  BASE_HISTORICAL_RATING_SUM,
  BASE_HISTORICAL_REVIEW_COUNT,
  STORAGE_KEYS,
  loadCustomerReviews,
  loadDarkMode,
  loadLanguage,
  loadMenuDishes,
  loadSavedOrders,
  loadShopConfig,
} from './data/defaults';
import type {
  CustomerDetails,
  CustomerReview,
  Dish,
  Language,
  MenuCategory,
  SavedOrder,
  SavedOrderItem,
  SavedSpinRecord,
  ShopConfig,
  SpinPrizeId,
} from './types';
import { getTodayKey, normalizePhoneDigits } from './utils/bengali';
import { getDishCopy, getShopCopy, getSpinSliceCopy } from './utils/i18n';
import {
  buildWhatsAppOrder,
  calculateOrderPricing,
  getSpinSliceById,
} from './utils/pricing';

function loadTodaySpinPrize(): SpinPrizeId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SPIN);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedSpinRecord>;
    if (parsed.date === getTodayKey() && parsed.prizeId) {
      return parsed.prizeId;
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => loadLanguage());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => loadDarkMode());
  const [shop, setShop] = useState<ShopConfig>(() => loadShopConfig());
  const [dishes, setDishes] = useState<Dish[]>(() => loadMenuDishes());
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('all');
  const [cart, setCart] = useState<Record<string, number>>({});

  // Saved past orders (last 3) & customer live reviews
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() =>
    loadSavedOrders()
  );
  const [reviews, setReviews] = useState<CustomerReview[]>(() =>
    loadCustomerReviews()
  );

  // Daily Spin & Win state
  const [wonPrizeId, setWonPrizeId] = useState<SpinPrizeId | null>(() =>
    loadTodaySpinPrize()
  );
  const [spinModalOpen, setSpinModalOpen] = useState<boolean>(
    () => !loadTodaySpinPrize()
  );
  const [showConfetti, setShowConfetti] = useState(false);

  // Customer delivery details — auto-filled from last saved order when available
  const [customer, setCustomer] = useState<CustomerDetails>(() => {
    const past = loadSavedOrders();
    if (past.length > 0 && past[0].customer) {
      return {
        name: past[0].customer.name || '',
        phone: past[0].customer.phone || '',
        address: past[0].customer.address || '',
      };
    }
    return { name: '', phone: '', address: '' };
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CustomerDetails | 'cart', string>>
  >({});

  // WhatsApp Receipt & Admin Modal states
  const [whatsappOrder, setWhatsappOrder] = useState<{
    receiptText: string;
    whatsappUrl: string;
  } | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  // Lightweight toast notification & section refs
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const deliverySectionRef = useRef<HTMLElement | null>(null);
  const reviewsSectionRef = useRef<HTMLElement | null>(null);
  const secretTapTimestampsRef = useRef<number[]>([]);

  const isBn = lang === 'bn';

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, next ? 'dark' : 'light');
      } catch {
        // Ignore storage errors in private browsing
      }
      return next;
    });
  }, []);

  // Dynamic live average rating & count combining historical baseline + stored reviews
  const { averageRating, totalReviewCount } = useMemo(() => {
    const storedSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const totalCount = BASE_HISTORICAL_REVIEW_COUNT + reviews.length;
    const avg =
      totalCount > 0
        ? (BASE_HISTORICAL_RATING_SUM + storedSum) / totalCount
        : 4.9;
    return {
      averageRating: Math.min(5, Math.max(1, Number(avg.toFixed(1)))),
      totalReviewCount: totalCount,
    };
  }, [reviews]);

  const handleToggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next: Language = prev === 'bn' ? 'en' : 'bn';
      try {
        localStorage.setItem(STORAGE_KEYS.LANG, next);
      } catch {
        // Ignore storage errors in private browsing
      }
      return next;
    });
    setFormErrors({});
  }, []);

  const handleSecretFooterTap = useCallback(() => {
    const now = Date.now();
    const recentTaps = secretTapTimestampsRef.current.filter(
      (ts) => now - ts <= 3000
    );
    recentTaps.push(now);
    if (recentTaps.length >= 5) {
      secretTapTimestampsRef.current = [];
      setAdminOpen(true);
    } else {
      secretTapTimestampsRef.current = recentTaps;
    }
  }, []);

  const notify = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const pricing = useMemo(
    () => calculateOrderPricing(dishes, cart, wonPrizeId, shop, lang),
    [dishes, cart, wonPrizeId, shop, lang]
  );

  const wonSlice = useMemo(() => getSpinSliceById(wonPrizeId), [wonPrizeId]);
  const wonSliceCopy = useMemo(
    () => (wonSlice ? getSpinSliceCopy(wonSlice, lang) : null),
    [wonSlice, lang]
  );
  const shopCopy = useMemo(() => getShopCopy(shop, lang), [shop, lang]);

  const persistOrderHistory = useCallback(
    (
      orderedCart: Record<string, number>,
      total: number,
      normalizedCustomer: CustomerDetails
    ) => {
      const items: SavedOrderItem[] = dishes
        .filter((d) => (orderedCart[d.id] ?? 0) > 0)
        .map((d) => ({
          dishId: d.id,
          name: d.name,
          nameEn: getDishCopy(d, 'en').name,
          qty: orderedCart[d.id] ?? 0,
          priceAtOrder: d.price,
        }));

      if (items.length === 0) return;

      const newOrder: SavedOrder = {
        id: `ord-${Date.now()}`,
        createdAt: new Date().toISOString(),
        items,
        total,
        customer: normalizedCustomer,
      };

      setSavedOrders((prev) => {
        const next = [newOrder, ...prev].slice(0, 3);
        try {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
        } catch {
          // Ignore storage quota issues
        }
        return next;
      });
    },
    [dishes]
  );

  const handleUpdateQty = useCallback((dishId: string, delta: number) => {
    setCart((prev) => {
      const nextQty = Math.max(0, (prev[dishId] ?? 0) + delta);
      const next = { ...prev };
      if (nextQty === 0) {
        delete next[dishId];
      } else {
        next[dishId] = nextQty;
      }
      return next;
    });
    setFormErrors((prev) => {
      if (!prev.cart) return prev;
      const { cart: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleSpinWin = useCallback(
    (prizeId: SpinPrizeId) => {
      setWonPrizeId(prizeId);
      setShowConfetti(true);
      const record: SavedSpinRecord = {
        date: getTodayKey(),
        prizeId,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SPIN, JSON.stringify(record));
      } catch {
        // Ignore storage errors in private browsing modes
      }
      const slice = getSpinSliceById(prizeId);
      if (slice) {
        const copy = getSpinSliceCopy(slice, lang);
        notify(
          lang === 'bn'
            ? `অভিনন্দন! আপনি জিতলেন: ${copy.shortTitle}`
            : `Congrats! You won: ${copy.shortTitle}`
        );
      }
    },
    [lang, notify]
  );

  const handleCustomerChange = useCallback(
    (field: keyof CustomerDetails, value: string) => {
      setCustomer((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const handleSaveShop = useCallback(
    (nextShop: ShopConfig) => {
      setShop(nextShop);
      try {
        localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(nextShop));
      } catch {
        notify('ছবির সাইজ বড় হওয়ায় সেভ করতে সমস্যা হয়েছে — ছোট ছবি চেষ্টা করুন');
      }
    },
    [notify]
  );

  const handleSaveDishes = useCallback(
    (nextDishes: Dish[]) => {
      setDishes(nextDishes);
      try {
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(nextDishes));
      } catch {
        notify('স্টোরেজ পূর্ণ! অনুগ্রহ করে ছবির সাইজ ছোট করুন বা URL ব্যবহার করুন');
      }
    },
    [notify]
  );

  const handleAddReview = useCallback(
    ({
      rating,
      name,
      comment,
    }: {
      rating: number;
      name: string;
      comment: string;
    }) => {
      const displayName =
        name || (lang === 'bn' ? 'সন্তুষ্ট গ্রাহক' : 'Happy Customer');

      const newReview: CustomerReview = {
        id: `rev-${Date.now()}`,
        name: displayName,
        nameEn: displayName,
        rating,
        comment,
        commentEn: comment,
        createdAt: new Date().toISOString(),
      };

      setReviews((prev) => {
        const next = [newReview, ...prev].slice(0, 30);
        try {
          localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });

      notify(
        lang === 'bn'
          ? 'ধন্যবাদ! আপনার রেটিং ও রিভিউ সফলভাবে যুক্ত হয়েছে ⭐'
          : 'Thank you! Your rating & review has been published ⭐'
      );
    },
    [lang, notify]
  );

  const handleScrollToReviews = useCallback(() => {
    reviewsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const launchWhatsAppModal = useCallback(
    (orderPayload: { receiptText: string; whatsappUrl: string }) => {
      setWhatsappOrder(orderPayload);

      const link = document.createElement('a');
      link.href = orderPayload.whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    []
  );

  const handlePlaceOrder = useCallback(() => {
    const errors: Partial<Record<keyof CustomerDetails | 'cart', string>> = {};

    if (pricing.itemCount === 0) {
      errors.cart = isBn
        ? 'অর্ডার করার আগে মেনু থেকে অন্তত ১টি খাবার নির্বাচন করুন।'
        : 'Please add at least 1 dish from the menu before placing an order.';
    }

    if (customer.name.trim().length < 2) {
      errors.name = isBn
        ? 'অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।'
        : 'Please enter your full name.';
    }

    const phoneDigits = normalizePhoneDigits(customer.phone);
    if (phoneDigits.length !== 10) {
      errors.phone = isBn
        ? 'সঠিক ১০ সংখ্যার মোবাইল নম্বর দিন।'
        : 'Please enter a valid 10-digit mobile number.';
    }

    if (customer.address.trim().length < 6) {
      errors.address = isBn
        ? 'গ্রামের নাম, পাড়া ও কাছের চিহ্ন স্পষ্ট করে লিখুন।'
        : 'Please enter your village/area and nearby landmark clearly.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (pricing.itemCount === 0) {
        notify(
          isBn
            ? 'প্রথমে মেনু থেকে পছন্দের খাবার যোগ করুন!'
            : 'Please add your favorite dishes from the menu first!'
        );
        window.scrollTo({ top: 260, behavior: 'smooth' });
      } else {
        notify(
          isBn
            ? 'অনুগ্রহ করে ডেলিভারি তথ্য সঠিকভাবে পূরণ করুন'
            : 'Please fill in your delivery details accurately'
        );
        deliverySectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
      return;
    }

    const normalizedCustomer: CustomerDetails = {
      name: customer.name.trim(),
      phone: phoneDigits,
      address: customer.address.trim(),
    };

    const orderPayload = buildWhatsAppOrder(
      shop,
      dishes,
      cart,
      normalizedCustomer,
      wonPrizeId,
      pricing,
      lang
    );

    persistOrderHistory(cart, pricing.finalTotal, normalizedCustomer);
    launchWhatsAppModal(orderPayload);
  }, [
    cart,
    customer,
    dishes,
    isBn,
    lang,
    launchWhatsAppModal,
    notify,
    persistOrderHistory,
    pricing,
    shop,
    wonPrizeId,
  ]);

  const buildCartFromSavedOrder = useCallback(
    (order: SavedOrder): Record<string, number> => {
      const validIds = new Set(dishes.map((d) => d.id));
      const nextCart: Record<string, number> = {};
      for (const item of order.items) {
        if (validIds.has(item.dishId) && item.qty > 0) {
          nextCart[item.dishId] = item.qty;
        }
      }
      return nextCart;
    },
    [dishes]
  );

  const handleLoadOrderToCart = useCallback(
    (order: SavedOrder) => {
      const nextCart = buildCartFromSavedOrder(order);
      if (Object.keys(nextCart).length === 0) {
        notify(
          isBn
            ? 'আগের অর্ডারের খাবারগুলো বর্তমানে মেনুতে পাওয়া যায়নি।'
            : 'Items from that previous order are no longer on the menu.'
        );
        return;
      }

      setCart(nextCart);
      setCustomer((prev) => ({
        name: prev.name.trim() ? prev.name : order.customer.name || '',
        phone: prev.phone.trim() ? prev.phone : order.customer.phone || '',
        address: prev.address.trim()
          ? prev.address
          : order.customer.address || '',
      }));
      setFormErrors({});

      notify(
        isBn
          ? 'আগের অর্ডারের খাবারগুলো কার্টে যোগ হয়েছে — চাইলে পরিবর্তন করুন!'
          : 'Previous order items loaded to cart — adjust anytime!'
      );
    },
    [buildCartFromSavedOrder, isBn, notify]
  );

  const handleQuickReorder = useCallback(
    (order: SavedOrder) => {
      const nextCart = buildCartFromSavedOrder(order);
      if (Object.keys(nextCart).length === 0) {
        notify(
          isBn
            ? 'আগের অর্ডারের খাবারগুলো বর্তমানে মেনুতে পাওয়া যায়নি।'
            : 'Items from that previous order are no longer on the menu.'
        );
        return;
      }

      const resolvedCustomer: CustomerDetails = {
        name: customer.name.trim() || order.customer.name || '',
        phone: normalizePhoneDigits(
          customer.phone.trim() || order.customer.phone || ''
        ),
        address: customer.address.trim() || order.customer.address || '',
      };

      setCart(nextCart);
      setCustomer(resolvedCustomer);
      setFormErrors({});

      if (
        resolvedCustomer.name.length < 2 ||
        resolvedCustomer.phone.length !== 10 ||
        resolvedCustomer.address.length < 6
      ) {
        notify(
          isBn
            ? 'খাবার কার্টে যোগ হয়েছে — অর্ডার করতে ডেলিভারি তথ্য সম্পূর্ণ করুন'
            : 'Items loaded — please complete your delivery details to order'
        );
        deliverySectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      }

      // Recalculate fresh total with current menu prices & current Packaging/GST config
      const freshPricing = calculateOrderPricing(
        dishes,
        nextCart,
        wonPrizeId,
        shop,
        lang
      );

      const orderPayload = buildWhatsAppOrder(
        shop,
        dishes,
        nextCart,
        resolvedCustomer,
        wonPrizeId,
        freshPricing,
        lang
      );

      persistOrderHistory(nextCart, freshPricing.finalTotal, resolvedCustomer);
      launchWhatsAppModal(orderPayload);
    },
    [
      buildCartFromSavedOrder,
      customer,
      dishes,
      isBn,
      lang,
      launchWhatsAppModal,
      notify,
      persistOrderHistory,
      shop,
      wonPrizeId,
    ]
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#11121a] text-[#1d1e2c] dark:text-slate-100 pb-40 transition-colors duration-200">
      {/* Celebratory Confetti Overlay */}
      <ConfettiBurst
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-[92vw] bg-[#1d1e2c] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#ff9f1c]/40 text-sm font-semibold text-center"
        >
          {toastMessage}
        </div>
      )}

      {/* Hero Header + Live Winners Ticker */}
      <HeroHeader
        shop={shop}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        hasWonToday={Boolean(wonPrizeId)}
        onOpenSpin={() => setSpinModalOpen(true)}
        liveRating={averageRating}
        totalReviews={totalReviewCount}
        onRatingClick={handleScrollToReviews}
      />

      {/* Sticky Won Reward Banner above Menu */}
      {wonSliceCopy && (
        <div className="sticky top-0 z-30 w-full bg-[#fff8eb]/95 dark:bg-[#231d14]/95 backdrop-blur-md border-b border-[#ff9f1c]/45 dark:border-[#ff9f1c]/35 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d90429] dark:text-[#ff9f1c] shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-[#1d1e2c] dark:text-slate-100 truncate">
                {pricing.spinRewardActive
                  ? isBn
                    ? '✅ সক্রিয় পুরস্কার: '
                    : '✅ Active Reward: '
                  : isBn
                  ? '🎁 জিতেছেন: '
                  : '🎁 You Won: '}
                <span className="text-[#d90429] dark:text-[#ffd166]">
                  {wonSliceCopy.shortTitle}
                </span>
                {pricing.spinRewardHint && (
                  <span className="hidden sm:inline font-medium text-slate-600 dark:text-slate-300 ml-2">
                    — {pricing.spinRewardHint}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSpinModalOpen(true)}
              className="text-xs font-bold text-[#d90429] dark:text-[#ffd166] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isBn ? 'বিস্তারিত' : 'Details'}
            </button>
          </div>
          {pricing.spinRewardHint && (
            <div className="sm:hidden px-4 pb-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
              {pricing.spinRewardHint}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main>
        {/* Previous Orders & 1-Tap Re-Order Card (visible when at least 1 saved order exists) */}
        <RepeatOrderCard
          orders={savedOrders}
          dishes={dishes}
          lang={lang}
          onQuickReorder={handleQuickReorder}
          onLoadToCart={handleLoadOrderToCart}
        />

        <MenuSection
          dishes={dishes}
          lang={lang}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          cart={cart}
          onUpdateQty={handleUpdateQty}
        />

        <DeliveryCheckoutSection
          sectionRef={deliverySectionRef}
          shop={shop}
          lang={lang}
          dishes={dishes}
          cart={cart}
          pricing={pricing}
          customer={customer}
          errors={formErrors}
          onCustomerChange={handleCustomerChange}
          onPlaceOrder={handlePlaceOrder}
        />

        {/* Live Customer Rating & Quick Review Section */}
        <ReviewsSection
          sectionRef={reviewsSectionRef}
          lang={lang}
          reviews={reviews}
          averageRating={averageRating}
          totalReviewCount={totalReviewCount}
          onAddReview={handleAddReview}
        />
      </main>

      {/* Clean Footer with Hidden 5-Tap Secret Admin Trigger */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-slate-200/90 dark:border-white/10 text-center">
        <div
          onClick={handleSecretFooterTap}
          className="inline-block select-none"
        >
          <p className="text-sm font-bold text-[#1d1e2c] dark:text-slate-100">
            {shopCopy.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            📍 {shopCopy.address} •{' '}
            {isBn
              ? 'প্রতিদিন সকাল ১১টা – রাত ১১টা'
              : 'Open Daily 11:00 AM – 11:00 PM'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            © {new Date().getFullYear()} {shopCopy.name} •{' '}
            {isBn ? 'সর্বস্বত্ব সংরক্ষিত' : 'All Rights Reserved'}
          </p>
        </div>
      </footer>

      {/* Floating Spin & Win Reopen Trigger Button (when modal is closed) */}
      {!spinModalOpen && (
        <button
          type="button"
          onClick={() => setSpinModalOpen(true)}
          aria-label={isBn ? 'স্পিন অ্যান্ড উইন খুলুন' : 'Open Spin & Win'}
          className="fixed right-4 bottom-28 sm:bottom-24 z-30 min-h-[46px] px-3.5 py-2 rounded-full bg-[#ff9f1c] hover:bg-[#f2910d] active:scale-95 text-[#1d1e2c] font-bold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Gift className="w-4 h-4 text-[#d90429] shrink-0" />
          <span>
            {wonPrizeId
              ? isBn
                ? 'পুরস্কার'
                : 'My Prize'
              : isBn
              ? 'স্পিন করুন!'
              : 'Spin & Win!'}
          </span>
        </button>
      )}

      {/* Fixed Bottom Checkout Bar + Free Home Delivery Strip */}
      <BottomCheckoutBar
        shop={shop}
        lang={lang}
        pricing={pricing}
        onCheckoutClick={handlePlaceOrder}
      />

      {/* Spin & Win Modal */}
      <SpinWheelModal
        isOpen={spinModalOpen}
        lang={lang}
        onClose={() => setSpinModalOpen(false)}
        wonPrizeId={wonPrizeId}
        onWin={handleSpinWin}
      />

      {/* WhatsApp Receipt Confirmation Modal */}
      <WhatsAppOrderModal
        isOpen={Boolean(whatsappOrder)}
        lang={lang}
        receiptText={whatsappOrder?.receiptText ?? ''}
        whatsappUrl={whatsappOrder?.whatsappUrl ?? ''}
        onClose={() => setWhatsappOrder(null)}
      />

      {/* PIN-Protected Owner Admin Panel Modal */}
      <AdminPanelModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        shop={shop}
        dishes={dishes}
        onSaveShop={handleSaveShop}
        onSaveDishes={handleSaveDishes}
        onNotify={notify}
      />
    </div>
  );
}
