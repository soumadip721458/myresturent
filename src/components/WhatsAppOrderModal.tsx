import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, X } from 'lucide-react';
import type { Language } from '../types';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  lang: Language;
  receiptText: string;
  whatsappUrl: string;
  onClose: () => void;
}

export function WhatsAppOrderModal({
  isOpen,
  lang,
  receiptText,
  whatsappUrl,
  onClose,
}: WhatsAppOrderModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isBn = lang === 'bn';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1e2c]/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1a1b26] rounded-3xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 max-h-[90vh] flex flex-col">
        <div className="bg-[#1d1e2c] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="wa-modal-title" className="text-lg font-bold leading-tight">
                {isBn ? 'আপনার অর্ডার রসিদ তৈরি!' : 'Your Order Receipt is Ready!'}
              </h2>
              <p className="text-xs text-white/75">
                {isBn
                  ? 'নিচের বাটনে ক্লিক করে সরাসরি WhatsApp-এ পাঠান'
                  : 'Tap below to send your order directly on WhatsApp'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-[#f4f5f7] dark:bg-[#141520] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-[#1d1e2c] dark:text-slate-100">
            {receiptText}
          </pre>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-[#1a1b26] space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span>
              {isBn ? 'WhatsApp-এ অর্ডার পাঠান' : 'Send Order on WhatsApp'}
            </span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full min-h-[44px] rounded-xl bg-slate-100 dark:bg-[#141520] hover:bg-slate-200 dark:hover:bg-[#232436] border border-transparent dark:border-white/12 text-[#1d1e2c] dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isBn ? 'রসিদ কপি করা হয়েছে!' : 'Receipt Copied!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{isBn ? 'রসিদ কপি করুন' : 'Copy Receipt'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
