import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  ClipboardList,
  Cloud,
  CloudOff,
  Crosshair,
  ExternalLink,
  Gift,
  ImagePlus,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  DEFAULT_MENU,
  DEFAULT_SHOP_CONFIG,
  SPIN_SLICES,
} from '../data/defaults';
import { SHOP_ID, isFirebaseConfigured } from '../firebase';
import type {
  CloudOrder,
  CloudSyncStatus,
  Dish,
  DishBadge,
  DishCategory,
  ExtraChargeType,
  OrderStatus,
  ShopConfig,
  SpinSlice,
} from '../types';
import {
  compressImageFile,
  formatRupees,
  toBengaliDigits,
} from '../utils/bengali';
import { buildGoogleMapsLink, requestCurrentPosition } from '../utils/geo';
import { formatServiceChargeLabel } from '../utils/pricing';
import { FoodImage } from './FoodImage';
import { LiveOrdersTab } from './LiveOrdersTab';
import { TableQrCard } from './TableQrCard';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: ShopConfig;
  dishes: Dish[];
  spinRewards: SpinSlice[];
  orders: CloudOrder[];
  ordersError: string | null;
  onSaveShop: (nextShop: ShopConfig) => Promise<void> | void;
  onSaveDishes: (nextDishes: Dish[]) => Promise<void> | void;
  onSaveSpinRewards: (nextRewards: SpinSlice[]) => Promise<void> | void;
  onUpdateOrderStatus: (
    order: CloudOrder,
    nextStatus: OrderStatus
  ) => Promise<void>;
  adminUser: User | null;
  cloudStatus: CloudSyncStatus;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onNotify: (message: string) => void;
}

type AdminTab = 'orders' | 'shop' | 'menu' | 'spin' | 'qr';

interface DishFormState {
  id: string | null;
  name: string;
  category: DishCategory;
  price: string;
  oldPrice: string;
  description: string;
  image: string;
  badge: DishBadge;
  inStock: boolean;
}

const EMPTY_DISH_FORM: DishFormState = {
  id: null,
  name: '',
  category: 'biryani',
  price: '',
  oldPrice: '',
  description: '',
  image: '',
  badge: '',
  inStock: true,
};

