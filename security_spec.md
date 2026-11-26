# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny:** All paths not explicitly matched (`/shops/{shopId}`, `/admins/{userId}`) must deny all read and write access.
2. **No Tenant Scraping:** `allow list` on `/shops` and `/admins` is strictly forbidden; customers may only `get` a specific valid `shopId` document directly.
3. **Zero PII in Public Shop Doc:** `/shops/{shopId}` stores only public restaurant storefront metadata, menu items, spin wheel offers, and SaaS subscription status. Customer names, phone numbers, and delivery addresses are never written to Firestore.
4. **Tiered Role Separation:**
   - **Developer Admin** (verified bootstrapped email `soumdip41@gmail.com` or `/admins/{uid}` with `role == 'developer'`): may create/delete shops, manage `/admins`, and update `shopConfig`, `menuItems`, `spinRewards`, and `developerControl`.
   - **Shop Owner** (`/admins/{uid}` with `role == 'shop_owner'` and matching `shopId`): may ONLY update `shopConfig`, `menuItems`, `spinRewards`, and `updatedAt`. Cannot modify `developerControl`, `shopId`, or `createdAt`.
5. **Temporal & Structural Integrity:**
   - `shopId` must match document ID and regex `^[a-zA-Z0-9_\-]+$` (<= 64 chars).
   - `createdAt` must equal `request.time` on create and remain immutable on update.
   - `updatedAt` must equal `request.time` on both create and update.
   - `menuItems` list bounded to `<= 60` items; `spinRewards` list bounded to `<= 10` items.
   - `developerControl.subscriptionExpiry` must strictly match `^\d{4}-\d{2}-\d{2}$`.
   - Every string field enforces an explicit `.size()` upper bound.
   - No ghost/shadow keys allowed (`keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update).

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Shop Write:** Anonymous user attempts `setDoc('/shops/royal-biryani', { ... })`.
2. **Tenant Enumeration / Scraping:** Anonymous or signed-in user attempts `getDocs('/shops')` (`list`).
3. **ID Poisoning:** Attacker attempts `getDoc('/shops/../../etc/passwd')` or a 200-char ID.
4. **Shadow / Ghost Field Injection:** Admin attempts to create `/shops/royal-biryani` with extra field `isSuperAdmin: true`.
5. **Unverified Email Spoofing:** User with `email: 'soumdip41@gmail.com'` and `email_verified: false` attempts to update `/shops/royal-biryani`.
6. **Privilege Escalation (Shop Owner -> Subscription Bypass):** Shop owner attempts to modify `developerControl.serviceActive` or `developerControl.subscriptionExpiry`.
7. **Self-Assigned Admin Role:** Regular user attempts `setDoc('/admins/{ownUid}', { role: 'developer', shopId: '*' })`.
8. **Immutable Field Tampering:** Admin attempts to change `createdAt` or `shopId` during an update.
9. **Client Timestamp Forgery:** Admin sends a backdated client timestamp for `updatedAt` instead of `serverTimestamp()`.
10. **Denial-of-Wallet Array Overflow:** Admin attempts to write 61 `menuItems` or 11 `spinRewards`.
11. **Value Poisoning on Expiry Date:** Developer writes invalid `developerControl.subscriptionExpiry: "not-a-date"` or a boolean.
12. **Cross-Tenant Write:** Shop owner assigned to `shopId: "other-shop"` attempts to update `/shops/royal-biryani`.
