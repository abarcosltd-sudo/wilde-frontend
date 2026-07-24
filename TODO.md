# WILDE Frontend — Outstanding Work

Compiled from a full platform audit (2026-07-24). Items are grouped by priority;
work top to bottom within each group. Each item names the files involved.

## High priority — core value prop / trust

- [ ] **Real AI Prompt generation** — `src/features/ai-assistant/hooks/useAiPrompts.ts`
  always returns a templated sentence, never calls a real model.
- [ ] **Real payments** — `src/features/marketplace/hooks/useBuyWork.ts` writes a
  `completed` Order directly with no payment provider involved. Used by both
  `MarketplacePage.tsx` and `ReadWorkPage.tsx`. `src/services/payment.service.ts`
  (`initiatePayment`/`verifyPayment`) exists but is never called.
- [ ] **Google sign-in never creates a Firestore user profile** —
  `src/firebase/auth.helpers.ts` (`signInWithPopup`) + `src/features/auth/hooks/useAuth.ts`.
  New Google users get a null app-level `user` forever, silently breaking Home,
  Profile, and Onboarding.
- [ ] **Real Profile Analytics** — `src/features/profile/hooks/useProfileDash.ts`
  hardcodes views/engagement/revenue for every user.
- [ ] **Notifications can't be marked read** — `src/features/notifications/services/notifications.service.ts`
  (`markNotificationRead`) is never called; no tap handler in `NotificationsPage.tsx`.

## Medium priority — engagement / retention

- [ ] **Wire up Streaks** — `src/features/streaks/hooks/useStreaks.ts` and
  `src/components/ui/StreakBadge.tsx` are fully built but never rendered anywhere.
- [ ] **Jobs: make reachable + real Apply** — no nav/link anywhere points to `/app/jobs`;
  `useJobs.ts`'s `apply()` is a no-op stub. No "Post a Job" UI exists either.
- [ ] **Collaboration screen is mostly fake** — `src/pages/writing/CollaborationPage.tsx`
  + `src/features/collaboration/hooks/useCollaboration.ts`: `addComment` is a no-op,
  collaborators list never populates, message body and "Someone is typing…" are
  static fake content, no real-time sync. Also unreachable from any UI (Writing
  Studio's "Collaborate" button opens the invite modal instead).
- [ ] **Reviews tab** — `src/pages/profile/CreatorProfilePage.tsx` hardcodes
  "No reviews yet"; no review data model or submission flow exists.
- [ ] **Writing Studio rich-text toolbar is decorative** — Bold/Italic/Underline/List/
  Align buttons in `WritingStudioPage.tsx` (`TOOLBAR_BUTTONS`) have no handlers;
  the editor is a plain `<textarea>`.
- [ ] **Dead no-op buttons** — wire up or remove: Home "See all" (`HomePage.tsx`),
  Marketplace "Hire" (`MarketplacePage.tsx`), Creator Profile "Hire"
  (`CreatorProfilePage.tsx`), Profile "This Month ›" (`ProfileDashPage.tsx`),
  Writing Studio "⋮ More options", Collaboration "Invite" and "⋮".

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
