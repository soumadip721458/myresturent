import { useState } from 'react';
import {
  Check,
  ImagePlus,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { DEFAULT_MENU, DEFAULT_SHOP_CONFIG } from '../data/defaults';
import type { Dish, DishBadge, DishCategory, ShopConfig } from '../types';
import { compressImageFile, formatRupees } from '../utils/bengali';
import { FoodImage } from './FoodImage';

// Developer-only master Admin PIN. Edit this constant directly in source code to change the PIN.
const DEVELOPER_ADMIN_PIN = '2026';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: ShopConfig;
  dishes: Dish[];
  onSaveShop: (nextShop: ShopConfig) => void;
  onSaveDishes: (nextDishes: Dish[]) => void;
  onNotify: (message: string) => void;
}

type AdminTab = 'shop' | 'menu';

interface DishFormState {
  id: string | null;
  name: string;
  category: DishCategory;
  price: string;
  oldPrice: string;
  description: string;
  image: string;
  badge: DishBadge;
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
};

export function AdminPanelModal({
  isOpen,
  onClose,
  shop,
  dishes,
  onSaveShop,
  onSaveDishes,
  onNotify,
}: AdminPanelModalProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('shop');

  // Section A: Shop Branding Form
  const [shopDraft, setShopDraft] = useState<ShopConfig>(shop);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Section B: Menu Management Form
  const [dishForm, setDishForm] = useState<DishFormState>(EMPTY_DISH_FORM);
  const [uploadingDishImg, setUploadingDishImg] = useState(false);
  const [dishFormError, setDishFormError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setUnlocked(false);
    setPinInput('');
    setPinError('');
    setConfirmReset(false);
    setPendingDeleteId(null);
    onClose();
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEVELOPER_ADMIN_PIN) {
      setUnlocked(true);
      setPinError('');
      setShopDraft(shop);
    } else {
      setPinError('ভুল পিন! সঠিক অ্যাডমিন পিন দিন।');
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const dataUrl = await compressImageFile(file, 1200, 0.78);
      setShopDraft((prev) => ({ ...prev, heroImage: dataUrl }));
      onNotify('দোকানের নতুন ছবি আপলোড হয়েছে — সেভ করুন');
    } catch {
      onNotify('ছবি আপলোড করতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  const handleSaveShopClick = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedShop: ShopConfig = {
      name: shopDraft.name.trim() || DEFAULT_SHOP_CONFIG.name,
      address: shopDraft.address.trim() || DEFAULT_SHOP_CONFIG.address,
      rating: shopDraft.rating.trim() || DEFAULT_SHOP_CONFIG.rating,
      statusText: shopDraft.statusText.trim() || DEFAULT_SHOP_CONFIG.statusText,
      whatsappNumber:
        shopDraft.whatsappNumber.replace(/\D/g, '') ||
        DEFAULT_SHOP_CONFIG.whatsappNumber,
      heroImage: shopDraft.heroImage.trim() || DEFAULT_SHOP_CONFIG.heroImage,
    };
    onSaveShop(cleanedShop);
    onNotify('দোকানের তথ্য ও ছবি সফলভাবে সেভ হয়েছে!');
  };

  const handleResetDefaults = () => {
    onSaveShop(DEFAULT_SHOP_CONFIG);
    onSaveDishes(DEFAULT_MENU);
    setShopDraft(DEFAULT_SHOP_CONFIG);
    setDishForm(EMPTY_DISH_FORM);
    setConfirmReset(false);
    onNotify('সব তথ্য ও মেনু ডিফল্ট অবস্থায় ফিরিয়ে আনা হয়েছে');
  };

  const handleDishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDishImg(true);
    try {
      const dataUrl = await compressImageFile(file, 800, 0.76);
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
    });
    setDishFormError('');
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

    const nextDish: Dish = {
      id: dishForm.id || `dish-${Date.now()}`,
      name,
      category: dishForm.category,
      price: Math.round(price),
      oldPrice:
        oldPrice && Number.isFinite(oldPrice) && oldPrice > price
          ? Math.round(oldPrice)
          : undefined,
      description:
        dishForm.description.trim() || 'আমাদের তাজা ও সুস্বাদু স্পেশাল পদ।',
      image:
        dishForm.image.trim() ||
        'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
      badge: dishForm.badge,
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
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1d1e2c] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff9f1c] text-[#1d1e2c] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-modal-title" className="text-lg font-bold leading-tight">
                মালিক / অ্যাডমিন ড্যাশবোর্ড
              </h2>
              <p className="text-xs text-white/75">
                {unlocked
                  ? 'সব পরিবর্তন স্বয়ংক্রিয়ভাবে ব্রাউজারে সেভ থাকে'
                  : 'প্রবেশ করতে ৪ সংখ্যার অ্যাডমিন পিন দিন'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Gate or Dashboard Body */}
        {!unlocked ? (
          <form onSubmit={handleUnlock} className="p-6 sm:p-8 max-w-sm mx-auto w-full">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f4f5f7] text-[#1d1e2c] flex items-center justify-center mb-3">
                <Lock className="w-7 h-7 text-[#d90429]" />
              </div>
              <h3 className="text-lg font-bold text-[#1d1e2c]">
                অ্যাডমিন পিন প্রবেশ করান
              </h3>
            </div>

            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              placeholder="পিন লিখুন"
              autoFocus
              className="w-full min-h-[48px] text-center tracking-[0.35em] font-bold text-lg rounded-xl border border-slate-300 bg-[#f9fafb] focus:bg-white focus:border-[#d90429] focus:outline-none focus:ring-2 focus:ring-[#d90429]/20"
            />

            {pinError && (
              <p className="mt-2 text-xs font-semibold text-[#d90429] text-center">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="mt-4 w-full min-h-[46px] rounded-xl bg-[#d90429] hover:bg-[#b30322] text-white font-bold text-base shadow-md transition-colors cursor-pointer"
            >
              ড্যাশবোর্ড খুলুন
            </button>
          </form>
        ) : (
          <>
            {/* Admin Section Tabs */}
            <div className="bg-[#f4f5f7] px-4 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('shop')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'shop'
                    ? 'bg-[#1d1e2c] text-white shadow-sm'
                    : 'bg-white text-[#1d1e2c] border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>🏪 দোকানের ছবি ও তথ্য পরিবর্তন</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'menu'
                    ? 'bg-[#1d1e2c] text-white shadow-sm'
                    : 'bg-white text-[#1d1e2c] border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>🍽️ মেনু ও খাবারের ছবি ম্যানেজ</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'shop' ? (
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
                    <h3 className="text-sm font-bold text-[#1d1e2c] mb-3">
                      বর্তমান মেনু তালিকা ({dishes.length}টি পদ)
                    </h3>
                    <div className="space-y-2.5">
                      {dishes.map((dish) => (
                        <div
                          key={dish.id}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200"
                        >
                          <FoodImage
                            src={dish.image}
                            alt={dish.name}
                            className="w-16 h-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#1d1e2c] truncate">
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

                          <div className="flex items-center gap-1.5 shrink-0">
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
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
