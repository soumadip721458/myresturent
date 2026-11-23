import { useState } from 'react';
import { CheckCircle2, Gift, Sparkles, X } from 'lucide-react';
import { SPIN_SLICES } from '../data/defaults';
import type { SpinPrizeId, SpinSlice } from '../types';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  wonPrizeId: SpinPrizeId | null;
  onWin: (prizeId: SpinPrizeId) => void;
}

const SLICE_COUNT = SPIN_SLICES.length; // 5
const SLICE_DEG = 360 / SLICE_COUNT; // 72 deg

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  // 0 deg at 12 o'clock, increasing clockwise
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function pickWeightedSliceIndex(): number {
  const totalWeight = SPIN_SLICES.reduce((acc, s) => acc + s.weight, 0);
  if (totalWeight <= 0) return 1;
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < SPIN_SLICES.length; i++) {
    roll -= SPIN_SLICES[i].weight;
    if (roll <= 0) return i;
  }
  return 1;
}

export function SpinWheelModal({
  isOpen,
  onClose,
  wonPrizeId,
  onWin,
}: SpinWheelModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [justWonSlice, setJustWonSlice] = useState<SpinSlice | null>(null);

  if (!isOpen) return null;

  const activeWonSlice =
    justWonSlice || SPIN_SLICES.find((s) => s.id === wonPrizeId) || null;
  const alreadyLocked = Boolean(wonPrizeId) && !isSpinning;

  const handleSpin = () => {
    if (isSpinning || wonPrizeId) return;

    const targetIndex = pickWeightedSliceIndex();
    const selectedSlice = SPIN_SLICES[targetIndex];
    const centerAngle = targetIndex * SLICE_DEG + SLICE_DEG / 2;
    const alignRemainder = (360 - centerAngle) % 360;
    const jitter = (Math.random() - 0.5) * 28; // natural stop inside slice
    const fullTurns = 6 * 360;
    const nextRotation = fullTurns + alignRemainder + jitter;

    setIsSpinning(true);
    setRotation(nextRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      setJustWonSlice(selectedSlice);
      onWin(selectedSlice.id);
    }, 4600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1d1e2c]/75 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/10 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#d90429] via-[#b80423] to-[#1d1e2c] px-5 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#ff9f1c] text-[#1d1e2c] flex items-center justify-center shrink-0 shadow-sm">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="spin-modal-title"
                className="text-lg sm:text-xl font-bold leading-tight truncate"
              >
                চাকা ঘোরান আর জিতে নিন!
              </h2>
              <p className="text-xs text-white/85">
                প্রতিদিন ১ বার ফ্রি স্পিন • নিশ্চিত পুরস্কার
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* Wheel Container */}
          <div className="relative mx-auto w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] flex items-center justify-center">
            {/* Top Pointer Triangle */}
            <div
              aria-hidden="true"
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 drop-shadow-md"
            >
              <svg width="34" height="36" viewBox="0 0 34 36">
                <path
                  d="M17 35 L3 6 Q17 0 31 6 Z"
                  fill="#d90429"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <circle cx="17" cy="10" r="3.5" fill="#ffd166" />
              </svg>
            </div>

            {/* Rotating Wheel SVG */}
            <div
              className="w-full h-full rounded-full p-2 bg-[#1d1e2c] shadow-xl ring-4 ring-[#ff9f1c]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4.5s cubic-bezier(0.12, 0.85, 0.14, 1)'
                  : 'none',
              }}
            >
              <svg
                viewBox="0 0 300 300"
                className="w-full h-full rounded-full overflow-visible"
              >
                {SPIN_SLICES.map((slice, index) => {
                  const startAngle = index * SLICE_DEG;
                  const endAngle = startAngle + SLICE_DEG;
                  const midAngle = startAngle + SLICE_DEG / 2;
                  const labelPos = polarToCartesian(150, 150, 96, midAngle);
                  const lines = slice.wheelLabel.split('\n');

                  return (
                    <g key={slice.id}>
                      <path
                        d={describeSlicePath(150, 150, 146, startAngle, endAngle)}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                      <g
                        transform={`translate(${labelPos.x.toFixed(1)}, ${labelPos.y.toFixed(1)}) rotate(${midAngle})`}
                      >
                        {slice.isJackpot && (
                          <text
                            x="0"
                            y="-20"
                            textAnchor="middle"
                            fill="#1d1e2c"
                            fontSize="9"
                            fontWeight="700"
                          >
                            ★ মেগা ★
                          </text>
                        )}
                        {lines.map((line, lineIdx) => (
                          <text
                            key={lineIdx}
                            x="0"
                            y={lineIdx * 15 - (lines.length - 1) * 5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={slice.textColor}
                            fontSize="11.5"
                            fontWeight="700"
                          >
                            {line}
                          </text>
                        ))}
                      </g>
                    </g>
                  );
                })}

                {/* Outer decorative rim studs */}
                {Array.from({ length: 15 }).map((_, idx) => {
                  const pt = polarToCartesian(150, 150, 141, idx * 24);
                  return (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="2.6"
                      fill={idx % 2 === 0 ? '#ffffff' : '#ffd166'}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Center Hub Button */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning || alreadyLocked}
              className="absolute z-10 w-16 h-16 rounded-full bg-white text-[#d90429] border-4 border-[#1d1e2c] shadow-lg flex flex-col items-center justify-center font-bold text-xs leading-tight hover:scale-105 active:scale-95 disabled:opacity-90 disabled:cursor-default transition-transform cursor-pointer"
            >
              <span>{isSpinning ? 'ঘুরছে' : alreadyLocked ? 'জেতা!' : 'ঘোরান'}</span>
            </button>
          </div>

          {/* Result Card or Spin CTA */}
          {activeWonSlice && !isSpinning ? (
            <div className="mt-5 rounded-2xl bg-[#fff8eb] border border-[#ff9f1c]/50 p-4 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>অভিনন্দন! আজকের পুরস্কার আনলক হয়েছে</span>
              </div>
              <p className="text-lg font-bold text-[#1d1e2c]">
                {activeWonSlice.fullLabel}
              </p>
              <p className="text-xs text-[#1d1e2c]/70 mt-1">
                {activeWonSlice.conditionText} • অর্ডারের সময় স্বয়ংক্রিয়ভাবে যুক্ত হবে
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full min-h-[46px] rounded-xl bg-[#d90429] hover:bg-[#b30322] active:scale-[0.99] text-white font-bold text-base shadow-md transition-all cursor-pointer"
              >
                মেনু দেখুন ও অর্ডার করুন ➔
              </button>
            </div>
          ) : (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full min-h-[48px] rounded-xl bg-[#d90429] hover:bg-[#b30322] disabled:bg-[#1d1e2c]/70 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-[#d90429]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-[#ffd166]" />
                <span>
                  {isSpinning ? 'চাকা ঘুরছে... অপেক্ষা করুন!' : 'এখনই চাকা ঘোরান!'}
                </span>
              </button>
              <p className="mt-2.5 text-xs text-slate-500">
                প্রতিদিন একবার স্পিন করার সুযোগ পাবেন। জিতলে ছাড় সরাসরি বিলে যোগ হবে।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
