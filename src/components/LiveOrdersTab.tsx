import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ClipboardList,
  Clock,
  Cloud,
  Gift,
  HardDrive,
  Lock,
  MapPin,
  Navigation,
  PhoneCall,
} from 'lucide-react';
import { SHOP_ID, isFirebaseConfigured } from '../firebase';
import type { CloudOrder, OrderStatus } from '../types';
import { formatRupees, toBengaliDigits } from '../utils/bengali';

interface LiveOrdersTabProps {
  orders: CloudOrder[];
  adminUser: User | null;
  ordersError: string | null;
  onUpdateStatus: (order: CloudOrder, nextStatus: OrderStatus) => Promise<void>;
}

type StatusFilter = 'All' | OrderStatus;

const STATUS_STYLES: Record<
  OrderStatus,
  { badge: string; select: string; labelBn: string }
> = {
  Pending: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    select: 'bg-amber-50 border-amber-300 text-amber-900',
    labelBn: '⏳ Pending (অপেক্ষমাণ)',
  },
  Confirmed: {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    select: 'bg-blue-50 border-blue-300 text-blue-900',
    labelBn: '✅ Confirmed (কনফার্মড)',
  },
  Delivered: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    select: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    labelBn: '🛵 Delivered (ডেলিভারড)',
  },
  Cancelled: {
    badge: 'bg-red-100 text-red-800 border-red-300',
    select: 'bg-red-50 border-red-300 text-red-900',
    labelBn: '❌ Cancelled (বাতিল)',
  },
};

function formatOrderTimestamp(ms: number): string {
  try {
    const dt = new Date(ms);
    const dateStr = dt.toLocaleDateString('bn-IN', {
      day: 'numeric',
      month: 'short',
    });
    const timeStr = dt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return '';
  }
}

