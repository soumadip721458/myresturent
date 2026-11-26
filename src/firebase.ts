import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import provisionedConfig from '../firebase-applet-config.json';
import {
  DEFAULT_DEVELOPER_CONTROL,
  DEFAULT_MENU,
  DEFAULT_SHOP_CONFIG,
  SPIN_SLICES,
} from './data/defaults';
import type {
  CloudOrder,
  CloudOrderItem,
  CloudSyncStatus,
  DeveloperControlConfig,
  Dish,
  OrderStatus,
  ShopConfig,
  ShopTenantDocument,
  SpinSlice,
} from './types';

/**
 * Multi-Tenant SaaS Shop Identifier.
 * Change ONLY this single constant when deploying this codebase for a new restaurant client.
 * All shop settings, menu items, spin offers, and subscription controls sync from `shops/{SHOP_ID}`.
 */
export const SHOP_ID = 'royal-biryani';

/**
 * Custom Firebase Web Config (override these placeholder keys if deploying to your own external Firebase project).
 * While these remain placeholders, the app automatically uses the provisioned `firebase-applet-config.json`
 * (or gracefully falls back to `localStorage` if neither is configured).
 */
export const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID',
};

interface ResolvedFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

function isPlaceholder(value?: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith('YOUR_') ||
    trimmed.includes('remixed-project-id')
  );
}

function resolveActiveFirebaseConfig(): ResolvedFirebaseConfig | null {
  const customReady =
    !isPlaceholder(firebaseConfig.apiKey) &&
    !isPlaceholder(firebaseConfig.projectId) &&
    !isPlaceholder(firebaseConfig.appId);

  if (customReady) {
    return { ...firebaseConfig };
  }

  const prov = provisionedConfig as Partial<ResolvedFirebaseConfig> | undefined;
  if (
    prov &&
    !isPlaceholder(prov.apiKey) &&
    !isPlaceholder(prov.projectId) &&
    !isPlaceholder(prov.appId)
  ) {
    return {
      apiKey: prov.apiKey!,
      authDomain: prov.authDomain || '',
      projectId: prov.projectId!,
      storageBucket: prov.storageBucket || '',
      messagingSenderId: prov.messagingSenderId || '',
      appId: prov.appId!,
      firestoreDatabaseId: prov.firestoreDatabaseId || undefined,
    };
  }

  return null;
}

const activeConfig = resolveActiveFirebaseConfig();

export const isFirebaseConfigured = Boolean(activeConfig);

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;

if (activeConfig) {
  app = initializeApp(activeConfig);
  db = activeConfig.firestoreDatabaseId
    ? getFirestore(app, activeConfig.firestoreDatabaseId)
    : getFirestore(app);
  auth = getAuth(app);
}

