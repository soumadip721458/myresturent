/**
 * Security Rules Verification Suite (Phase 0 TDD)
 * Validates the 12 "Dirty Dozen" adversarial payloads against firestore.rules.
 *
 * Run with Firebase Emulator Suite:
 *   firebase emulators:exec --only firestore "npx tsx firestore.rules.test.ts"
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  actor: 'anonymous' | 'unverified_email' | 'regular_user' | 'shop_owner' | 'other_shop_owner' | 'developer';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOW';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated shop write is denied',
    actor: 'anonymous',
    operation: 'create',
    path: '/shops/royal-biryani',
    payload: { shopId: 'royal-biryani' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Tenant list / scraping on /shops is denied',
    actor: 'anonymous',
    operation: 'list',
    path: '/shops',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'ID poisoning with invalid characters is denied',
    actor: 'anonymous',
    operation: 'get',
    path: '/shops/invalid$id!with%badchars',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow / ghost field injection on create is denied',
    actor: 'developer',
    operation: 'create',
    path: '/shops/royal-biryani',
    payload: { shopId: 'royal-biryani', isSuperAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unverified developer email spoofing is denied',
    actor: 'unverified_email',
    operation: 'update',
    path: '/shops/royal-biryani',
    payload: { developerControl: { serviceActive: false } },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Shop owner attempting to tamper with developerControl is denied',
    actor: 'shop_owner',
    operation: 'update',
    path: '/shops/royal-biryani',
    payload: {
      developerControl: {
        serviceActive: true,
        subscriptionExpiry: '2099-12-31',
        developerBrandName: 'Hacked',
        developerWhatsapp: '910000000000',
      },
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Regular user self-assigning developer role in /admins is denied',
    actor: 'regular_user',
    operation: 'create',
    path: '/admins/regular_uid',
    payload: { role: 'developer', shopId: '*' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable createdAt tampering on update is denied',
    actor: 'developer',
    operation: 'update',
    path: '/shops/royal-biryani',
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client-forged updatedAt timestamp is denied',
    actor: 'developer',
    operation: 'update',
    path: '/shops/royal-biryani',
    payload: { updatedAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Menu array overflow (>60 items) is denied',
    actor: 'developer',
    operation: 'update',
    path: '/shops/royal-biryani',
    payload: { menuItems: Array.from({ length: 61 }, (_, i) => ({ id: `d-${i}`, name: 'Dish', price: 100 })) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Invalid subscriptionExpiry format is denied',
    actor: 'developer',
    operation: 'update',
    path: '/shops/royal-biryani',
    payload: {
      developerControl: {
        serviceActive: true,
        subscriptionExpiry: 'invalid-date',
        developerBrandName: 'Dev',
        developerWhatsapp: '918649853354',
      },
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Cross-tenant write by another shop owner is denied',
    actor: 'other_shop_owner',
    operation: 'update',
    path: '/shops/royal-biryani',
    payload: { shopConfig: { name: 'Hijacked Shop' } },
    expected: 'PERMISSION_DENIED',
  },
];
