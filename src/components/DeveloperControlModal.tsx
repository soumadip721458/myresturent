import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CalendarClock,
  Check,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Power,
  ShieldAlert,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  DEFAULT_DEVELOPER_CONTROL,
  isSubscriptionBlocked,
} from '../data/defaults';
import { SHOP_ID, isFirebaseConfigured } from '../firebase';
import type { CloudSyncStatus, DeveloperControlConfig } from '../types';
import { getTodayKey } from '../utils/bengali';

interface DeveloperControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerControl: DeveloperControlConfig;
  onSaveDeveloperControl: (
    nextControl: DeveloperControlConfig
  ) => Promise<void> | void;
  onPushAllToCloud: () => Promise<void> | void;
  adminUser: User | null;
  cloudStatus: CloudSyncStatus;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onNotify: (message: string) => void;
}

function addDaysToToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DeveloperControlModal({
  isOpen,
  onClose,
  developerControl,
  onSaveDeveloperControl,
  onPushAllToCloud,
  adminUser,
  cloudStatus,
  onSignInGoogle,
  onSignOutGoogle,
  onNotify,
}: DeveloperControlModalProps) {
  const [draft, setDraft] = useState<DeveloperControlConfig>(developerControl);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(developerControl);
    }
  }, [isOpen, developerControl]);

  if (!isOpen) return null;

  const todayKey = getTodayKey();
  const previewBlockState = isSubscriptionBlocked(draft, todayKey);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiry = draft.subscriptionExpiry.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      onNotify('সঠিক তারিখ ফরম্যাট দিন (YYYY-MM-DD)');
      return;
    }

    const cleaned: DeveloperControlConfig = {
      serviceActive: Boolean(draft.serviceActive),
      subscriptionExpiry: expiry,
      developerBrandName:
        draft.developerBrandName.trim() ||
        DEFAULT_DEVELOPER_CONTROL.developerBrandName,
      developerWhatsapp:
        draft.developerWhatsapp.replace(/\D/g, '') ||
        DEFAULT_DEVELOPER_CONTROL.developerWhatsapp,
    };

    setSaving(true);
    try {
      await onSaveDeveloperControl(cleaned);
    } finally {
      setSaving(false);
    }
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

  const handlePushAll = async () => {
    setPushing(true);
    try {
      await onPushAllToCloud();
    } finally {
      setPushing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-control-title"
      className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-[#11121a]/85 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#1a1b26] rounded-3xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/15 max-h-[92vh] flex flex-col text-[#1d1e2c] dark:text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1d1e2c] via-[#26283b] to-[#1d1e2c] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#ff9f1c] text-[#1d1e2c] flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="dev-control-title"
                className="text-base sm:text-lg font-bold leading-tight truncate"
              >
                Developer Control Panel (SaaS)
              </h2>
              <p className="text-xs text-white/75 truncate">
                Tenant: <span className="font-mono text-[#ffd166]">shops/{SHOP_ID}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Firebase Cloud Sync Banner */}
          <div className="rounded-2xl bg-[#f4f5f7] dark:bg-[#141520] border border-slate-200 dark:border-white/10 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isFirebaseConfigured && cloudStatus !== 'error' ? (
                  <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <span className="text-xs font-bold text-[#1d1e2c] dark:text-slate-100">
                  {isFirebaseConfigured
                    ? adminUser
                      ? `Cloud Sync সক্রিয় (${adminUser.email})`
                      : 'রিয়েল-টাইম ক্লাউড আপডেটের জন্য Google লগইন করুন'
                    : 'LocalStorage Fallback Mode (Firebase প্লেসহোল্ডার কী)'}
                </span>
              </div>

              {isFirebaseConfigured &&
                (adminUser ? (
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={handleGoogleSignOut}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1f2130] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#d90429] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={handleGoogleSignIn}
                    className="px-3 py-1.5 rounded-lg bg-[#1d1e2c] dark:bg-[#ff9f1c] text-white dark:text-[#1d1e2c] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{authBusy ? 'লগইন হচ্ছে...' : 'Google Sign-In'}</span>
                  </button>
                ))}
            </div>

            {isFirebaseConfigured && adminUser && (
              <button
                type="button"
                disabled={pushing}
                onClick={handlePushAll}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {pushing
                    ? 'সিঙ্ক হচ্ছে...'
                    : `সব ডেটা Firestore (shops/${SHOP_ID})-এ এখনই পাবলিশ করুন`}
                </span>
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* 1. Service Status Toggle */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-[#f9fafb] dark:bg-[#141520] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Power
                      className={`w-4 h-4 shrink-0 ${
                        draft.serviceActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-[#d90429]'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-[#1d1e2c] dark:text-white">
                      Service Status (Active / Paused)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    OFF করলে সাথে সাথে সব গ্রাহকের ফোনে সার্ভিস বন্ধ স্ক্রিন দেখাবে।
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.serviceActive}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      serviceActive: !prev.serviceActive,
                    }))
                  }
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    draft.serviceActive ? 'bg-emerald-600' : 'bg-[#d90429]'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                      draft.serviceActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  লাইভ গ্রাহক স্ট্যাটাস:
                </span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-md ${
                    previewBlockState.blocked
                      ? 'bg-red-100 dark:bg-red-500/20 text-[#d90429] dark:text-red-300'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {previewBlockState.blocked
                    ? previewBlockState.reason === 'paused'
                      ? '⛔ PAUSED (সার্ভিস বন্ধ)'
                      : '⚠️ EXPIRED (মেয়াদ শেষ)'
                    : '✅ ACTIVE (চলছে)'}
                </span>
              </div>
            </div>

            {/* 2. Subscription Expiry Date */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-[#f9fafb] dark:bg-[#141520] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#d90429] dark:text-[#ff9f1c]" />
                <label
                  htmlFor="sub-expiry-date"
                  className="text-sm font-bold text-[#1d1e2c] dark:text-white"
                >
                  Subscription Expiry Date (YYYY-MM-DD)
                </label>
              </div>

              <input
                id="sub-expiry-date"
                type="date"
                value={draft.subscriptionExpiry}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    subscriptionExpiry: e.target.value,
                  }))
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1a1b26] text-[#1d1e2c] dark:text-white text-sm font-semibold tabular-nums focus:border-[#d90429] focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      serviceActive: true,
                      subscriptionExpiry: addDaysToToday(30),
                    }))
                  }
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1f2130] border border-slate-200 dark:border-white/10 text-xs font-bold text-[#1d1e2c] dark:text-slate-200 hover:border-[#ff9f1c] cursor-pointer"
                >
                  +৩০ দিন (১ মাস)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      serviceActive: true,
                      subscriptionExpiry: addDaysToToday(365),
                    }))
                  }
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1f2130] border border-slate-200 dark:border-white/10 text-xs font-bold text-[#1d1e2c] dark:text-slate-200 hover:border-[#ff9f1c] cursor-pointer"
                >
                  +১ বছর
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      subscriptionExpiry: addDaysToToday(-1),
                    }))
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-xs font-bold text-[#d90429] dark:text-red-300 cursor-pointer"
                >
                  মেয়াদ শেষ টেস্ট করুন
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                আজকের তারিখ: <span className="font-mono font-semibold">{todayKey}</span>
              </p>
            </div>

            {/* 3. Developer Brand Name & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1d1e2c] dark:text-slate-200 mb-1.5">
                  Developer Brand Name (ফুটারে দেখাবে)
                </label>
                <input
                  type="text"
                  value={draft.developerBrandName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      developerBrandName: e.target.value,
                    }))
                  }
                  placeholder="যেমন: Soumdip Digital"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-[#f9fafb] dark:bg-[#141520] text-[#1d1e2c] dark:text-white text-sm focus:bg-white dark:focus:bg-[#1f2130] focus:border-[#d90429] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d1e2c] dark:text-slate-200 mb-1.5">
                  Developer WhatsApp Number (কান্ট্রি কোড সহ)
                </label>
                <input
                  type="tel"
                  value={draft.developerWhatsapp}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      developerWhatsapp: e.target.value,
                    }))
                  }
                  placeholder="918649853354"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-[#f9fafb] dark:bg-[#141520] text-[#1d1e2c] dark:text-white text-sm tabular-nums focus:bg-white dark:focus:bg-[#1f2130] focus:border-[#d90429] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[48px] rounded-xl bg-[#d90429] hover:bg-[#b30322] disabled:opacity-60 text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>
                {saving
                  ? 'সেভ ও সিঙ্ক হচ্ছে...'
                  : 'ডেভেলপার কন্ট্রোল সেভ করুন'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
