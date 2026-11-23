import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, X } from 'lucide-react';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  receiptText: string;
  whatsappUrl: string;
  onClose: () => void;
}

export function WhatsAppOrderModal({
  isOpen,
  receiptText,
  whatsappUrl,
  onClose,
}: WhatsAppOrderModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/10 max-h-[90vh] flex flex-col">
        <div className="bg-[#1d1e2c] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="wa-modal-title" className="text-lg font-bold leading-tight">
                আপনার অর্ডার রসিদ তৈরি!
              </h2>
              <p className="text-xs text-white/75">
                নিচের বাটনে ক্লিক করে সরাসরি WhatsApp-এ পাঠান
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-[#f4f5f7] border border-slate-200 rounded-2xl p-4 text-[#1d1e2c]">
            {receiptText}
          </pre>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span>WhatsApp-এ অর্ডার পাঠান</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1d1e2c] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>রসিদ কপি করা হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>রসিদ কপি করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