// ===============================================================
// Structured Firestore Error Handling
// ===============================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  rethrow = true
): FirestoreErrorInfo {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (rethrow) {
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}

// ===============================================================
// Startup Connection Validation
// ===============================================================
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

// ===============================================================
// Payload Sanitization (strictly matches firebase-blueprint.json & firestore.rules)
// ===============================================================
function sanitizeShopConfig(input: ShopConfig): ShopConfig {
  const numericCharge = Number(input.serviceChargeValue);
  const rawLat = Number(input.shopLat);
  const rawLng = Number(input.shopLng);
  const rawMaxKm = Number(input.maxDeliveryKm);

  const shopLat =
    Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90
      ? Number(rawLat.toFixed(6))
      : DEFAULT_SHOP_CONFIG.shopLat;
  const shopLng =
    Number.isFinite(rawLng) && rawLng >= -180 && rawLng <= 180
      ? Number(rawLng.toFixed(6))
      : DEFAULT_SHOP_CONFIG.shopLng;
  const maxDeliveryKm =
    Number.isFinite(rawMaxKm) && rawMaxKm > 0 && rawMaxKm <= 100
      ? Number(rawMaxKm.toFixed(1))
      : DEFAULT_SHOP_CONFIG.maxDeliveryKm;

  return {
    name: (input.name || DEFAULT_SHOP_CONFIG.name).trim().slice(0, 120),
    address: (input.address || DEFAULT_SHOP_CONFIG.address).trim().slice(0, 240),
    rating: (input.rating || DEFAULT_SHOP_CONFIG.rating).trim().slice(0, 20),
    statusText: (input.statusText || DEFAULT_SHOP_CONFIG.statusText)
      .trim()
      .slice(0, 180),
    whatsappNumber:
      (input.whatsappNumber || '').replace(/\D/g, '').slice(0, 20) ||
      DEFAULT_SHOP_CONFIG.whatsappNumber,
    heroImage: (input.heroImage || DEFAULT_SHOP_CONFIG.heroImage)
      .trim()
      .slice(0, 250000),
    serviceChargeEnabled: Boolean(input.serviceChargeEnabled),
    serviceChargeType:
      input.serviceChargeType === 'flat' ? 'flat' : 'percentage',
    serviceChargeValue:
      Number.isFinite(numericCharge) && numericCharge >= 0
        ? Math.min(500, numericCharge)
        : DEFAULT_SHOP_CONFIG.serviceChargeValue,
    serviceChargeLabel: (
      input.serviceChargeLabel || DEFAULT_SHOP_CONFIG.serviceChargeLabel
    )
      .trim()
      .slice(0, 100),
    deliveryRadiusText: (
      input.deliveryRadiusText || DEFAULT_SHOP_CONFIG.deliveryRadiusText
    )
      .trim()
      .slice(0, 40),
    shopLat,
    shopLng,
    maxDeliveryKm,
  };
}

function sanitizeDeveloperControl(
  input: DeveloperControlConfig
): DeveloperControlConfig {
  const expiryCandidate = (input.subscriptionExpiry || '').trim();
  const validExpiry = /^\d{4}-\d{2}-\d{2}$/.test(expiryCandidate)
    ? expiryCandidate
    : DEFAULT_DEVELOPER_CONTROL.subscriptionExpiry;

  return {
    serviceActive: Boolean(input.serviceActive),
    subscriptionExpiry: validExpiry,
    developerBrandName: (
      input.developerBrandName || DEFAULT_DEVELOPER_CONTROL.developerBrandName
    )
      .trim()
      .slice(0, 80),
    developerWhatsapp:
      (input.developerWhatsapp || '').replace(/\D/g, '').slice(0, 20) ||
      DEFAULT_DEVELOPER_CONTROL.developerWhatsapp,
  };
}

function sanitizeMenuItems(items: Dish[]): Dish[] {
  return items.slice(0, 60).map((d) => {
    const clean: Dish = {
      id: String(d.id || `dish-${Date.now()}`).slice(0, 80),
      name: String(d.name || 'Dish').trim().slice(0, 120),
      category: d.category === 'fastfood' ? 'fastfood' : 'biryani',
      price: Math.max(0, Math.min(100000, Math.round(Number(d.price) || 0))),
      description: String(d.description || '').trim().slice(0, 400),
      image: String(d.image || '').trim().slice(0, 180000),
      badge: d.badge || '',
      inStock: d.inStock !== false,
    };
    if (d.nameEn) clean.nameEn = String(d.nameEn).trim().slice(0, 120);
    if (d.descriptionEn) {
      clean.descriptionEn = String(d.descriptionEn).trim().slice(0, 400);
    }
    if (d.oldPrice && Number.isFinite(d.oldPrice) && d.oldPrice > clean.price) {
      clean.oldPrice = Math.min(100000, Math.round(d.oldPrice));
    }
    return clean;
  });
}

function sanitizeSpinRewards(rewards: SpinSlice[]): SpinSlice[] {
  return rewards.slice(0, 10).map((s) => {
    const clean: SpinSlice = {
      id: s.id,
      wheelLabel: String(s.wheelLabel || '').trim().slice(0, 120) || 'Offer',
      shortTitle: String(s.shortTitle || '').trim().slice(0, 120) || 'Offer',
      fullLabel: String(s.fullLabel || '').trim().slice(0, 140) || 'Offer',
      conditionText: String(s.conditionText || '').trim().slice(0, 160),
      color: String(s.color || '#d90429').slice(0, 32),
      textColor: String(s.textColor || '#ffffff').slice(0, 32),
      weight: Math.max(0, Math.min(100, Math.round(Number(s.weight) || 0))),
    };
    if (s.isJackpot) clean.isJackpot = true;
    return clean;
  });
}

// ===============================================================
// Real-time Multi-Shop Firestore Listener (`shops/{SHOP_ID}`)
// ===============================================================
export function subscribeToShopTenant(
  onUpdate: (data: Partial<ShopTenantDocument>) => void,
  onStatusChange?: (status: CloudSyncStatus) => void
): Unsubscribe {
  if (!db) {
    onStatusChange?.('local-fallback');
    return () => {};
  }

  onStatusChange?.('connecting');
  const shopPath = `shops/${SHOP_ID}`;
  const shopRef = doc(db, 'shops', SHOP_ID);

  return onSnapshot(
    shopRef,
    (snapshot) => {
      onStatusChange?.('synced');
      if (!snapshot.exists()) return;

      const raw = snapshot.data() as Partial<ShopTenantDocument>;
      const parsed: Partial<ShopTenantDocument> = {};

      if (raw.shopConfig && typeof raw.shopConfig === 'object') {
        parsed.shopConfig = {
          ...DEFAULT_SHOP_CONFIG,
          ...raw.shopConfig,
        };
      }
      if (Array.isArray(raw.menuItems) && raw.menuItems.length > 0) {
        parsed.menuItems = (raw.menuItems as Dish[]).map((d) => ({
          ...d,
          inStock: d.inStock !== false,
        }));
      }
      if (Array.isArray(raw.spinRewards) && raw.spinRewards.length > 0) {
        parsed.spinRewards = raw.spinRewards as SpinSlice[];
      }
      if (raw.developerControl && typeof raw.developerControl === 'object') {
        parsed.developerControl = {
          ...DEFAULT_DEVELOPER_CONTROL,
          ...raw.developerControl,
        };
      }

      onUpdate(parsed);
    },
    (error) => {
      onStatusChange?.('error');
      handleFirestoreError(error, OperationType.GET, shopPath, false);
    }
  );
}

export interface CloudWriteResult {
  synced: boolean;
  reason?: 'not_configured' | 'auth_required' | 'permission_denied' | 'failed';
  errorMessage?: string;
}

/**
 * Writes partial or full shop tenant state to Firestore `shops/{SHOP_ID}`.
 * Automatically creates the document on first publish or merges updates cleanly.
 */
export async function syncShopTenantToCloud(
  patch: Partial<{
    shopConfig: ShopConfig;
    menuItems: Dish[];
    spinRewards: SpinSlice[];
    developerControl: DeveloperControlConfig;
  }>,
  fullSnapshot: {
    shopConfig: ShopConfig;
    menuItems: Dish[];
    spinRewards: SpinSlice[];
    developerControl: DeveloperControlConfig;
  }
): Promise<CloudWriteResult> {
  if (!db) {
    return { synced: false, reason: 'not_configured' };
  }

  if (!auth?.currentUser) {
    return { synced: false, reason: 'auth_required' };
  }

  const shopPath = `shops/${SHOP_ID}`;
  const shopRef = doc(db, 'shops', SHOP_ID);

  try {
    const existingSnap = await getDoc(shopRef);

    if (!existingSnap.exists()) {
      const createPayload = {
        shopId: SHOP_ID,
        shopConfig: sanitizeShopConfig(
          patch.shopConfig ?? fullSnapshot.shopConfig ?? DEFAULT_SHOP_CONFIG
        ),
        menuItems: sanitizeMenuItems(
          patch.menuItems ?? fullSnapshot.menuItems ?? DEFAULT_MENU
        ),
        spinRewards: sanitizeSpinRewards(
          patch.spinRewards ?? fullSnapshot.spinRewards ?? SPIN_SLICES
        ),
        developerControl: sanitizeDeveloperControl(
          patch.developerControl ??
            fullSnapshot.developerControl ??
            DEFAULT_DEVELOPER_CONTROL
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(shopRef, createPayload);
      return { synced: true };
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (patch.shopConfig) {
      updatePayload.shopConfig = sanitizeShopConfig(patch.shopConfig);
    }
    if (patch.menuItems) {
      updatePayload.menuItems = sanitizeMenuItems(patch.menuItems);
    }
    if (patch.spinRewards) {
      updatePayload.spinRewards = sanitizeSpinRewards(patch.spinRewards);
    }
    if (patch.developerControl) {
      updatePayload.developerControl = sanitizeDeveloperControl(
        patch.developerControl
      );
    }

    await setDoc(shopRef, updatePayload, { merge: true });
    return { synced: true };
  } catch (error) {
    const info = handleFirestoreError(
      error,
      OperationType.WRITE,
      shopPath,
      false
    );
    const isPerm =
      info.error.toLowerCase().includes('permission') ||
      info.error.toLowerCase().includes('insufficient');
    return {
      synced: false,
      reason: isPerm ? 'permission_denied' : 'failed',
      errorMessage: info.error,
    };
  }
}

// ===============================================================
// Google Auth Helpers for Admin / Developer Cloud Writes
// ===============================================================
export function subscribeAdminAuth(
  callback: (user: User | null) => void
): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogleForAdmin(): Promise<User | null> {
  if (!auth) return null;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

// ===============================================================
// Permanent Tamper-Proof Cloud Order Log (`shops/{SHOP_ID}/orders`)
// ===============================================================
export function generateOrderCode(): string {
  const randomPart = 1000 + Math.floor(Math.random() * 9000);
  return `#ORD-${randomPart}`;
}

export function generateOrderDocId(): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `ord_${Date.now()}_${rand}`;
}

const VALID_MAPS_URL_REGEX =
  /^https:\/\/www\.google\.com\/maps\?q=-?[0-9]+(\.[0-9]+)?,-?[0-9]+(\.[0-9]+)?$/;

function sanitizeOrderItemsForFirestore(items: CloudOrderItem[]) {
  return items.slice(0, 40).map((item) => {
    const clean: Record<string, unknown> = {
      dishId: String(item.dishId || 'dish').slice(0, 80),
      name: String(item.name || 'Item').trim().slice(0, 120),
      qty: Math.max(1, Math.min(99, Math.round(Number(item.qty) || 1))),
      unitPrice: Math.max(
        0,
        Math.min(100000, Math.round(Number(item.unitPrice) || 0))
      ),
      lineTotal: Math.max(
        0,
        Math.min(500000, Math.round(Number(item.lineTotal) || 0))
      ),
    };
    if (item.nameEn) {
      clean.nameEn = String(item.nameEn).trim().slice(0, 120);
    }
    return clean;
  });
}

/**
 * Permanently appends a customer order to Firestore `shops/{SHOP_ID}/orders/{docId}`
 * BEFORE opening WhatsApp, with a short network timeout so checkout stays instant offline.
 */
export async function saveCloudOrderToFirestore(
  order: CloudOrder
): Promise<{ savedToCloud: boolean; errorMessage?: string }> {
  if (!db) {
    return { savedToCloud: false };
  }

  const orderPath = `shops/${SHOP_ID}/orders/${order.docId}`;
  const orderRef = doc(db, 'shops', SHOP_ID, 'orders', order.docId);

  const cleanPhone = order.customerPhone.replace(/\D/g, '').slice(0, 15);
  const safeMapsUrl = VALID_MAPS_URL_REGEX.test(order.googleMapsUrl.trim())
    ? order.googleMapsUrl.trim()
    : '';
  const safeDistance =
    order.distanceKm !== null &&
    Number.isFinite(order.distanceKm) &&
    order.distanceKm >= 0 &&
    order.distanceKm <= 500
      ? Number(order.distanceKm.toFixed(1))
      : -1;

  const payload = {
    orderId: /^#ORD-[0-9]{4,8}$/.test(order.orderId)
      ? order.orderId
      : generateOrderCode(),
    shopId: SHOP_ID,
    timestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
    customerName: (order.customerName || 'Customer').trim().slice(0, 100),
    customerPhone: cleanPhone.length >= 10 ? cleanPhone : '0000000000',
    address: (order.address || 'Address provided').trim().slice(0, 300),
    distanceKm: safeDistance,
    googleMapsUrl: safeMapsUrl,
    items: sanitizeOrderItemsForFirestore(order.items),
    finalTotal: Math.max(
      0,
      Math.min(500000, Math.round(Number(order.finalTotal) || 0))
    ),
    spinReward: (order.spinReward || '').trim().slice(0, 140),
    status: 'Pending' as OrderStatus,
  };

  try {
    const writePromise = setDoc(orderRef, payload);
    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      window.setTimeout(() => resolve('timeout'), 3000);
    });
    const outcome = await Promise.race([
      writePromise.then(() => 'done' as const),
      timeoutPromise,
    ]);
    if (outcome === 'timeout') {
      // Allow background write to finish silently if network recovers
      writePromise.catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, orderPath, false);
      });
      return { savedToCloud: false, errorMessage: 'timeout' };
    }
    return { savedToCloud: true };
  } catch (error) {
    const info = handleFirestoreError(
      error,
      OperationType.CREATE,
      orderPath,
      false
    );
    return { savedToCloud: false, errorMessage: info.error };
  }
}

