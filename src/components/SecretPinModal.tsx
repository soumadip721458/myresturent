import { useState } from 'react';
import { Lock, X } from 'lucide-react';

// Hardcoded access PINs — kept exclusively in source code (never displayed in UI).
const OWNER_ADMIN_PIN = '2026';
const DEVELOPER_CONTROL_PIN = '9999';

export type PinUnlockTarget = 'owner' | 'developer';

interface SecretPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (target: PinUnlockTarget) => void;
}

export function SecretPinModal({
  isOpen,
  onClose,
  onUnlock,
}: SecretPinModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setPinInput('');
    setPinError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pinInput.trim();
    if (cleaned === OWNER_ADMIN_PIN) {
      setPinInput('');
      setPinError('');
      onUnlock('owner');
      return;
    }
    if (cleaned === DEVELOPER_CONTROL_PIN) {
      setPinInput('');
      setPinError('');
      onUnlock('developer');
      return;
    }
    setPinError('ভুল পিন! সঠিক অ্যাক্সেস পিন দিন।');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-pin-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#1d1e2c]/85 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1b26] rounded-3xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 text-[#1d1e2c] dark:text-slate-100">
        <div className="bg-[#1d1e2c] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff9f1c] text-[#1d1e2c] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="secret-pin-title" className="text-base font-bold leading-tight">
                অ্যাক্সেস ভেরিফিকেশন
              </h2>
              <p className="text-xs text-white/70">
                প্রবেশ করতে ৪ সংখ্যার পিন দিন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f4f5f7] dark:bg-[#141520] flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-[#d90429] dark:text-[#ff6b81]" />
            </div>
            <p className="text-sm font-bold text-[#1d1e2c] dark:text-slate-100">
              অ্যাডমিন / কন্ট্রোল পিন প্রবেশ করান
            </p>
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
            placeholder="••••"
            autoFocus
            className="w-full min-h-[48px] text-center tracking-[0.4em] font-bold text-lg rounded-xl border border-slate-300 dark:border-white/15 bg-[#f9fafb] dark:bg-[#141520] text-[#1d1e2c] dark:text-white focus:bg-white dark:focus:bg-[#181926] focus:border-[#d90429] focus:outline-none focus:ring-2 focus:ring-[#d90429]/20"
          />

          {pinError && (
            <p className="text-xs font-semibold text-[#d90429] text-center">
              {pinError}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-[#d90429] hover:bg-[#b30322] text-white font-bold text-base shadow-md transition-colors cursor-pointer"
          >
            আনলক করুন
          </button>
        </form>
      </div>
    </div>
  );
}
