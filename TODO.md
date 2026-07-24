# WILDE Frontend — Outstanding Work

Compiled from a full platform audit (2026-07-24). Items are grouped by priority;
work top to bottom within each group. Each item names the files involved.

## High priority — core value prop / trust

- [ ] **Real AI Prompt generation** — `src/features/ai-assistant/hooks/useAiPrompts.ts`
  always returns a templated sentence, never calls a real model.
  **On hold (2026-07-24): needs a decision on how it should call a model** —
  either wire it to `wilde-backend.onrender.com`'s `/api/ai/generate` (if that
  endpoint actually exists) or add a minimal proxy so an LLM API key is never
  shipped to the browser. Do not put a raw API key in frontend code.
- [ ] **Real payments** — `src/features/marketplace/hooks/useBuyWork.ts` writes a
  `completed` Order directly with no payment provider involved. Used by both
  `MarketplacePage.tsx` and `ReadWorkPage.tsx`. `src/services/payment.service.ts`
  (`initiatePayment`/`verifyPayment`) exists but is never called.
  **On hold (2026-07-24): the backend's Paystack/Flutterwave integration isn't
  built yet.** Needs backend work (provider keys, webhook verification) before
  the frontend can be wired to anything real.
- [x] **Google sign-in never creates a Firestore user profile** — fixed in
  `src/features/auth/hooks/useAuth.ts`: auto-provisions a `Users` doc for any
  non-password provider on first sign-in.
- [x] **Real Profile Analytics** — `src/features/profile/hooks/useProfileDash.ts`
  now aggregates real `viewCount`/`likeCount` across the user's own Works and
  shows the real `totalSales` field, instead of hardcoded numbers.
- [x] **Notifications can't be marked read** — `useNotifications.ts` now scopes
  the query to `where('userId', '==', user.uid)` (previously unscoped — would
  have been rejected by Firestore rules or leaked other users' notifications)
  and adds a real `markAsRead`, wired to a tap handler + unread dot in
  `NotificationsPage.tsx`.
  - **Follow-up found while fixing this**: `firestore.rules` has no `allow create`
    rule for `/Notifications/{notifId}` at all, and no code path in the app
    creates a Notification document anywhere (e.g. on follow, on publish, on
    purchase). The list will stay empty for everyone until both a create rule
    and the actual notification-creation calls are added.

## Medium priority — engagement / retention

- [x] **Nothing ever creates a Notification** — added `allow create` rule on
  `/Notifications/{notifId}` (needs deploy, see below) and real writes on:
  new follower (`useCreatorProfile.ts`), purchase (`useBuyWork.ts`), published
  work → each follower (`useWorkEditor.ts`). Via a shared `features/notifications/notify.ts`.
- [x] **Wire up Streaks** — `useStreaks.ts` now creates the doc on first write
  and computes real day-based streak math (same-day no-op, consecutive-day
  increment, gap resets to 1); `logWrite()` is called from `useWorkEditor.save()`;
  `StreakBadge` now renders on `ProfileDashPage`.
- [x] **Jobs: make reachable + real Apply** — added a briefcase icon on
  `MarketplacePage` linking to `/app/jobs`; `apply()` now writes a real
  `JobApplications` doc (new collection, needs a rules deploy, see below) and
  the button shows "Applied" once you have. Also added a minimal "Post a Job"
  modal since there was no way to create one at all.
- [x] **Collaboration screen is mostly fake** — `addComment` now writes real
  Comments with a live `onSnapshot` listener (see index note below); collaborators
  list is now populated from `work.collaborators`; real `work.content` shown
  instead of fake filler text; removed the permanently-fake "Someone is
  typing…" and "Online" indicators (no presence system exists — better to
  remove than fake it); "Invite" now opens the real `CollaboratorPickerModal`,
  gated to the work's author. Made it reachable: the collaborator row in
  `WritingStudioPage` now links to `/app/collab/:workId`.
  - **Found while fixing this**: the Comments query (`where('postId') + orderBy('createdAt')`)
    needs a Firestore composite index that was never created — this was
    already broken before my changes, just never exercised since comments were
    never created. Fixed by sorting client-side instead of adding another
    required index.
  - **Found while fixing this**: `createdAt` fields are written via
    `serverTimestamp()` (a Firestore `Timestamp` object) but typed as `string`
    and passed straight into `new Date(...)`/`formatTimeAgo` everywhere. Worked
    around it locally for comment sorting; **this is a systemic issue across
    the whole app** (Notifications, Works, Jobs, everything with a
    `createdAt`) and needs its own pass — see new item below.