export function LiveOrdersTab({
  orders,
  adminUser,
  ordersError,
  onUpdateStatus,
}: LiveOrdersTabProps) {
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const tally = {
      All: orders.length,
      Pending: 0,
      Confirmed: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    for (const o of orders) {
      tally[o.status] += 1;
    }
    return tally;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'All') return orders;
    return orders.filter((o) => o.status === filter);
  }, [filter, orders]);

  const handleStatusChange = async (
    order: CloudOrder,
    nextStatus: OrderStatus
  ) => {
    setUpdatingId(order.docId);
    try {
      await onUpdateStatus(order, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Tamper-Proof Explanation */}
      <div className="rounded-2xl bg-[#f4f5f7] border border-slate-200 p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#1d1e2c] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#d90429]" />
              <span>📋 লাইভ অর্ডার রেকর্ড (Cloud Order Log)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              গ্রাহক WhatsApp মেসেজ ডিলিট ("Delete for Everyone") করলেও প্রতিটি
              অর্ডার এখানে স্থায়ীভাবে সুরক্ষিত থাকে।
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1d1e2c] text-[#ffd166] text-[11px] font-bold">
            <Lock className="w-3 h-3" />
            <span>Tamper-Proof</span>
          </span>
        </div>

        {isFirebaseConfigured && !adminUser && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-900">
            ☁️ সব গ্রাহকের ফোন থেকে লাইভ ক্লাউড অর্ডার দেখতে উপরের{' '}
            <strong>Google লগইন (Cloud Sync)</strong> বাটনে ক্লিক করুন। বর্তমানে
            এই ডিভাইসের স্থানীয় ব্যাকআপ অর্ডার দেখাচ্ছে।
          </div>
        )}

        {ordersError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-800">
            ⚠️ ক্লাউড অর্ডার লোড করতে অনুমতি সমস্যা হয়েছে — অনুমোদিত মালিক /
            ডেভেলপার Google অ্যাকাউন্ট দিয়ে লগইন করুন।
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {(
            [
              { id: 'All', label: `সব (${toBengaliDigits(counts.All)})` },
              {
                id: 'Pending',
                label: `Pending (${toBengaliDigits(counts.Pending)})`,
              },
              {
                id: 'Confirmed',
                label: `Confirmed (${toBengaliDigits(counts.Confirmed)})`,
              },
              {
                id: 'Delivered',
                label: `Delivered (${toBengaliDigits(counts.Delivered)})`,
              },
              {
                id: 'Cancelled',
                label: `Cancelled (${toBengaliDigits(counts.Cancelled)})`,
              },
            ] as { id: StatusFilter; label: string }[]
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? tab.id === 'Pending'
                      ? 'bg-[#d90429] text-white'
                      : 'bg-[#1d1e2c] text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-[#f9fafb] py-10 px-4 text-center space-y-1.5">
          <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-[#1d1e2c]">
            এখনো কোনো অর্ডার রেকর্ড নেই
          </p>
          <p className="text-xs text-slate-500">
            গ্রাহক &quot;WhatsApp-এ অর্ডার কনফার্ম করুন&quot; ক্লিক করা মাত্রই
            এখানে অর্ডারটি লাইভ চলে আসবে (shops/{SHOP_ID}/orders)।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const style = STATUS_STYLES[order.status];
            const cleanPhone = order.customerPhone.replace(/\D/g, '');
            const isUpdating = updatingId === order.docId;

            return (
              <article
                key={order.docId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
              >
                {/* Top Row: Order ID, Timestamp, Source, Bill */}
                <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-[#d90429] bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                        {order.orderId}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${style.badge}`}
                      >
                        {order.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {order.source === 'cloud' ? (
                          <>
                            <Cloud className="w-3 h-3 text-emerald-600" />
                            <span>Cloud</span>
                          </>
                        ) : (
                          <>
                            <HardDrive className="w-3 h-3 text-amber-600" />
                            <span>Local</span>
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatOrderTimestamp(order.timestampMs)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">সর্বমোট বিল</p>
                    <p className="text-lg font-extrabold text-[#1d1e2c] tabular-nums leading-tight">
                      {formatRupees(order.finalTotal)}
                    </p>
                  </div>
                </div>

                {/* Customer Info + Call & Maps Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-bold text-[#1d1e2c]">
                      👤 {order.customerName}
                    </p>
                    <p className="text-xs text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#d90429] shrink-0 mt-0.5" />
                      <span className="break-words">{order.address}</span>
                    </p>
                    {order.distanceKm !== null && (
                      <p className="text-[11px] font-semibold text-emerald-700">
                        📏 দূরত্ব: {toBengaliDigits(order.distanceKm.toFixed(1))}{' '}
                        কিমি
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>কল করুন ({cleanPhone})</span>
                      </a>
                    )}

                    {order.googleMapsUrl && (
                      <a
                        href={order.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#1d1e2c] hover:bg-[#2a2c40] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-[#ff9f1c]" />
                        <span>Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="rounded-xl bg-[#f9fafb] border border-slate-200/80 p-3 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    অর্ডার করা খাবার ({toBengaliDigits(order.items.length)}টি পদ)
                  </p>
                  <ul className="space-y-1">
                    {order.items.map((item, idx) => (
                      <li
                        key={`${order.docId}-${item.dishId}-${idx}`}
                        className="text-xs sm:text-sm text-[#1d1e2c] flex items-center justify-between gap-2"
                      >
                        <span className="font-medium">
                          {item.name}{' '}
                          <span className="text-slate-500 font-bold tabular-nums">
                            × {toBengaliDigits(item.qty)}
                          </span>
                        </span>
                        <span className="font-semibold tabular-nums shrink-0">
                          {formatRupees(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {order.spinReward &&
                    order.spinReward !== 'কোনো অফার প্রযোজ্য নেই' &&
                    order.spinReward !== 'No offer applied' && (
                      <div className="pt-1.5 mt-1.5 border-t border-slate-200/70 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                        <Gift className="w-3.5 h-3.5 text-[#d90429] shrink-0" />
                        <span>স্পিন অফার: {order.spinReward}</span>
                      </div>
                    )}
                </div>

                {/* Status Control Dropdown */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label
                    htmlFor={`status-${order.docId}`}
                    className="text-xs font-bold text-slate-600"
                  >
                    অর্ডার স্ট্যাটাস আপডেট করুন:
                  </label>
                  <select
                    id={`status-${order.docId}`}
                    disabled={isUpdating}
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order, e.target.value as OrderStatus)
                    }
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold focus:outline-none cursor-pointer disabled:opacity-60 ${style.select}`}
                  >
                    <option value="Pending">{STATUS_STYLES.Pending.labelBn}</option>
                    <option value="Confirmed">
                      {STATUS_STYLES.Confirmed.labelBn}
                    </option>
                    <option value="Delivered">
                      {STATUS_STYLES.Delivered.labelBn}
                    </option>
                    <option value="Cancelled">
                      {STATUS_STYLES.Cancelled.labelBn}
                    </option>
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