export function AdminPanelModal({
  isOpen,
  onClose,
  shop,
  dishes,
  spinRewards,
  orders,
  ordersError,
  onSaveShop,
  onSaveDishes,
  onSaveSpinRewards,
  onUpdateOrderStatus,
  adminUser,
  cloudStatus,
  onSignInGoogle,
  onSignOutGoogle,
  onNotify,
}: AdminPanelModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [authBusy, setAuthBusy] = useState(false);

  // Section A: Shop Branding & GPS Form
  const [shopDraft, setShopDraft] = useState<ShopConfig>(shop);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Section B: Menu Management Form
  const [dishForm, setDishForm] = useState<DishFormState>(EMPTY_DISH_FORM);
  const [uploadingDishImg, setUploadingDishImg] = useState(false);
  const [dishFormError, setDishFormError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Section C: Spin Rewards Draft
  const [rewardsDraft, setRewardsDraft] = useState<SpinSlice[]>(spinRewards);

  useEffect(() => {
    if (isOpen) {
      setShopDraft(shop);
      setRewardsDraft(spinRewards);
    }
  }, [isOpen, shop, spinRewards]);

  if (!isOpen) return null;

  const handleClose = () => {
    setConfirmReset(false);
    setPendingDeleteId(null);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    try {
      await onSignInGoogle();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setAuthBusy(true);
    try {
      await onSignOutGoogle();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const dataUrl = await compressImageFile(file, 720, 0.7);
      setShopDraft((prev) => ({ ...prev, heroImage: dataUrl }));
      onNotify('দোকানের নতুন ছবি আপলোড হয়েছে — সেভ করুন');
    } catch {
      onNotify('ছবি আপলোড করতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  const buildCleanedShop = (draft: ShopConfig): ShopConfig => {
    const numericCharge = Number(draft.serviceChargeValue);
    const rawLat = Number(draft.shopLat);
    const rawLng = Number(draft.shopLng);
    const rawMaxKm = Number(draft.maxDeliveryKm);

    const shopLat =
      Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90
        ? Number(rawLat.toFixed(6))
        : DEFAULT_SHOP_CONFIG.shopLat;
    const shopLng =
      Number.isFinite(rawLng) && rawLng >= -180 && rawLng <= 180
        ? Number(rawLng.toFixed(6))
        : DEFAULT_SHOP_CONFIG.shopLng;
    const maxDeliveryKm =
      Number.isFinite(rawMaxKm) && rawMaxKm > 0 && rawMaxKm <= 100
        ? Number(rawMaxKm.toFixed(1))
        : DEFAULT_SHOP_CONFIG.maxDeliveryKm;

    return {
      name: draft.name.trim() || DEFAULT_SHOP_CONFIG.name,
      address: draft.address.trim() || DEFAULT_SHOP_CONFIG.address,
      rating: draft.rating.trim() || DEFAULT_SHOP_CONFIG.rating,
      statusText: draft.statusText.trim() || DEFAULT_SHOP_CONFIG.statusText,
      whatsappNumber:
        draft.whatsappNumber.replace(/\D/g, '') ||
        DEFAULT_SHOP_CONFIG.whatsappNumber,
      heroImage: draft.heroImage.trim() || DEFAULT_SHOP_CONFIG.heroImage,
      serviceChargeEnabled: Boolean(draft.serviceChargeEnabled),
      serviceChargeType: draft.serviceChargeType,
      serviceChargeValue:
        Number.isFinite(numericCharge) && numericCharge >= 0
          ? numericCharge
          : DEFAULT_SHOP_CONFIG.serviceChargeValue,
      serviceChargeLabel:
        draft.serviceChargeLabel.trim() ||
        DEFAULT_SHOP_CONFIG.serviceChargeLabel,
      deliveryRadiusText:
        draft.deliveryRadiusText.trim() ||
        `${toBengaliDigits(maxDeliveryKm)} কিমি`,
      shopLat,
      shopLng,
      maxDeliveryKm,
    };
  };

  const handleCaptureShopGps = async () => {
    setCapturingGps(true);
    try {
      const fix = await requestCurrentPosition('bn');
      const updatedDraft: ShopConfig = {
        ...shopDraft,
        shopLat: fix.lat,
        shopLng: fix.lng,
      };
      setShopDraft(updatedDraft);
      const cleaned = buildCleanedShop(updatedDraft);
      await onSaveShop(cleaned);
      onNotify(
        `📍 দোকানের GPS লোকেশন সেভ হয়েছে (${fix.lat.toFixed(4)}, ${fix.lng.toFixed(4)})`
      );
    } catch (err) {
      onNotify(
        err instanceof Error
          ? err.message
          : 'GPS লোকেশন নেওয়া যায়নি — ম্যানুয়ালি Latitude/Longitude লিখুন'
      );
    } finally {
      setCapturingGps(false);
    }
  };

  const handleSaveShopClick = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedShop = buildCleanedShop(shopDraft);
    void onSaveShop(cleanedShop);
  };

  const handleResetDefaults = () => {
    void onSaveShop(DEFAULT_SHOP_CONFIG);
    void onSaveDishes(DEFAULT_MENU);
    void onSaveSpinRewards(SPIN_SLICES);
    setShopDraft(DEFAULT_SHOP_CONFIG);
    setRewardsDraft(SPIN_SLICES);
    setDishForm(EMPTY_DISH_FORM);
    setConfirmReset(false);
    onNotify('সব তথ্য ও মেনু ডিফল্ট অবস্থায় ফিরিয়ে আনা হয়েছে');
  };

  const handleSaveSpinRewardsClick = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = rewardsDraft.map((s) => ({
      ...s,
      shortTitle: s.shortTitle.trim() || s.wheelLabel.replace(/\n/g, ' '),
      fullLabel: s.shortTitle.trim() || s.fullLabel,
      conditionText: s.conditionText.trim(),
      weight: Math.max(0, Math.min(100, Math.round(Number(s.weight) || 0))),
    }));
    void onSaveSpinRewards(cleaned);
  };

  const handleDishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDishImg(true);
    try {
      const dataUrl = await compressImageFile(file, 640, 0.7);
      setDishForm((prev) => ({ ...prev, image: dataUrl }));
      onNotify('খাবারের ছবি যুক্ত হয়েছে');
    } catch {
      onNotify('ছবি প্রসেস করতে সমস্যা হয়েছে');
    } finally {
      setUploadingDishImg(false);
      e.target.value = '';
    }
  };

  const handleEditDish = (dish: Dish) => {
    setDishForm({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: String(dish.price),
      oldPrice: dish.oldPrice ? String(dish.oldPrice) : '',
      description: dish.description,
      image: dish.image,
      badge: dish.badge ?? '',
      inStock: dish.inStock !== false,
    });
    setDishFormError('');
  };

  const handleToggleDishStock = (dish: Dish) => {
    const currentlyInStock = dish.inStock !== false;
    const nextInStock = !currentlyInStock;
    const nextDishes = dishes.map((d) =>
      d.id === dish.id ? { ...d, inStock: nextInStock } : d
    );
    void onSaveDishes(nextDishes);
    if (dishForm.id === dish.id) {
      setDishForm((prev) => ({ ...prev, inStock: nextInStock }));
    }
    onNotify(
      nextInStock
        ? `✅ "${dish.name}" এখন উপলব্ধ (In Stock) করা হয়েছে`
        : `🚫 "${dish.name}" শেষ হয়ে গেছে (Sold Out) হিসেবে চিহ্নিত হয়েছে`
    );
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    const name = dishForm.name.trim();
    const price = Number(dishForm.price);
    const oldPrice = dishForm.oldPrice.trim() ? Number(dishForm.oldPrice) : undefined;

    if (!name) {
      setDishFormError('খাবারের নাম লিখুন।');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setDishFormError('সঠিক মূল্য (₹) লিখুন।');
      return;
    }

    const existingDish = dishForm.id
      ? dishes.find((d) => d.id === dishForm.id)
      : undefined;

    const nextDish: Dish = {
      id: dishForm.id || `dish-${Date.now()}`,
      name,
      ...(existingDish?.nameEn ? { nameEn: existingDish.nameEn } : {}),
      category: dishForm.category,
      price: Math.round(price),
      oldPrice:
        oldPrice && Number.isFinite(oldPrice) && oldPrice > price
          ? Math.round(oldPrice)
          : undefined,
      description:
        dishForm.description.trim() || 'আমাদের তাজা ও সুস্বাদু স্পেশাল পদ।',
      ...(existingDish?.descriptionEn
        ? { descriptionEn: existingDish.descriptionEn }
        : {}),
      image:
        dishForm.image.trim() ||
        'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
      badge: dishForm.badge,
      inStock: dishForm.inStock,
    };

    if (dishForm.id) {
      onSaveDishes(dishes.map((d) => (d.id === dishForm.id ? nextDish : d)));
      onNotify(`"${nextDish.name}" আপডেট করা হয়েছে!`);
    } else {
      onSaveDishes([nextDish, ...dishes]);
      onNotify(`নতুন পদ "${nextDish.name}" মেনুতে যোগ হয়েছে!`);
    }

    setDishForm(EMPTY_DISH_FORM);
    setDishFormError('');
  };

  const handleDeleteDish = (dishId: string) => {
    const target = dishes.find((d) => d.id === dishId);
    onSaveDishes(dishes.filter((d) => d.id !== dishId));
    setPendingDeleteId(null);
    if (dishForm.id === dishId) {
      setDishForm(EMPTY_DISH_FORM);
    }
    if (target) {
      onNotify(`"${target.name}" মেনু থেকে মুছে ফেলা হয়েছে`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1d1e2c]/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1b26] rounded-3xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 max-h-[92vh] flex flex-col text-[#1d1e2c] dark:text-slate-100">
        {/* Header */}
        <div className="bg-[#1d1e2c] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#ff9f1c] text-[#1d1e2c] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="admin-modal-title" className="text-lg font-bold leading-tight truncate">
                মালিক / অ্যাডমিন ড্যাশবোর্ড
              </h2>
              <p className="text-xs text-white/75 truncate">
                {isFirebaseConfigured && adminUser
                  ? `☁️ লাইভ ক্লাউড সিঙ্ক চালু (shops/${SHOP_ID})`
                  : 'স্থানীয় সেভ চালু • সব ফোনে লাইভ আপডেটের জন্য Google লগইন করুন'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Firebase Cloud Sync Strip */}
        <div className="bg-[#141520] text-white px-4 py-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isFirebaseConfigured && cloudStatus !== 'error' ? (
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="truncate text-white/90">
              {isFirebaseConfigured
                ? adminUser
                  ? `Firestore Sync: ${adminUser.email}`
                  : `Tenant: shops/${SHOP_ID} (ক্লাউড আপডেটের জন্য লগইন করুন)`
                : 'LocalStorage Fallback Mode'}
            </span>
          </div>
          {isFirebaseConfigured &&
            (adminUser ? (
              <button
                type="button"
                disabled={authBusy}
                onClick={handleGoogleSignOut}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={authBusy}
                onClick={handleGoogleSignIn}
                className="px-3 py-1 rounded-lg bg-[#ff9f1c] hover:bg-[#f2910d] text-[#1d1e2c] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{authBusy ? 'লগইন...' : 'Google লগইন (Cloud Sync)'}</span>
              </button>
            ))}
        </div>

        {/* Admin Section Tabs */}
        <div className="bg-[#f4f5f7] dark:bg-[#141520] px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {(() => {
            const pendingCount = orders.filter(
              (o) => o.status === 'Pending'
            ).length;
            return (
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#d90429] text-white shadow-sm'
                    : 'bg-white dark:bg-[#1a1b26] text-[#1d1e2c] dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#232436]'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>📋 অর্ডার লিস্ট</span>
                {pendingCount > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold tabular-nums ${
                      activeTab === 'orders'
                        ? 'bg-[#ffd166] text-[#1d1e2c]'
                        : 'bg-[#d90429] text-white'
                    }`}
                  >
                    {toBengaliDigits(pendingCount)}
                  </span>
                )}
              </button>
            );
          })()}

          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'shop'
                ? 'bg-[#1d1e2c] dark:bg-[#ff9f1c] text-white dark:text-[#1d1e2c] shadow-sm'
                : 'bg-white dark:bg-[#1a1b26] text-[#1d1e2c] dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#232436]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>🏪 দোকানের তথ্য</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#1d1e2c] dark:bg-[#ff9f1c] text-white dark:text-[#1d1e2c] shadow-sm'
                : 'bg-white dark:bg-[#1a1b26] text-[#1d1e2c] dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#232436]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>🍽️ মেনু ম্যানেজ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spin')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'spin'
                ? 'bg-[#1d1e2c] dark:bg-[#ff9f1c] text-white dark:text-[#1d1e2c] shadow-sm'
                : 'bg-white dark:bg-[#1a1b26] text-[#1d1e2c] dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#232436]'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>🎁 স্পিন অফার</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-[#1d1e2c] dark:bg-[#ff9f1c] text-white dark:text-[#1d1e2c] shadow-sm'
                : 'bg-white dark:bg-[#1a1b26] text-[#1d1e2c] dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#232436]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>📲 Table QR</span>
          </button>
        </div>

        {/* Scrollable Body — light-surface inner workspace ensures crisp print preview & form legibility */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white text-[#1d1e2c]">
          {activeTab === 'orders' ? (
            <LiveOrdersTab
              orders={orders}
              adminUser={adminUser}
              ordersError={ordersError}
              onUpdateStatus={onUpdateOrderStatus}
            />
          ) : activeTab === 'qr' ? (
            <TableQrCard shop={shop} onNotify={onNotify} />
          ) : activeTab === 'spin' ? (
            <form onSubmit={handleSaveSpinRewardsClick} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#1d1e2c]">
                  🎁 স্পিন অ্যান্ড উইন পুরস্কার ও ওয়েট (Probability)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  কোন পুরস্কার জেতার সম্ভাবনা কত শতাংশ হবে তা সেট করুন (০ দিলে শুধু ডিসপ্লে হবে, কাস্টমার জিতবে না)।
                </p>
              </div>

              <div className="space-y-3">
                {rewardsDraft.map((slice, idx) => (
                  <div
                    key={slice.id}
                    className="rounded-2xl bg-[#f4f5f7] border border-slate-200 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-[#1d1e2c]">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 inline-block"
                          style={{ backgroundColor: slice.color }}
                        />
                        স্লাইস #{idx + 1} ({slice.id})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-slate-600">
                          ওয়েট:
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={slice.weight}
                          onChange={(e) =>
                            setRewardsDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      weight:
                                        e.target.value === ''
                                          ? 0
                                          : Number(e.target.value),
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-16 min-h-[34px] px-2 rounded-lg border border-slate-300 bg-white text-center text-xs font-bold tabular-nums focus:border-[#d90429] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={slice.shortTitle}
                        onChange={(e) =>
                          setRewardsDraft((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    shortTitle: e.target.value,
                                    fullLabel: e.target.value,
                                  }
                                : item
                            )
                          )
                        }
                        placeholder="পুরস্কারের শিরোনাম"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:border-[#d90429] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={slice.conditionText}
                        onChange={(e) =>
                          setRewardsDraft((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, conditionText: e.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="শর্ত (যেমন: ন্যূনতম ₹১৯৯ অর্ডারে)"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:border-[#d90429] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-[#d90429] hover:bg-[#b30322] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>স্পিন পুরস্কার সেভ করুন</span>
              </button>
            </form>
          ) : activeTab === 'shop' ? (
            <form onSubmit={handleSaveShopClick} className="space-y-4">
                  {/* Hero Image Live Preview + Upload/URL */}
                  <div>
                    <label className="block text-sm font-bold text-[#1d1e2c] mb-2">
                      দোকানের হিরো ব্যানার / স্টোরফ্রন্ট ছবি
                    </label>
                    <div className="relative h-40 sm:h-48 w-full rounded-2xl overflow-hidden border border-slate-200 bg-[#1d1e2c]">
                      <FoodImage
                        src={shopDraft.heroImage}
                        alt="দোকানের ব্যানার প্রিভিউ"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="min-h-[44px] px-4 py-2 rounded-xl bg-[#fff3db] hover:bg-[#ffe8bd] border border-[#ff9f1c]/50 text-[#1d1e2c] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <ImagePlus className="w-4 h-4 text-[#d90429]" />
                        <span>
                          {uploadingHero
                            ? 'আপলোড হচ্ছে...'
                            : 'মোবাইল গ্যালারি / ক্যামেরা থেকে আপলোড'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroFileUpload}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="url"
                        value={
                          shopDraft.heroImage.startsWith('data:')
                            ? ''
                            : shopDraft.heroImage
                        }
                        onChange={(e) =>
                          setShopDraft((prev) => ({
                            ...prev,
                            heroImage: e.target.value,
                          }))
                        }
                        placeholder="অথবা ছবির URL পেস্ট করুন (https://...)"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-[#f9fafb] focus:bg-white focus:border-[#d90429] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Restaurant Name & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-sm font-semibold text-[#1d1e2c] mb-1">
                        দোকানের নাম
                      </label>
                      <input
                        type="text"
                        value={shopDraft.name}
                        onChange={(e) =>
                          setShopDraft((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-[#f9fafb] focus:bg-white focus:border-[#d90429] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1d1e2c] mb-1">
                        দোকানের ঠিকানা
                      </label>
                      <input
                        type="text"
                        value={shopDraft.address}
                        onChange={(e) =>
                          setShopDraft((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-[#f9fafb] focus:bg-white focus:border-[#d90429] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Number & Rating */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-sm font-semibold text-[#1d1e2c] mb-1">
                        WhatsApp অর্ডার নম্বর (কান্ট্রি কোড সহ)
                      </label>
                      <input
                        type="tel"
                        value={shopDraft.whatsappNumber}
                        onChange={(e) =>
                          setShopDraft((prev) => ({
                            ...prev,
                            whatsappNumber: e.target.value,
                          }))
                        }
                        placeholder="919876543210"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-[#f9fafb] focus:bg-white focus:border-[#d90429] focus:outline-none tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1d1e2c] mb-1">
                        রেটিং (যেমন: ৪.৯)
                      </label>
                      <input
                        type="text"
                        value={shopDraft.rating}
                        onChange={(e) =>
                          setShopDraft((prev) => ({
                            ...prev,
                            rating: e.target.value,
                          }))
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-[#f9fafb] focus:bg-white focus:border-[#d90429] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Packaging & GST / Service Charge & Delivery Radius Controls */}
                  <div className="rounded-2xl bg-[#f4f5f7] border border-slate-200 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#1d1e2c]">
                          📦 প্যাকেজিং ও GST / সার্ভিস চার্জ সেটিংস
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          হোম ডেলিভারি সবসময় ফ্রি থাকবে — এখান থেকে প্যাকিং/GST চার্জ কন্ট্রোল করুন
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={shopDraft.serviceChargeEnabled}
                        onClick={() =>
                          setShopDraft((prev) => ({
                            ...prev,
                            serviceChargeEnabled: !prev.serviceChargeEnabled,
                          }))
                        }
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          shopDraft.serviceChargeEnabled
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                            shopDraft.serviceChargeEnabled
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {shopDraft.serviceChargeEnabled && (
                      <div className="space-y-3.5 pt-2 border-t border-slate-200/80">
                        {/* Percentage vs Flat Amount selector */}
                        <div>
                          <label className="block text-xs font-semibold text-[#1d1e2c] mb-1.5">
                            চার্জের ধরন বেছে নিন
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                { id: 'percentage', label: 'শতাংশ (% GST)' },
                                { id: 'flat', label: 'নির্দিষ্ট টাকা (₹ ফ্ল্যাট)' },
                              ] as { id: ExtraChargeType; label: string }[]
                            ).map((option) => {
                              const active =
                                shopDraft.serviceChargeType === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() =>
                                    setShopDraft((prev) => ({
                                      ...prev,
                                      serviceChargeType: option.id,
                                      serviceChargeValue:
                                        option.id === 'percentage'
                                          ? prev.serviceChargeType === 'flat' &&
                                            prev.serviceChargeValue > 15
                                            ? 5
                                            : prev.serviceChargeValue
                                          : prev.serviceChargeType ===
                                              'percentage' &&
                                            prev.serviceChargeValue <= 10
                                          ? 20
                                          : prev.serviceChargeValue,
                                    }))
                                  }
                                  className={`min-h-[40px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    active
                                      ? 'bg-[#1d1e2c] text-white shadow-xs'
                                      : 'bg-white text-[#1d1e2c] border border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Charge Value & Custom Label */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                              {shopDraft.serviceChargeType === 'percentage'
                                ? 'শতাংশের হার (%)'
                                : 'নির্দিষ্ট চার্জ (₹ টাকা)'}
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={
                                shopDraft.serviceChargeType === 'percentage'
                                  ? 50
                                  : 500
                              }
                              step="1"
                              value={shopDraft.serviceChargeValue}
                              onChange={(e) =>
                                setShopDraft((prev) => ({
                                  ...prev,
                                  serviceChargeValue:
                                    e.target.value === ''
                                      ? 0
                                      : Number(e.target.value),
                                }))
                              }
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold tabular-nums focus:border-[#d90429] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                              বিলে প্রদর্শিত নাম (Label)
                            </label>
                            <input
                              type="text"
                              value={shopDraft.serviceChargeLabel}
                              onChange={(e) =>
                                setShopDraft((prev) => ({
                                  ...prev,
                                  serviceChargeLabel: e.target.value,
                                }))
                              }
                              placeholder="যেমন: প্যাকেজিং ও GST চার্জ"
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600 flex items-center justify-between gap-2">
                          <span>বিল প্রিভিউ:</span>
                          <strong className="text-[#1d1e2c]">
                            {formatServiceChargeLabel(shopDraft)}
                            {shopDraft.serviceChargeType === 'flat'
                              ? ` (${formatRupees(shopDraft.serviceChargeValue)})`
                              : ''}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Serviceable Delivery Radius */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                        ফ্রি হোম ডেলিভারি দূরত্ব (Serviceable Radius)
                      </label>
                      <input
                        type="text"
                        value={shopDraft.deliveryRadiusText}
                        onChange={(e) =>
                          setShopDraft((prev) => ({
                            ...prev,
                            deliveryRadiusText: e.target.value,
                          }))
                        }
                        placeholder="যেমন: ৫ কিমি"
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                        প্রিভিউ: 📍 শুধুমাত্র{' '}
                        {shopDraft.deliveryRadiusText.trim() || '৫ কিমি'}-এর
                        মধ্যে হোম ডেলিভারি উপলব্ধ
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Shop GPS Location Setup */}
                  <div className="rounded-2xl bg-[#f4f5f7] border border-slate-200 p-4 space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#1d1e2c] flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#d90429]" />
                          <span>📍 দোকানের লোকেশন সেট করুন (Set Shop GPS)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          দোকানের সঠিক GPS সেট থাকলে গ্রাহকের দূরত্ব ও ফ্রি ডেলিভারি সীমা স্বয়ংক্রিয়ভাবে হিসাব হবে।
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={capturingGps}
                      onClick={handleCaptureShopGps}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1d1e2c] hover:bg-[#2a2c40] disabled:opacity-65 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {capturingGps ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#ff9f1c]" />
                      ) : (
                        <Crosshair className="w-4 h-4 text-[#ff9f1c]" />
                      )}
                      <span>
                        {capturingGps
                          ? 'GPS লোকেশন ক্যাপচার হচ্ছে...'
                          : '🎯 দোকানে বসে বর্তমান লোকেশন সেভ করুন'}
                      </span>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          Shop Latitude (`shopLat`)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={shopDraft.shopLat}
                          onChange={(e) =>
                            setShopDraft((prev) => ({
                              ...prev,
                              shopLat:
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value),
                            }))
                          }
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono tabular-nums focus:border-[#d90429] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          Shop Longitude (`shopLng`)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={shopDraft.shopLng}
                          onChange={(e) =>
                            setShopDraft((prev) => ({
                              ...prev,
                              shopLng:
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value),
                            }))
                          }
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono tabular-nums focus:border-[#d90429] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          সর্বোচ্চ ডেলিভারি সীমা (km)
                        </label>
                        <input
                          type="number"
                          min={0.5}
                          max={100}
                          step="0.5"
                          value={shopDraft.maxDeliveryKm}
                          onChange={(e) => {
                            const nextKm =
                              e.target.value === ''
                                ? 5
                                : Number(e.target.value);
                            setShopDraft((prev) => ({
                              ...prev,
                              maxDeliveryKm: nextKm,
                              deliveryRadiusText:
                                Number.isFinite(nextKm) && nextKm > 0
                                  ? `${toBengaliDigits(nextKm)} কিমি`
                                  : prev.deliveryRadiusText,
                            }));
                          }}
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold tabular-nums focus:border-[#d90429] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">
                        বর্তমান পিন:{' '}
                        <strong className="font-mono text-[#1d1e2c]">
                          {Number(shopDraft.shopLat || 0).toFixed(4)},{' '}
                          {Number(shopDraft.shopLng || 0).toFixed(4)}
                        </strong>
                      </span>
                      <a
                        href={buildGoogleMapsLink(
                          Number(shopDraft.shopLat) || DEFAULT_SHOP_CONFIG.shopLat,
                          Number(shopDraft.shopLng) || DEFAULT_SHOP_CONFIG.shopLng
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>ম্যাপে দেখুন</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#d90429] hover:bg-[#b30322] text-white font-bold text-sm flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>দোকানের তথ্য সেভ করুন</span>
                    </button>

                    {!confirmReset ? (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#d90429] hover:bg-red-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ডিফল্ট রিসেট করুন</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                        <span className="text-xs font-semibold text-red-700">
                          নিশ্চিত রিসেট করবেন?
                        </span>
                        <button
                          type="button"
                          onClick={handleResetDefaults}
                          className="px-2.5 py-1 rounded-lg bg-[#d90429] text-white text-xs font-bold cursor-pointer"
                        >
                          হ্যাঁ
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-2.5 py-1 rounded-lg bg-white text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
                        >
                          না
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Add / Edit Dish Form */}
                  <form
                    onSubmit={handleSaveDish}
                    className="rounded-2xl bg-[#f4f5f7] border border-slate-200 p-4 space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#1d1e2c]">
                        {dishForm.id
                          ? '✏️ খাবারের তথ্য এডিট করুন'
                          : '➕ নতুন খাবার যোগ করুন'}
                      </h3>
                      {dishForm.id && (
                        <button
                          type="button"
                          onClick={() => setDishForm(EMPTY_DISH_FORM)}
                          className="text-xs font-semibold text-[#d90429] hover:underline cursor-pointer"
                        >
                          বাতিল করুন
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          খাবারের নাম *
                        </label>
                        <input
                          type="text"
                          value={dishForm.name}
                          onChange={(e) =>
                            setDishForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="যেমন: চিকেন চাপ বিরিয়ানি"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          ক্যাটাগরি
                        </label>
                        <select
                          value={dishForm.category}
                          onChange={(e) =>
                            setDishForm((prev) => ({
                              ...prev,
                              category: e.target.value as DishCategory,
                            }))
                          }
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none"
                        >
                          <option value="biryani">🍛 বিরিয়ানি</option>
                          <option value="fastfood">🍜 চাউমিন ও রোল</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          বর্তমান দাম (₹) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={dishForm.price}
                          onChange={(e) =>
                            setDishForm((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          placeholder="140"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          আগের দাম (₹)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={dishForm.oldPrice}
                          onChange={(e) =>
                            setDishForm((prev) => ({
                              ...prev,
                              oldPrice: e.target.value,
                            }))
                          }
                          placeholder="170"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                          ব্যাজ
                        </label>
                        <select
                          value={dishForm.badge}
                          onChange={(e) =>
                            setDishForm((prev) => ({
                              ...prev,
                              badge: e.target.value as DishBadge,
                            }))
                          }
                          className="w-full min-h-[42px] px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:border-[#d90429] focus:outline-none"
                        >
                          <option value="">কোনোটিই নয়</option>
                          <option value="🔥 বেস্টসেলার">🔥 বেস্টসেলার</option>
                          <option value="⭐ শেফ স্পেশাল">⭐ শেফ স্পেশাল</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1d1e2c] mb-1">
                        বিবরণ
                      </label>
                      <input
                        type="text"
                        value={dishForm.description}
                        onChange={(e) =>
                          setDishForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="খাবারের স্বাদ ও উপকরণের সংক্ষিপ্ত বিবরণ"
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none"
                      />
                    </div>

                    {/* Dish Photo Upload or URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                      <label className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#fff3db] border border-slate-200 text-[#1d1e2c] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <ImagePlus className="w-4 h-4 text-[#d90429]" />
                        <span>
                          {uploadingDishImg
                            ? 'ছবি লোড হচ্ছে...'
                            : 'খাবারের ছবি আপলোড করুন'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDishImageUpload}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="url"
                        value={
                          dishForm.image.startsWith('data:') ? '' : dishForm.image
                        }
                        onChange={(e) =>
                          setDishForm((prev) => ({
                            ...prev,
                            image: e.target.value,
                          }))
                        }
                        placeholder="অথবা ছবির URL দিন (https://...)"
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#d90429] focus:outline-none"
                      />
                    </div>

                    {dishForm.image && (
                      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
                        <FoodImage
                          src={dishForm.image}
                          alt="খাবারের প্রিভিউ"
                          className="w-16 h-12 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-xs font-medium text-emerald-700">
                          ছবি প্রিভিউ প্রস্তুত আছে
                        </span>
                      </div>
                    )}

                    {dishFormError && (
                      <p className="text-xs font-semibold text-[#d90429]">
                        {dishFormError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full min-h-[44px] rounded-xl bg-[#d90429] hover:bg-[#b30322] text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      {dishForm.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>পরিবর্তন সেভ করুন</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>মেনুতে যোগ করুন</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Existing Dishes List */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm font-bold text-[#1d1e2c]">
                        বর্তমান মেনু তালিকা ({toBengaliDigits(dishes.length)}টি পদ)
                      </h3>
                      {dishes.some((d) => d.inStock === false) && (
                        <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-[#d90429] text-xs font-bold tabular-nums">
                          🚫 {toBengaliDigits(dishes.filter((d) => d.inStock === false).length)}টি শেষ (Sold Out)
                        </span>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      {dishes.map((dish) => {
                        const isInStock = dish.inStock !== false;
                        return (
                          <div
                            key={dish.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border transition-colors ${
                              isInStock
                                ? 'bg-white border-slate-200'
                                : 'bg-red-50/45 border-red-200/90'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FoodImage
                                src={dish.image}
                                alt={dish.name}
                                className={`w-16 h-14 rounded-xl object-cover shrink-0 transition-all ${
                                  isInStock ? '' : 'grayscale opacity-70'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-sm font-bold truncate ${
                                    isInStock
                                      ? 'text-[#1d1e2c]'
                                      : 'text-slate-600 line-through'
                                  }`}
                                >
                                  {dish.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 tabular-nums">
                                  <span className="font-bold text-[#d90429]">
                                    {formatRupees(dish.price)}
                                  </span>
                                  {dish.oldPrice && (
                                    <span className="line-through">
                                      {formatRupees(dish.oldPrice)}
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>
                                    {dish.category === 'biryani'
                                      ? 'বিরিয়ানি'
                                      : 'চাউমিন ও রোল'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                              {/* 1-Tap In Stock / Sold Out Toggle Switch */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isInStock}
                                aria-label={`${dish.name} স্টক স্ট্যাটাস পরিবর্তন করুন`}
                                onClick={() => handleToggleDishStock(dish)}
                                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                                  isInStock
                                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                                    : 'bg-red-50 hover:bg-red-100 border-red-300 text-[#d90429]'
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                    isInStock ? 'bg-emerald-600' : 'bg-[#d90429]'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                                      isInStock
                                        ? 'translate-x-4.5'
                                        : 'translate-x-1'
                                    }`}
                                  />
                                </span>
                                <span className="whitespace-nowrap">
                                  {isInStock
                                    ? '✅ উপলব্ধ / In Stock'
                                    : '🚫 শেষ হয়ে গেছে / Sold Out'}
                                </span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditDish(dish)}
                                  aria-label={`${dish.name} এডিট করুন`}
                                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#ff9f1c]/25 text-[#1d1e2c] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                {pendingDeleteId === dish.id ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDish(dish.id)}
                                    className="px-2.5 h-9 rounded-xl bg-[#d90429] text-white text-xs font-bold cursor-pointer"
                                  >
                                    মুছুন
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteId(dish.id)}
                                    aria-label={`${dish.name} মুছে ফেলুন`}
                                    className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-[#d90429] flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