- [ ] **`createdAt`/`updatedAt` are Firestore Timestamps, not strings** — every
  `User`/`Work`/`Comment`/etc. type declares `createdAt: string`, and
  `formatTimeAgo`/`formatDate` (`src/utils/format.ts`) call `new Date(dateStr)`
  on them directly. A Firestore `Timestamp` object passed to `new Date()`
  produces `Invalid Date`. Likely already silently broken anywhere a
  freshly-created document's timestamp is displayed. Needs either converting
  on read (`.toDate().toISOString()`) or updating the format helpers to accept
  a Timestamp.
- [ ] **Reviews tab** — `src/pages/profile/CreatorProfilePage.tsx` hardcodes
  "No reviews yet"; no review data model or submission flow exists.
- [ ] **Writing Studio rich-text toolbar is decorative** — Bold/Italic/Underline/List/
  Align buttons in `WritingStudioPage.tsx` (`TOOLBAR_BUTTONS`) have no handlers;
  the editor is a plain `<textarea>`.
- [ ] **Dead no-op buttons** — wire up or remove: Home "See all" (`HomePage.tsx`),
  Marketplace "Hire" (`MarketplacePage.tsx`), Creator Profile "Hire"
  (`CreatorProfilePage.tsx`), Profile "This Month ›" (`ProfileDashPage.tsx`),
  Writing Studio "⋮ More options", Collaboration "⋮". (Collaboration's
  "Invite" is now wired — see above.)

## Lower priority — larger features / cleanup

- [ ] **Chapters for long-form works** — `src/features/writing/services/chapter.service.ts`
  and `writingStore.chapters` exist but the editor only ever handles one flat
  `content` string, even though "Long Work" shows a "Chapter 1" label implying more.
- [ ] **Export (PDF/DOCX/EPUB)** — `src/features/premium/services/export.service.ts`
  is built, no button anywhere calls it.
- [ ] **Premium upgrade** — `src/features/premium/hooks/usePremium.ts` calls a real
  payment-initiation endpoint but Settings disables "Premium" as "Coming soon".
- [ ] **Community (Posts/Groups)** — `src/features/community/hooks/usePosts.ts`,
  `useGroups.ts` call a real backend API; no route or nav entry exists at all.
- [ ] **Settings "Coming soon" items** — Writing Reminders, Payment Methods,
  Privacy, Help & Support (`src/pages/settings/SettingsPage.tsx`).
- [ ] **Dedupe Create entry points** — `/app/create` (`CreateMenuPage.tsx`) is
  registered but unreachable; the bottom nav's Create tab opens `CreateMenuModal.tsx`
  instead. Pick one and delete the other.
- [ ] **Toast system unused** — `src/store/slices/uiStore.ts` (`toast`/`showToast`/
  `hideToast`) has no `<Toast>` component subscribing to it; app uses SweetAlert2
  modals instead. Remove or wire up.
- [ ] **Marketplace cart icon is decorative** — `MarketplacePage.tsx` header cart
  icon has no `onClick` and there's no cart page/flow.

## Structural note

The external backend at `wilde-backend.onrender.com` (`src/services/api.service.ts`
and every `*.service.ts` file that wraps it) is not called by any reachable code
path — the whole app runs directly against Firestore. Decide whether payments/AI/
jobs-backend/exports/community should move onto that backend, or whether it should
be retired, before picking up the items above that assume it.