/**
 * Real-time admin listener for `shops/{SHOP_ID}/orders` (newest first).
 * Must only be attached when an authorized admin/developer user is signed in.
 */
export function subscribeToCloudOrders(
  onOrders: (orders: CloudOrder[]) => void,
  onError?: (errorMessage: string) => void
): Unsubscribe {
  if (!db || !auth?.currentUser) {
    return () => {};
  }

  const ordersPath = `shops/${SHOP_ID}/orders`;
  const ordersQuery = query(
    collection(db, 'shops', SHOP_ID, 'orders'),
    where('shopId', '==', SHOP_ID),
    limit(200)
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const parsed: CloudOrder[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const tsRaw = data.timestamp;
        let timestampMs = Date.now();
        if (tsRaw instanceof Timestamp) {
          timestampMs = tsRaw.toMillis();
        } else if (tsRaw && typeof tsRaw.toMillis === 'function') {
          timestampMs = tsRaw.toMillis();
        } else if (typeof tsRaw === 'number') {
          timestampMs = tsRaw;
        }

        const rawDist = Number(data.distanceKm);
        const distanceKm =
          Number.isFinite(rawDist) && rawDist >= 0 ? rawDist : null;

        const rawStatus = String(data.status || 'Pending');
        const status: OrderStatus =
          rawStatus === 'Confirmed' ||
          rawStatus === 'Delivered' ||
          rawStatus === 'Cancelled'
            ? rawStatus
            : 'Pending';

        return {
          docId: docSnap.id,
          orderId: String(data.orderId || `#ORD-${docSnap.id.slice(-4)}`),
          shopId: String(data.shopId || SHOP_ID),
          timestampMs,
          customerName: String(data.customerName || ''),
          customerPhone: String(data.customerPhone || ''),
          address: String(data.address || ''),
          distanceKm,
          googleMapsUrl: String(data.googleMapsUrl || ''),
          items: Array.isArray(data.items)
            ? (data.items as CloudOrderItem[])
            : [],
          finalTotal: Number(data.finalTotal) || 0,
          spinReward: String(data.spinReward || ''),
          status,
          source: 'cloud',
        };
      });

      parsed.sort((a, b) => b.timestampMs - a.timestampMs);
      onOrders(parsed);
    },
    (error) => {
      const info = handleFirestoreError(
        error,
        OperationType.LIST,
        ordersPath,
        false
      );
      onError?.(info.error);
    }
  );
}

/**
 * Updates only the `status` and `updatedAt` fields on an existing order in Firestore.
 */
export async function updateCloudOrderStatus(
  docId: string,
  status: OrderStatus
): Promise<{ updated: boolean; errorMessage?: string }> {
  if (!db || !auth?.currentUser) {
    return { updated: false, errorMessage: 'auth_required' };
  }

  const orderPath = `shops/${SHOP_ID}/orders/${docId}`;
  const orderRef = doc(db, 'shops', SHOP_ID, 'orders', docId);

  try {
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return { updated: true };
  } catch (error) {
    const info = handleFirestoreError(
      error,
      OperationType.UPDATE,
      orderPath,
      false
    );
    return { updated: false, errorMessage: info.error };
  }
}
