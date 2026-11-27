import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { Gift, Sparkles } from 'lucide-react';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BottomCheckoutBar } from './components/BottomCheckoutBar';
import { ConfettiBurst } from './components/ConfettiBurst';
import { DeliveryCheckoutSection } from './components/DeliveryCheckoutSection';
import { DeveloperControlModal } from './components/DeveloperControlModal';
import { HeroHeader } from './components/HeroHeader';
import { MenuSection } from './components/MenuSection';
import { RepeatOrderCard } from './components/RepeatOrderCard';
import { ReviewsSection } from './components/ReviewsSection';
import {
  SecretPinModal,
  type PinUnlockTarget,
} from './components/SecretPinModal';
import { ServicePausedOverlay } from './components/ServicePausedOverlay';
import { SpinWheelModal } from './components/SpinWheelModal';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import {
  BASE_HISTORICAL_RATING_SUM,
  BASE_HISTORICAL_REVIEW_COUNT,
  STORAGE_KEYS,
  isSubscriptionBlocked,
  loadCachedCloudOrders,
  loadCustomerReviews,
  loadDarkMode,
  loadDeveloperControl,
  loadLanguage,
  loadMenuDishes,
  loadSavedOrders,
  loadShopConfig,
  loadSpinRewards,
} from './data/defaults';
import {
  SHOP_ID,
  generateOrderCode,
  generateOrderDocId,
  saveCloudOrderToFirestore,
  signInWithGoogleForAdmin,
  signOutAdmin,
  subscribeAdminAuth,
  subscribeToCloudOrders,
  subscribeToShopTenant,
  syncShopTenantToCloud,
  updateCloudOrderStatus,
  type CloudWriteResult,
} from './firebase';
import type {
  CloudOrder,
  CloudOrderItem,
  CloudSyncStatus,
  CustomerDetails,
  CustomerLocation,
  CustomerReview,
  DeveloperControlConfig,
  Dish,
  Language,
  MenuCategory,
  OrderPricing,
  OrderStatus,
  SavedOrder,
  SavedOrderItem,
  SavedSpinRecord,
  ShopConfig,
  SpinPrizeId,
  SpinSlice,
} from './types';
import { getTodayKey, normalizePhoneDigits } from './utils/bengali';
import { buildGoogleMapsLink, calculateRoadDistanceKm } from './utils/geo';
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
  const [spinRewards, setSpinRewards] = useState<SpinSlice[]>(() =>
    loadSpinRewards()
  );
  const [developerControl, setDeveloperControl] =
    useState<DeveloperControlConfig>(() => loadDeveloperControl());

  // Multi-tenant Firebase Cloud Sync & Admin Auth state
  const [cloudStatus, setCloudStatus] =
    useState<CloudSyncStatus>('local-fallback');
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // Permanent Tamper-Proof Cloud Order Log (Firestore + localStorage offline fallback)
  const [localCloudOrders, setLocalCloudOrders] = useState<CloudOrder[]>(() =>
    loadCachedCloudOrders()
  );
  const [firestoreOrders, setFirestoreOrders] = useState<CloudOrder[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);

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
        location: past[0].customer.location ?? null,
      };
    }
    return { name: '', phone: '', address: '', location: null };
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CustomerDetails | 'cart', string>>
  >({});

  // WhatsApp Receipt, PIN Gate, Owner Admin & Developer Control Modal states
  const [whatsappOrder, setWhatsappOrder] = useState<{
    receiptText: string;
    whatsappUrl: string;
  } | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [devPanelOpen, setDevPanelOpen] = useState(false);

  // Lightweight toast notification & section refs
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const deliverySectionRef = useRef<HTMLElement | null>(null);
  const reviewsSectionRef = useRef<HTMLElement | null>(null);
  const secretTapTimestampsRef = useRef<number[]>([]);

  const isBn = lang === 'bn';

  // Real-time Firestore sync (`shops/{SHOP_ID}`) with graceful localStorage fallback
  useEffect(() => {
    const unsubscribe = subscribeToShopTenant((remote) => {
      if (remote.shopConfig) {
        setShop(remote.shopConfig);
        try {
          localStorage.setItem(
            STORAGE_KEYS.SHOP,
            JSON.stringify(remote.shopConfig)
          );
        } catch {
          // Ignore storage quota errors
        }
      }
      if (remote.menuItems) {
        setDishes(remote.menuItems);
        try {
          localStorage.setItem(
            STORAGE_KEYS.MENU,
            JSON.stringify(remote.menuItems)
          );
        } catch {
          // Ignore storage quota errors
        }
      }
      if (remote.spinRewards) {
        setSpinRewards(remote.spinRewards);
        try {
          localStorage.setItem(
            STORAGE_KEYS.SPIN_REWARDS,
            JSON.stringify(remote.spinRewards)
          );
        } catch {
          // Ignore storage quota errors
        }
      }
      if (remote.developerControl) {
        setDeveloperControl(remote.developerControl);
        try {
          localStorage.setItem(
            STORAGE_KEYS.DEVELOPER_CONTROL,
            JSON.stringify(remote.developerControl)
          );
        } catch {
          // Ignore storage quota errors
        }
      }
    }, setCloudStatus);

    return () => unsubscribe();
  }, []);

  // Track Google Auth user for authenticated Firestore admin/developer writes
  useEffect(() => {
    const unsubscribe = subscribeAdminAuth((user) => {
      setAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Live Orders listener (`shops/{SHOP_ID}/orders`) — attached only when admin is signed in
  useEffect(() => {
    if (!adminUser) {
      setFirestoreOrders([]);
      setOrdersError(null);
      return;
    }

    setOrdersError(null);
    const unsubscribe = subscribeToCloudOrders(
      (remoteOrders) => {
        setFirestoreOrders(remoteOrders);
        setOrdersError(null);
      },
      (errMsg) => {
        setOrdersError(errMsg);
      }
    );

    return () => unsubscribe();
  }, [adminUser]);

  // Merge Firestore live orders with local fallback records (newest first, deduplicated by docId)
  const allAdminOrders = useMemo(() => {
    const map = new Map<string, CloudOrder>();
    for (const localOrd of localCloudOrders) {
      map.set(localOrd.docId, localOrd);
    }
    for (const cloudOrd of firestoreOrders) {
      map.set(cloudOrd.docId, cloudOrd);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.timestampMs - a.timestampMs
    );
  }, [firestoreOrders, localCloudOrders]);

  const subscriptionState = useMemo(
    () => isSubscriptionBlocked(developerControl, getTodayKey()),
    [developerControl]
  );

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
      setPinModalOpen(true);
    } else {
      secretTapTimestampsRef.current = recentTaps;
    }
  }, []);

  const handlePinUnlock = useCallback((target: PinUnlockTarget) => {
    setPinModalOpen(false);
    if (target === 'developer') {
      setDevPanelOpen(true);
    } else {
      setAdminOpen(true);
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
    () => calculateOrderPricing(dishes, cart, wonPrizeId, shop, lang, spinRewards),
    [dishes, cart, wonPrizeId, shop, lang, spinRewards]
  );

  const wonSlice = useMemo(
    () => getSpinSliceById(wonPrizeId, spinRewards),
    [wonPrizeId, spinRewards]
  );
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

  // Automatically remove any dish from active cart if owner marks it Sold Out in real time
  useEffect(() => {
    const soldOutInCart = dishes.filter(
      (d) => d.inStock === false && (cart[d.id] ?? 0) > 0
    );
    if (soldOutInCart.length === 0) return;

    const soldOutIds = new Set(soldOutInCart.map((d) => d.id));
    setCart((prev) => {
      const next: Record<string, number> = {};
      for (const [dishId, qty] of Object.entries(prev)) {
        if (!soldOutIds.has(dishId) && qty > 0) {
          next[dishId] = qty;
        }
      }
      return next;
    });

    const names = soldOutInCart
      .map((d) => getDishCopy(d, lang).name)
      .join(', ');
    notify(
      lang === 'bn'
        ? `🚫 "${names}" আজকের মতো শেষ হয়ে যাওয়ায় কার্ট থেকে সরানো হয়েছে।`
        : `🚫 Removed "${names}" from cart because it just sold out.`
    );
  }, [cart, dishes, lang, notify]);

  const handleUpdateQty = useCallback(
    (dishId: string, delta: number) => {
      if (delta > 0) {
        const targetDish = dishes.find((d) => d.id === dishId);
        if (targetDish && targetDish.inStock === false) {
          notify(
            lang === 'bn'
              ? `🚫 দুঃখিত! "${targetDish.name}" আজকের মতো শেষ হয়ে গেছে।`
              : `🚫 Sorry! "${getDishCopy(targetDish, 'en').name}" is sold out for today.`
          );
          return;
        }
      }

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
    },
    [dishes, lang, notify]
  );

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
      const slice = getSpinSliceById(prizeId, spinRewards);
      if (slice) {
        const copy = getSpinSliceCopy(slice, lang);
        notify(
          lang === 'bn'
            ? `অভিনন্দন! আপনি জিতলেন: ${copy.shortTitle}`
            : `Congrats! You won: ${copy.shortTitle}`
        );
      }
    },
    [lang, notify, spinRewards]
  );

  const handleCustomerChange = useCallback(
    (field: 'name' | 'phone' | 'address', value: string) => {
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

  const handleLocationChange = useCallback(
    (location: CustomerLocation | null) => {
      setCustomer((prev) => ({ ...prev, location }));
    },
    []
  );

  const reportCloudResult = useCallback(
    (result: CloudWriteResult) => {
      if (result.synced) {
        notify('✅ ক্লাউডে সেভ হয়েছে — সব ফোনে আপডেট হয়েছে!');
      } else if (result.reason === 'not_configured') {
        notify('স্থানীয়ভাবে সেভ হয়েছে (Firebase কনফিগার করা নেই)');
      } else {
        const detail = result.errorMessage || result.reason || 'Unknown error';
        notify(`⚠️ ক্লাউড সেভ ব্যর্থ: ${detail}`);
      }
    },
    [notify]
  );

  const handleSaveShop = useCallback(
    async (nextShop: ShopConfig): Promise<CloudWriteResult> => {
      setShop(nextShop);
      try {
        localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(nextShop));
      } catch {
        notify('ছবির সাইজ বড় হওয়ায় সেভ করতে সমস্যা হয়েছে — ছোট ছবি চেষ্টা করুন');
      }
      const res = await syncShopTenantToCloud(
        { shopConfig: nextShop },
        {
          shopConfig: nextShop,
          menuItems: dishes,
          spinRewards,
          developerControl,
        }
      );
      reportCloudResult(res);
      return res;
    },
    [developerControl, dishes, notify, reportCloudResult, spinRewards]
  );

  const handleSaveDishes = useCallback(
    async (nextDishes: Dish[]): Promise<CloudWriteResult> => {
      setDishes(nextDishes);
      try {
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(nextDishes));
      } catch {
        notify('স্টোরেজ পূর্ণ! অনুগ্রহ করে ছবির সাইজ ছোট করুন বা URL ব্যবহার করুন');
      }
      const res = await syncShopTenantToCloud(
        { menuItems: nextDishes },
        {
          shopConfig: shop,
          menuItems: nextDishes,
          spinRewards,
          developerControl,
        }
      );
      reportCloudResult(res);
      return res;
    },
    [developerControl, notify, reportCloudResult, shop, spinRewards]
  );

  const handleSaveSpinRewards = useCallback(
    async (nextRewards: SpinSlice[]): Promise<CloudWriteResult> => {
      setSpinRewards(nextRewards);
      try {
        localStorage.setItem(
          STORAGE_KEYS.SPIN_REWARDS,
          JSON.stringify(nextRewards)
        );
      } catch {
        // Ignore storage errors
      }
      const res = await syncShopTenantToCloud(
        { spinRewards: nextRewards },
        {
          shopConfig: shop,
          menuItems: dishes,
          spinRewards: nextRewards,
          developerControl,
        }
      );
      reportCloudResult(res);
      return res;
    },
    [developerControl, dishes, reportCloudResult, shop]
  );

  const handleSaveDeveloperControl = useCallback(
    async (nextControl: DeveloperControlConfig): Promise<CloudWriteResult> => {
      setDeveloperControl(nextControl);
      try {
        localStorage.setItem(
          STORAGE_KEYS.DEVELOPER_CONTROL,
          JSON.stringify(nextControl)
        );
      } catch {
        // Ignore storage errors
      }
      const res = await syncShopTenantToCloud(
        { developerControl: nextControl },
        {
          shopConfig: shop,
          menuItems: dishes,
          spinRewards,
          developerControl: nextControl,
        }
      );
      reportCloudResult(res);
      return res;
    },
    [dishes, reportCloudResult, shop, spinRewards]
  );

  const handlePushAllToCloud = useCallback(async (): Promise<CloudWriteResult> => {
    const res = await syncShopTenantToCloud(
      {
        shopConfig: shop,
        menuItems: dishes,
        spinRewards,
        developerControl,
      },
      {
        shopConfig: shop,
        menuItems: dishes,
        spinRewards,
        developerControl,
      }
    );
    reportCloudResult(res);
    return res;
  }, [developerControl, dishes, reportCloudResult, shop, spinRewards]);

  const handleSignInGoogle = useCallback(async () => {
    try {
      const user = await signInWithGoogleForAdmin();
      if (user) {
        notify(`✅ Google লগইন সফল (${user.email})`);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      notify(
        `Google লগইন ব্লক/ব্যর্থ (${detail}) — তবে মেনু ও দোকানের সেভ ক্লাউডে কাজ করবে`
      );
    }
  }, [notify]);

  const handleSignOutGoogle = useCallback(async () => {
    try {
      await signOutAdmin();
      notify('Google অ্যাকাউন্ট থেকে সাইন আউট হয়েছে');
    } catch {
      notify('সাইন আউট করতে সমস্যা হয়েছে');
    }
  }, [notify]);

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

  const recordPermanentCloudOrder = useCallback(
    async (
      orderedCart: Record<string, number>,
      orderPricing: OrderPricing,
      normalizedCustomer: CustomerDetails
    ): Promise<string> => {
      const docId = generateOrderDocId();
      const orderId = generateOrderCode();
      const items: CloudOrderItem[] = dishes
        .filter((d) => (orderedCart[d.id] ?? 0) > 0)
        .map((d) => {
          const qty = orderedCart[d.id] ?? 0;
          return {
            dishId: d.id,
            name: d.name,
            nameEn: getDishCopy(d, 'en').name,
            qty,
            unitPrice: d.price,
            lineTotal: d.price * qty,
          };
        });

      const loc = normalizedCustomer.location ?? null;
      const googleMapsUrl = loc ? buildGoogleMapsLink(loc.lat, loc.lng) : '';

      const orderRecord: CloudOrder = {
        docId,
        orderId,
        shopId: SHOP_ID,
        timestampMs: Date.now(),
        customerName: normalizedCustomer.name,
        customerPhone: normalizedCustomer.phone,
        address: normalizedCustomer.address,
        distanceKm: loc ? loc.distanceKm : null,
        googleMapsUrl,
        items,
        finalTotal: orderPricing.finalTotal,
        spinReward: orderPricing.spinRewardActive
          ? orderPricing.spinRewardSummary
          : '',
        status: 'Pending',
        source: 'local',
      };

      // Immediately persist local fallback backup
      setLocalCloudOrders((prev) => {
        const next = [orderRecord, ...prev].slice(0, 100);
        try {
          localStorage.setItem(
            STORAGE_KEYS.CLOUD_ORDERS_CACHE,
            JSON.stringify(next)
          );
        } catch {
          // Ignore storage quota issues
        }
        return next;
      });

      // Save permanently to Firestore `shops/{SHOP_ID}/orders` BEFORE launching WhatsApp
      const result = await saveCloudOrderToFirestore(orderRecord);
      if (result.savedToCloud) {
        setLocalCloudOrders((prev) => {
          const next = prev.map((o) =>
            o.docId === docId ? { ...o, source: 'cloud' as const } : o
          );
          try {
            localStorage.setItem(
              STORAGE_KEYS.CLOUD_ORDERS_CACHE,
              JSON.stringify(next)
            );
          } catch {
            // Ignore storage errors
          }
          return next;
        });
      }

      return orderId;
    },
    [dishes]
  );

  const handleUpdateOrderStatus = useCallback(
    async (order: CloudOrder, nextStatus: OrderStatus) => {
      // Optimistically update local cache
      setLocalCloudOrders((prev) => {
        const exists = prev.some((o) => o.docId === order.docId);
        const next = exists
          ? prev.map((o) =>
              o.docId === order.docId ? { ...o, status: nextStatus } : o
            )
          : prev;
        try {
          localStorage.setItem(
            STORAGE_KEYS.CLOUD_ORDERS_CACHE,
            JSON.stringify(next)
          );
        } catch {
          // Ignore storage errors
        }
        return next;
      });

      if (order.source === 'cloud' && adminUser) {
        const res = await updateCloudOrderStatus(order.docId, nextStatus);
        if (res.updated) {
          notify(`✅ অর্ডার ${order.orderId} স্ট্যাটাস আপডেট হয়েছে: ${nextStatus}`);
        } else {
          notify(`⚠️ স্ট্যাটাস ক্লাউডে আপডেট হয়নি — Google লগইন যাচাই করুন`);
        }
      } else {
        notify(`✅ অর্ডার ${order.orderId} স্ট্যাটাস আপডেট হয়েছে: ${nextStatus}`);
      }
    },
    [adminUser, notify]
  );

  const handlePlaceOrder = useCallback(async () => {
    const soldOutInCart = dishes.filter(
      (d) => (cart[d.id] ?? 0) > 0 && d.inStock === false
    );
    if (soldOutInCart.length > 0) {
      const names = soldOutInCart.map((d) => getDishCopy(d, lang).name).join(', ');
      notify(
        isBn
          ? `🚫 "${names}" আজকের মতো শেষ হয়ে গেছে — অনুগ্রহ করে অন্য খাবার বেছে নিন।`
          : `🚫 "${names}" is currently Sold Out — please choose available dishes.`
      );
      return;
    }

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

    const refreshedLocation: CustomerLocation | null = customer.location
      ? {
          lat: customer.location.lat,
          lng: customer.location.lng,
          distanceKm: calculateRoadDistanceKm(
            shop.shopLat,
            shop.shopLng,
            customer.location.lat,
            customer.location.lng
          ),
        }
      : null;

    const normalizedCustomer: CustomerDetails = {
      name: customer.name.trim(),
      phone: phoneDigits,
      address: customer.address.trim(),
      location: refreshedLocation,
    };

    // 1. Permanently log order to Firestore (`shops/{SHOP_ID}/orders`) BEFORE opening WhatsApp
    const orderId = await recordPermanentCloudOrder(
      cart,
      pricing,
      normalizedCustomer
    );

    // 2. Build WhatsApp receipt including the unique Order ID
    const orderPayload = buildWhatsAppOrder(
      shop,
      dishes,
      cart,
      normalizedCustomer,
      wonPrizeId,
      pricing,
      lang,
      spinRewards,
      orderId
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
    recordPermanentCloudOrder,
    shop,
    spinRewards,
    wonPrizeId,
  ]);

  const buildCartFromSavedOrder = useCallback(
    (
      order: SavedOrder
    ): { nextCart: Record<string, number>; soldOutNames: string[] } => {
      const dishMap = new Map(dishes.map((d) => [d.id, d]));
      const nextCart: Record<string, number> = {};
      const soldOutNames: string[] = [];

      for (const item of order.items) {
        if (item.qty <= 0) continue;
        const liveDish = dishMap.get(item.dishId);
        if (!liveDish) continue;
        if (liveDish.inStock === false) {
          soldOutNames.push(getDishCopy(liveDish, lang).name);
          continue;
        }
        nextCart[item.dishId] = item.qty;
      }
      return { nextCart, soldOutNames };
    },
    [dishes, lang]
  );

  const handleLoadOrderToCart = useCallback(
    (order: SavedOrder) => {
      const { nextCart, soldOutNames } = buildCartFromSavedOrder(order);
      if (Object.keys(nextCart).length === 0) {
        notify(
          soldOutNames.length > 0
            ? isBn
              ? `🚫 আগের অর্ডারের খাবার (${soldOutNames.join(', ')}) আজকের মতো শেষ হয়ে গেছে!`
              : `🚫 Items from that order (${soldOutNames.join(', ')}) are currently Sold Out!`
            : isBn
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
        location: prev.location ?? order.customer.location ?? null,
      }));
      setFormErrors({});

      notify(
        soldOutNames.length > 0
          ? isBn
            ? `কার্টে উপলব্ধ খাবার যোগ হয়েছে ("${soldOutNames.join(', ')}" আজ শেষ হওয়ায় বাদ দেওয়া হয়েছে)`
            : `Available items loaded to cart (skipped Sold Out: "${soldOutNames.join(', ')}")`
          : isBn
          ? 'আগের অর্ডারের খাবারগুলো কার্টে যোগ হয়েছে — চাইলে পরিবর্তন করুন!'
          : 'Previous order items loaded to cart — adjust anytime!'
      );
    },
    [buildCartFromSavedOrder, isBn, notify]
  );

  const handleQuickReorder = useCallback(
    async (order: SavedOrder) => {
      const { nextCart, soldOutNames } = buildCartFromSavedOrder(order);
      if (soldOutNames.length > 0) {
        notify(
          isBn
            ? `🚫 দুঃখিত! আগের অর্ডারের "${soldOutNames.join(', ')}" আজকের মতো শেষ (Sold Out)।`
            : `🚫 Sorry! "${soldOutNames.join(', ')}" from your previous order is currently Sold Out.`
        );
        return;
      }

      if (Object.keys(nextCart).length === 0) {
        notify(
          isBn
            ? 'আগের অর্ডারের খাবারগুলো বর্তমানে মেনুতে পাওয়া যায়নি।'
            : 'Items from that previous order are no longer on the menu.'
        );
        return;
      }

      const rawLocation = customer.location ?? order.customer.location ?? null;
      const refreshedLocation: CustomerLocation | null = rawLocation
        ? {
            lat: rawLocation.lat,
            lng: rawLocation.lng,
            distanceKm: calculateRoadDistanceKm(
              shop.shopLat,
              shop.shopLng,
              rawLocation.lat,
              rawLocation.lng
            ),
          }
        : null;

      const resolvedCustomer: CustomerDetails = {
        name: customer.name.trim() || order.customer.name || '',
        phone: normalizePhoneDigits(
          customer.phone.trim() || order.customer.phone || ''
        ),
        address: customer.address.trim() || order.customer.address || '',
        location: refreshedLocation,
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
        lang,
        spinRewards
      );

      // Save permanently to Firestore (`shops/{SHOP_ID}/orders`) BEFORE opening WhatsApp
      const orderId = await recordPermanentCloudOrder(
        nextCart,
        freshPricing,
        resolvedCustomer
      );

      const orderPayload = buildWhatsAppOrder(
        shop,
        dishes,
        nextCart,
        resolvedCustomer,
        wonPrizeId,
        freshPricing,
        lang,
        spinRewards,
        orderId
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
      recordPermanentCloudOrder,
      shop,
      spinRewards,
      wonPrizeId,
    ]
  );

  const developerInquiryUrl = useMemo(() => {
    const devPhone =
      developerControl.developerWhatsapp.replace(/\D/g, '') || '918649853354';
    const devName =
      developerControl.developerBrandName.trim() || 'Soumdip Digital';
    const text = isBn
      ? `নমস্কার ${devName}! আমি "${shop.name}"-এর অনলাইন ফুড অর্ডার ও স্পিন হুইল অ্যাপটি দেখলাম। আমার দোকানের জন্য এমন একটি অ্যাপ বানাতে চাই। বিস্তারিত জানাবেন।`
      : `Hello ${devName}! I saw the digital menu & WhatsApp ordering app for "${shopCopy.name}". I want to build a similar app for my shop. Please share details.`;
    return `https://wa.me/${devPhone}?text=${encodeURIComponent(text)}`;
  }, [developerControl, isBn, shop.name, shopCopy.name]);

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
          onLocationChange={handleLocationChange}
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

      {/* Clean Footer with Hidden 5-Tap Secret Trigger & Clickable Developer Credit Badge */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-slate-200/90 dark:border-white/10 text-center space-y-4">
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

        {/* Sleek Developer Credit Footer Badge */}
        <div className="pt-1 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-4 py-2 rounded-2xl bg-white dark:bg-[#1a1b26] border border-slate-200/90 dark:border-white/10 shadow-xs text-[11px] sm:text-xs">
            <span
              onClick={handleSecretFooterTap}
              className="font-bold text-[#1d1e2c] dark:text-slate-100 select-none cursor-default"
            >
              ⚡ Powered by{' '}
              <span className="text-[#d90429] dark:text-[#ff9f1c]">
                {developerControl.developerBrandName}
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-600 select-none">
              •
            </span>
            <a
              href={developerInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline transition-colors"
            >
              {isBn
                ? 'আপনার দোকানের জন্য এমন অ্যাপ বানাতে ক্লিক করুন'
                : 'Want an app like this for your shop? Click here'}
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Spin & Win Reopen Trigger Button (when modal is closed & service active) */}
      {!spinModalOpen && !subscriptionState.blocked && (
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
      {!subscriptionState.blocked && (
        <BottomCheckoutBar
          shop={shop}
          lang={lang}
          pricing={pricing}
          onCheckoutClick={handlePlaceOrder}
        />
      )}

      {/* Spin & Win Modal */}
      <SpinWheelModal
        isOpen={spinModalOpen && !subscriptionState.blocked}
        lang={lang}
        spinRewards={spinRewards}
        onClose={() => setSpinModalOpen(false)}
        wonPrizeId={wonPrizeId}
        onWin={handleSpinWin}
      />

      {/* WhatsApp Receipt Confirmation Modal */}
      <WhatsAppOrderModal
        isOpen={Boolean(whatsappOrder) && !subscriptionState.blocked}
        lang={lang}
        receiptText={whatsappOrder?.receiptText ?? ''}
        whatsappUrl={whatsappOrder?.whatsappUrl ?? ''}
        onClose={() => setWhatsappOrder(null)}
      />

      {/* Full-Screen Service Paused / Subscription Expired Overlay */}
      {subscriptionState.blocked && subscriptionState.reason && (
        <ServicePausedOverlay
          shopName={shopCopy.name}
          developerControl={developerControl}
          reason={subscriptionState.reason}
          lang={lang}
          onSecretCreditTap={handleSecretFooterTap}
        />
      )}

      {/* Unified Hidden PIN Gate Modal (2026 -> Shop Owner Admin | 9999 -> Developer Control) */}
      <SecretPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onUnlock={handlePinUnlock}
      />

      {/* Shop Owner Admin Panel Modal (PIN: 2026) */}
      <AdminPanelModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        shop={shop}
        dishes={dishes}
        spinRewards={spinRewards}
        orders={allAdminOrders}
        ordersError={ordersError}
        onSaveShop={handleSaveShop}
        onSaveDishes={handleSaveDishes}
        onSaveSpinRewards={handleSaveSpinRewards}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        adminUser={adminUser}
        cloudStatus={cloudStatus}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
        onNotify={notify}
      />

      {/* Dedicated Developer Control Panel Modal (PIN: 9999) */}
      <DeveloperControlModal
        isOpen={devPanelOpen}
        onClose={() => setDevPanelOpen(false)}
        developerControl={developerControl}
        onSaveDeveloperControl={handleSaveDeveloperControl}
        onPushAllToCloud={handlePushAllToCloud}
        adminUser={adminUser}
        cloudStatus={cloudStatus}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
        onNotify={notify}
      />
    </div>
  );
}
