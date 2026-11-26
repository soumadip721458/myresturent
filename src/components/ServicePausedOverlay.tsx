import { AlertTriangle, MessageCircle } from 'lucide-react';
import type { DeveloperControlConfig, Language } from '../types';

interface ServicePausedOverlayProps {
  shopName: string;
  developerControl: DeveloperControlConfig;
  reason: 'paused' | 'expired';
  lang: Language;
  onSecretCreditTap: () => void;
}

export function ServicePausedOverlay({
  shopName,
  developerControl,
  reason,
  lang,
  onSecretCreditTap,
}: ServicePausedOverlayProps) {
  const isBn = lang === 'bn';
  const cleanPhone =
    developerControl.developerWhatsapp.replace(/\D/g, '') || '918649853354';
  const devName = developerControl.developerBrandName.trim() || 'Developer';

  const whatsappMessage = isBn
    ? `নমস্কার ${devName}, "${shopName}"-এর অনলাইন অর্ডার সার্ভিসটি বর্তমানে বন্ধ আছে (${
        reason === 'expired' ? 'সাবস্ক্রিপশনের মেয়াদ শেষ' : 'সার্ভিস পজড'
      })। অনুগ্রহ করে এটি পুনরায় চালু করতে সাহায্য করুন।`
    : `Hello ${devName}, the online ordering service for "${shopName}" is currently suspended (${
        reason === 'expired' ? 'Subscription Expired' : 'Service Paused'
      }). Please help reactivate it.`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="service-paused-title"
      className="fixed inset-0 z-[55] bg-[#11121a] text-white flex flex-col items-center justify-center p-5 text-center"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#1a1b26] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#d90429]/15 border border-[#d90429]/40 text-[#ff6b81] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#ff9f1c]">
            {shopName}
          </p>
          <h1
            id="service-paused-title"
            className="text-xl sm:text-2xl font-bold leading-snug text-white"
          >
            ⚠️ সার্ভিস সাময়িকভাবে বন্ধ আছে (Subscription Expired) — পুনরায় চালু
            করতে ডেভেলপারের সাথে যোগাযোগ করুন
          </h1>
          {!isBn && (
            <p className="text-sm text-slate-300 leading-relaxed pt-1">
              This restaurant&apos;s ordering service is temporarily paused or
              its subscription has expired. Please contact the developer to
              reactivate.
            </p>
          )}
        </div>

        {reason === 'expired' && developerControl.subscriptionExpiry && (
          <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs text-slate-300">
            {isBn ? 'সাবস্ক্রিপশন মেয়াদ শেষ:' : 'Subscription expired on:'}{' '}
            <span className="font-mono font-bold text-[#ffd166]">
              {developerControl.subscriptionExpiry}
            </span>
          </div>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span>
            {isBn
              ? `ডেভেলপারের সাথে হোয়াটসঅ্যাপে যোগাযোগ করুন`
              : `Contact ${devName} on WhatsApp`}
          </span>
        </a>
      </div>

      {/* Preserves hidden 5-tap developer access even while service is paused/expired */}
      <div
        onClick={onSecretCreditTap}
        className="mt-8 select-none text-xs text-slate-400 cursor-default"
      >
        ⚡ Powered by <span className="font-bold text-slate-200">{devName}</span>
      </div>
    </div>
  );
}
