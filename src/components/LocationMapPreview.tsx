import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Language } from '../types';

interface LocationMapPreviewProps {
  shopLat: number;
  shopLng: number;
  shopName: string;
  maxDeliveryKm: number;
  customerLat: number;
  customerLng: number;
  lang: Language;
  onPinChange: (lat: number, lng: number) => void;
}

function createPinIcon(emoji: string, bgColor: string, ringColor: string) {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:${bgColor};border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.35),0 0 0 3px ${ringColor};display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export function LocationMapPreview({
  shopLat,
  shopLng,
  shopName,
  maxDeliveryKm,
  customerLat,
  customerLng,
  lang,
  onPinChange,
}: LocationMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const shopMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const onPinChangeRef = useRef(onPinChange);
  onPinChangeRef.current = onPinChange;

  const isBn = lang === 'bn';

  // Initialize Leaflet map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [customerLat, customerLng],
      zoom: 14,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const shopIcon = createPinIcon('🍛', '#d90429', 'rgba(217,4,41,0.28)');
    const customerIcon = createPinIcon('📍', '#059669', 'rgba(5,150,105,0.32)');

    const radiusCircle = L.circle([shopLat, shopLng], {
      radius: Math.max(0.5, maxDeliveryKm) * 1000,
      color: '#10b981',
      weight: 1.5,
      dashArray: '5, 6',
      fillColor: '#10b981',
      fillOpacity: 0.08,
    }).addTo(map);

    const routeLine = L.polyline(
      [
        [shopLat, shopLng],
        [customerLat, customerLng],
      ],
      {
        color: '#d90429',
        weight: 2.5,
        dashArray: '6, 8',
        opacity: 0.75,
      }
    ).addTo(map);

    const shopMarker = L.marker([shopLat, shopLng], { icon: shopIcon })
      .addTo(map)
      .bindPopup(shopName);

    const customerMarker = L.marker([customerLat, customerLng], {
      icon: customerIcon,
      draggable: true,
    })
      .addTo(map)
      .bindPopup(isBn ? 'আপনার ডেলিভারি লোকেশন' : 'Your Delivery Location');

    customerMarker.on('dragend', () => {
      const pos = customerMarker.getLatLng();
      onPinChangeRef.current(
        Number(pos.lat.toFixed(6)),
        Number(pos.lng.toFixed(6))
      );
    });

    map.on('click', (evt: L.LeafletMouseEvent) => {
      const { lat, lng } = evt.latlng;
      onPinChangeRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    mapRef.current = map;
    shopMarkerRef.current = shopMarker;
    customerMarkerRef.current = customerMarker;
    radiusCircleRef.current = radiusCircle;
    routeLineRef.current = routeLine;

    const bounds = L.latLngBounds([
      [shopLat, shopLng],
      [customerLat, customerLng],
    ]);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });

    // Ensure tiles render cleanly inside dynamic containers
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      shopMarkerRef.current = null;
      customerMarkerRef.current = null;
      radiusCircleRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // Sync markers, radius circle, route polyline, and map viewport when coordinates update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    shopMarkerRef.current?.setLatLng([shopLat, shopLng]).setPopupContent(shopName);
    customerMarkerRef.current
      ?.setLatLng([customerLat, customerLng])
      .setPopupContent(
        isBn ? 'আপনার ডেলিভারি লোকেশন' : 'Your Delivery Location'
      );
    radiusCircleRef.current
      ?.setLatLng([shopLat, shopLng])
      .setRadius(Math.max(0.5, maxDeliveryKm) * 1000);
    routeLineRef.current?.setLatLngs([
      [shopLat, shopLng],
      [customerLat, customerLng],
    ]);

    const bounds = L.latLngBounds([
      [shopLat, shopLng],
      [customerLat, customerLng],
    ]);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
  }, [shopLat, shopLng, shopName, maxDeliveryKm, customerLat, customerLng, isBn]);

  return (
    <div className="relative isolate z-0 rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 shadow-xs">
      <div
        ref={containerRef}
        className="w-full h-[215px] sm:h-[235px] bg-slate-100 dark:bg-[#141520]"
      />
      <div className="bg-[#1d1e2c]/90 text-white px-3 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-1.5">
        <span>
          {isBn
            ? '👆 ম্যাপে ট্যাপ বা পিন ড্র্যাগ করে সঠিক বাড়ি বেছে নিন'
            : '👆 Tap or drag the green pin to adjust your doorstep'}
        </span>
        <span className="text-white/75 font-mono">
          🍛 {isBn ? 'দোকান' : 'Shop'} • 📍 {isBn ? 'আপনি' : 'You'}
        </span>
      </div>
    </div>
  );
}
