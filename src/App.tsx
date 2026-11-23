import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BottomCheckoutBar } from './components/BottomCheckoutBar';
import { ConfettiBurst } from './components/ConfettiBurst';
import { DeliveryCheckoutSection } from './components/DeliveryCheckoutSection';
import { HeroHeader } from './components/HeroHeader';
import { MenuSection } from './components/MenuSection';
import { SpinWheelModal } from './components/SpinWheelModal';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import {
  STORAGE_KEYS,
  loadMenuDishes,
  loadShopConfig,
} from './data/defaults';
import type {
  CustomerDetails,
  Dish,
  MenuCategory,
  SavedSpinRecord,
  ShopConfig,
  SpinPrizeId,
} from './types';
import { getTodayKey, normalizePhoneDigits } from './utils/bengali';
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
  const [shop, setShop] = useState<ShopConfig>(() => loadShopConfig());
  const [dishes, setDishes] = useState<Dish[]>(() => loadMenuDishes());
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('all');
  const [cart, setCart] = useState<Record<string, number>>({});

  // Daily Spin & Win state
  const [wonPrizeId, setWonPrizeId] = useState<SpinPrizeId | null>(() =>
    loadTodaySpinPrize()
  );
  const [spinModalOpen, setSpinModalOpen] = useState<boolean>(
    () => !loadTodaySpinPrize()
  );
  const [showConfetti, setShowConfetti] = useState(false);

  // Customer delivery details & validation
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    phone: '',
    address: '',
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

  // Lightweight toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const deliverySectionRef = useRef<HTMLElement | null>(null);
  const secretTapTimestampsRef = useRef<number[]>([]);

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
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const pricing = useMemo(
    () => calculateOrderPricing(dishes, cart, wonPrizeId),
    [dishes, cart, wonPrizeId]
  );

  const wonSlice = useMemo(() => getSpinSliceById(wonPrizeId), [wonPrizeId]);

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
        notify(`অভিনন্দন! আপনি জিতলেন: ${slice.shortTitle}`);
      }
    },
    [notify]
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

  const handlePlaceOrder = useCallback(() => {
    const errors: Partial<Record<keyof CustomerDetails | 'cart', string>> = {};

    if (pricing.itemCount === 0) {
      errors.cart = 'অর্ডার করার আগে মেনু থেকে অন্তত ১টি খাবার নির্বাচন করুন।';
    }

    if (customer.name.trim().length < 2) {
      errors.name = 'অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।';
    }

    const phoneDigits = normalizePhoneDigits(customer.phone);
    if (phoneDigits.length !== 10) {
      errors.phone = 'সঠিক ১০ সংখ্যার মোবাইল নম্বর দিন।';
    }

    if (customer.address.trim().length < 6) {
      errors.address = 'গ্রামের নাম, পাড়া ও কাছের চিহ্ন স্পষ্ট করে লিখুন।';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (pricing.itemCount === 0) {
        notify('প্রথমে মেনু থেকে পছন্দের খাবার যোগ করুন!');
        window.scrollTo({ top: 260, behavior: 'smooth' });
      } else {
        notify('অনুগ্রহ করে ডেলিভারি তথ্য সঠিকভাবে পূরণ করুন');
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
      pricing
    );

    setWhatsappOrder(orderPayload);

    // Launch WhatsApp cleanly via anchor element while keeping receipt modal accessible
    const link = document.createElement('a');
    link.href = orderPayload.whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [cart, customer, dishes, notify, pricing, shop, wonPrizeId]);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#1d1e2c] pb-40">
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
        hasWonToday={Boolean(wonPrizeId)}
        onOpenSpin={() => setSpinModalOpen(true)}
      />

      {/* Sticky Won Reward Banner above Menu */}
      {wonSlice && (
        <div className="sticky top-0 z-30 w-full bg-[#fff8eb]/95 backdrop-blur-md border-b border-[#ff9f1c]/45 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d90429] shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-[#1d1e2c] truncate">
                {pricing.spinRewardActive ? '✅ সক্রিয় পুরস্কার: ' : '🎁 জিতেছেন: '}
                <span className="text-[#d90429]">{wonSlice.shortTitle}</span>
                {pricing.spinRewardHint && (
                  <span className="hidden sm:inline font-medium text-slate-600 ml-2">
                    — {pricing.spinRewardHint}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSpinModalOpen(true)}
              className="text-xs font-bold text-[#d90429] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              বিস্তারিত
            </button>
          </div>
          {pricing.spinRewardHint && (
            <div className="sm:hidden px-4 pb-1.5 text-[11px] font-medium text-slate-600 truncate">
              {pricing.spinRewardHint}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main>
        <MenuSection
          dishes={dishes}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          cart={cart}
          onUpdateQty={handleUpdateQty}
        />

        <DeliveryCheckoutSection
          sectionRef={deliverySectionRef}
          dishes={dishes}
          cart={cart}
          pricing={pricing}
          customer={customer}
          errors={formErrors}
          onCustomerChange={handleCustomerChange}
          onPlaceOrder={handlePlaceOrder}
        />
      </main>

      {/* Clean Footer with Hidden 5-Tap Secret Admin Trigger */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-slate-200/90 text-center">
        <div
          onClick={handleSecretFooterTap}
          className="inline-block select-none"
        >
          <p className="text-sm font-bold text-[#1d1e2c]">{shop.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            📍 {shop.address} • প্রতিদিন সকাল ১১টা – রাত ১১টা
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            © {new Date().getFullYear()} {shop.name} • সর্বস্বত্ব সংরক্ষিত
          </p>
        </div>
      </footer>

      {/* Floating Spin & Win Reopen Trigger Button (when modal is closed) */}
      {!spinModalOpen && (
        <button
          type="button"
          onClick={() => setSpinModalOpen(true)}
          aria-label="স্পিন অ্যান্ড উইন খুলুন"
          className="fixed right-4 bottom-28 sm:bottom-24 z-30 min-h-[46px] px-3.5 py-2 rounded-full bg-[#ff9f1c] hover:bg-[#f2910d] active:scale-95 text-[#1d1e2c] font-bold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Gift className="w-4 h-4 text-[#d90429] shrink-0" />
          <span>{wonPrizeId ? 'পুরস্কার' : 'স্পিন করুন!'}</span>
        </button>
      )}

      {/* Fixed Bottom Checkout Bar + Delivery Progress */}
      <BottomCheckoutBar
        pricing={pricing}
        onCheckoutClick={handlePlaceOrder}
      />

      {/* Spin & Win Modal */}
      <SpinWheelModal
        isOpen={spinModalOpen}
        onClose={() => setSpinModalOpen(false)}
        wonPrizeId={wonPrizeId}
        onWin={handleSpinWin}
      />

      {/* WhatsApp Receipt Confirmation Modal */}
      <WhatsAppOrderModal
        isOpen={Boolean(whatsappOrder)}
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
