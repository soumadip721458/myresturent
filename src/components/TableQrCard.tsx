import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode, Smartphone } from 'lucide-react';
import type { ShopConfig } from '../types';

interface TableQrCardProps {
  shop: ShopConfig;
  onNotify: (message: string) => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, centerX, y);
    y += lineHeight;
  }
  return y;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function TableQrCard({ shop, onNotify }: TableQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(
    null
  );

  const liveUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://appayon.app';

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(liveUrl, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#1d1e2c',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(liveUrl)}`
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [liveUrl]);

  const triggerDownload = (
    href: string,
    filename: string,
    defaultSuccessToast: string
  ) => {
    const inIframe = isRunningInIframe();
    const blob = href.startsWith('data:') ? dataUrlToBlob(href) : null;
    const objectUrl = blob ? URL.createObjectURL(blob) : null;
    const downloadHref = objectUrl || href;
    let downloadFailed = false;

    try {
      const link = document.createElement('a');
      link.href = downloadHref;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      downloadFailed = true;
    }

    if (inIframe || downloadFailed) {
      let opened = false;
      try {
        const win = window.open(
          objectUrl || href,
          '_blank',
          'noopener,noreferrer'
        );
        if (win) {
          opened = true;
        }
      } catch {
        opened = false;
      }

      if (!opened && href.startsWith('data:')) {
        try {
          const fallbackWin = window.open('', '_blank');
          if (fallbackWin) {
            fallbackWin.document.write(
              `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${filename}</title><style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1d1e2c;color:#fff;font-family:sans-serif;padding:16px;text-align:center}img{max-width:100%;height:auto;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.4)}p{margin:14px 0 0;font-size:14px;color:#ffd166}</style></head><body><img src="${href}" alt="Table QR Code" /><p>ছবিটি সেভ করতে ছবির ওপর চেপে ধরে Save Image করুন</p></body></html>`
            );
            fallbackWin.document.close();
          }
        } catch {
          // Ignore popup errors; inline preview below remains available
        }
      }

      setGeneratedPreviewUrl(href);
      onNotify(
        'ছবিটি নতুন ট্যাবে খুলেছে — সেভ করতে ছবির ওপর চেপে ধরে Save Image করুন'
      );
    } else {
      onNotify(defaultSuccessToast);
    }

    if (objectUrl) {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }
  };

  const handleDownloadPoster = async () => {
    if (!qrDataUrl) return;
    setIsDownloading(true);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = document.createElement('canvas');
      const W = 1080;
      const H = 1480;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        triggerDownload(
          qrDataUrl,
          'table-qr-code.png',
          'QR কোড ডাউনলোড শুরু হয়েছে!'
        );
        return;
      }

      // Outer print card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Decorative crimson outer border
      drawRoundedRect(ctx, 28, 28, W - 56, H - 56, 44);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#d90429';
      ctx.stroke();

      // Top dark crimson/charcoal header band
      const headerGrad = ctx.createLinearGradient(0, 34, W, 310);
      headerGrad.addColorStop(0, '#d90429');
      headerGrad.addColorStop(0.65, '#9b041f');
      headerGrad.addColorStop(1, '#1d1e2c');

      ctx.save();
      drawRoundedRect(ctx, 34, 34, W - 68, 260, 38);
      ctx.clip();
      ctx.fillStyle = headerGrad;
      ctx.fillRect(34, 34, W - 68, 260);
      ctx.restore();

      // Golden accent bar under header
      ctx.fillStyle = '#ff9f1c';
      ctx.fillRect(160, 282, W - 320, 10);

      // Restaurant Name
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 62px "Hind Siliguri", sans-serif';
      ctx.fillText(shop.name, W / 2, 138, W - 140);

      // Address
      ctx.fillStyle = '#ffd166';
      ctx.font = '600 32px "Hind Siliguri", sans-serif';
      ctx.fillText(`📍 ${shop.address}`, W / 2, 220, W - 160);

      // Promo Banner Box
      drawRoundedRect(ctx, 76, 338, W - 152, 168, 28);
      ctx.fillStyle = '#fff5e0';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ff9f1c';
      ctx.stroke();

      ctx.fillStyle = '#1d1e2c';
      ctx.font = '700 38px "Hind Siliguri", sans-serif';
      drawWrappedText(
        ctx,
        '🎁 স্ক্যান করে চাকা ঘোরান আর জিতে নিন ফ্রি খাবার ও ডিসকাউন্ট!',
        W / 2,
        400,
        W - 220,
        54
      );

      // QR Frame Card
      const qrBoxSize = 600;
      const qrBoxX = (W - qrBoxSize) / 2;
      const qrBoxY = 550;

      drawRoundedRect(ctx, qrBoxX - 28, qrBoxY - 28, qrBoxSize + 56, qrBoxSize + 56, 36);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#1d1e2c';
      ctx.stroke();

      // Draw QR image onto canvas
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
          resolve();
        };
        img.onerror = () => reject(new Error('QR image load failed'));
        img.src = qrDataUrl;
      });

      // Bottom WhatsApp Order Callout Pill
      drawRoundedRect(ctx, 96, 1222, W - 192, 108, 26);
      ctx.fillStyle = '#1d1e2c';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 38px "Hind Siliguri", sans-serif';
      ctx.fillText('📱 হোয়াটসঅ্যাপে ঘরে বসে অর্ডার করুন', W / 2, 1278, W - 240);

      // Website URL footer caption
      ctx.fillStyle = '#64748b';
      ctx.font = '500 24px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText(liveUrl, W / 2, 1384, W - 160);

      const posterDataUrl = canvas.toDataURL('image/png');
      triggerDownload(
        posterDataUrl,
        'appayon-table-qr.png',
        'টেবিল QR পোস্টার গ্যালারিতে ডাউনলোড হয়েছে!'
      );
    } catch {
      triggerDownload(
        qrDataUrl,
        'appayon-qr.png',
        'QR কোড ডাউনলোড হয়েছে!'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#1d1e2c] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#d90429]" />
            <span>📲 দোকানের QR কোড ডাউনলোড (Table QR)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            প্রিন্ট করে দোকানের প্রতিটি টেবিলে ও কাউন্টারে লাগিয়ে রাখুন
          </p>
        </div>
      </div>

      {/* Ready-to-Print Bengali Promotional Frame Card */}
      <div className="mx-auto max-w-sm rounded-3xl bg-white border-[3px] border-[#d90429] shadow-lg overflow-hidden">
        {/* Poster Header */}
        <div className="bg-gradient-to-r from-[#d90429] via-[#a90422] to-[#1d1e2c] px-5 py-4 text-center text-white relative">
          <h4 className="text-xl font-bold leading-snug tracking-tight">
            {shop.name}
          </h4>
          <p className="text-xs font-medium text-[#ffd166] mt-0.5">
            📍 {shop.address}
          </p>
          <div className="mx-auto mt-2.5 h-1 w-24 rounded-full bg-[#ff9f1c]" />
        </div>

        {/* Poster Body */}
        <div className="p-5 text-center space-y-4">
          <div className="rounded-2xl bg-[#fff6e3] border border-[#ff9f1c]/70 px-3.5 py-2.5">
            <p className="text-sm font-bold text-[#1d1e2c] leading-snug">
              🎁 স্ক্যান করে চাকা ঘোরান আর জিতে নিন ফ্রি খাবার ও ডিসকাউন্ট!
            </p>
          </div>

          {/* Crisp High-Resolution QR Box */}
          <div className="mx-auto w-56 h-56 sm:w-60 sm:h-60 rounded-2xl border-2 border-[#1d1e2c] bg-white p-3 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`${shop.name} টেবিল QR কোড`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-slate-400 font-medium">
                QR কোড তৈরি হচ্ছে...
              </div>
            )}
          </div>

          {/* WhatsApp Callout */}
          <div className="rounded-xl bg-[#1d1e2c] text-white px-4 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
            <Smartphone className="w-4 h-4 text-[#ff9f1c] shrink-0" />
            <span>📱 হোয়াটসঅ্যাপে ঘরে বসে অর্ডার করুন</span>
          </div>

          <p className="text-[11px] font-mono text-slate-400 truncate">
            {liveUrl}
          </p>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="mx-auto max-w-sm space-y-2.5 pt-1">
        <button
          type="button"
          onClick={handleDownloadPoster}
          disabled={!qrDataUrl || isDownloading}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#d90429] hover:bg-[#b30322] disabled:opacity-60 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-5 h-5 shrink-0" />
          <span>
            {isDownloading
              ? 'ডাউনলোড প্রস্তুত হচ্ছে...'
              : '⬇️ QR কোড ডাউনলোড করুন'}
          </span>
        </button>

        {qrDataUrl && (
          <button
            type="button"
            onClick={() => {
              triggerDownload(
                qrDataUrl,
                'appayon-qr-only.png',
                'শুধু QR কোড ছবি ডাউনলোড হয়েছে!'
              );
            }}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1d1e2c] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>শুধু সাদা-কালো QR কোড ছবি ডাউনলোড</span>
          </button>
        )}

        {generatedPreviewUrl && (
          <div className="rounded-2xl bg-[#fff8eb] border border-[#ff9f1c]/60 p-3 text-center space-y-2">
            <p className="text-xs font-semibold text-[#1d1e2c]">
              ছবিটি নতুন ট্যাবে না খুললে নিচের ছবির ওপর চেপে ধরে <strong>Save Image</strong> করুন:
            </p>
            <img
              src={generatedPreviewUrl}
              alt="ডাউনলোডযোগ্য QR পোস্টার"
              className="mx-auto max-h-56 w-auto rounded-xl border border-slate-200 shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
