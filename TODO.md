# WILDE Frontend — Outstanding Work

Compiled from a full platform audit (2026-07-24). Items are grouped by priority;
work top to bottom within each group. Each item names the files involved.

## Performance & polish pass (2026-07-25)

- [x] **Skeleton loaders** — `components/ui/Skeleton.tsx`: a grey-bar primitive
  with a shimmer sweep (hidden under `prefers-reduced-motion`), plus per-surface
  skeletons shaped like the content they replace (work card, creator rail,
  creator grid, list row, notification, profile header, prose). Wired into Home,
  Explore, Marketplace, Jobs, Notifications, Creator Profile, Profile analytics,
  Read and Collaboration. `SkeletonScreen` wraps a set with one polite
  `role="status"` announcement so screen readers hear "Loading X" once instead of
  reading every placeholder. Replaces the bare `IonSpinner`s and the screens that
  previously rendered `null` while loading.
- [x] **Data caching** — React Query was installed and configured but only half
  adopted; `useHomeFeed`, `useExplore`, `useCreatorProfile`, `useCollaboration`,
  `useJobs`, `useReviews` and `ReadWorkPage` all re-fetched from scratch on every
  mount. All are now cached, with `gcTime` raised to 30min and
  `refetchOnWindowFocus` off so returning to a screen renders instantly.
  - **The big win**: `WorkCard`, `AuthorName`, `HireButton`, `CommentAuthor` and
    `ReviewerName` each ran their own uncached `getDocument` per instance — a
    20-card feed by 3 authors fired 20 reads, again on every remount. A shared
    `hooks/useUser.ts` collapses that to one read per distinct user, shared
    app-wide; `CreatorProfilePage` reuses the same cache key, so opening a
    profile from a card is instant. The trending rail primes the cache directly.
  - Explore's search now filters the cached page in memory instead of issuing a
    Firestore read per keystroke, and tab switches keep the previous results on
    screen (`keepPreviousData`) instead of flashing empty.
- [x] **Optimistic rendering** — follow/unfollow (button + follower count),
  notification mark-read and mark-all-read, job apply, review submit, community
  post/like/join-leave, collaborator invite, and paywall unlock after purchase.
  All roll back on failure and surface the failure via toast. Comments were left
  on `onSnapshot`, which already echoes pending writes locally.
- [x] **Icon button tooltips** — `components/ui/Tooltip.tsx` and
  `IconButton.tsx`. Every icon-only button now has a hover/focus label and a
  matching `aria-label` from a single `label` prop, so the two can't drift.
  Gated behind `@media (hover: hover)` so tooltips never stick open after a tap,
  and shown on keyboard focus via `group-focus-within`. `IconButton` also
  supports an unread badge, used for the notification count on Home.
- [x] **Test setup was broken** — Vitest was collecting the Playwright specs in
  `tests/e2e` and had no `globals`, so all 3 files failed and *zero* tests ran
  (pre-existing, verified against a clean tree). Fixed in `vite.config.ts`; the
  7 existing tests now run, alongside 10 new ones covering the `createdAt` fix.

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
- [x] **`createdAt`/`updatedAt` are Firestore Timestamps, not strings** — fixed
  at the read boundary: `getDocument`/`queryDocuments`/`subscribeToQuery` in
  `firestore.helpers.ts` now walk each document through a `normalize()` that
  converts any `Timestamp` to an ISO string, so the declared `createdAt: string`
  types are honest and no caller needs to know the field came from Firestore.
  (Only plain objects/arrays are walked — `GeoPoint`/`DocumentReference` pass
  through untouched.) `format.ts` was hardened as defence in depth: it accepts
  `string | number | Date | Timestamp | null`, and renders a pending
  `serverTimestamp()` (which reads back `null`) as "just now" rather than
  `Invalid Date`. Added `toMillis()` for sorting, replacing the local
  workaround in `useCollaboration`. Covered by `tests/unit/format.test.ts`.
- [x] **Reviews tab** — added a `Reviews` collection (`Review` type in
  `marketplace.types.ts`) gated to buyers with a completed `Order` for that
  creator (`useReviews.ts`); `CreatorProfilePage` now shows a star-rating
  summary, a review list, and a "Leave a review" form when eligible. Needs a
  `firestore.rules` deploy (new `Reviews` collection, create-only, reviewer
  must match `auth.uid` — no server-side purchase re-verification, consistent
  with this app's existing trust level elsewhere).
- [x] **Writing Studio rich-text toolbar is decorative** — replaced the plain
  `<textarea>` with a real `contentEditable`-based editor
  (`src/components/ui/RichTextEditor.tsx`) for `short_story`/`long_work`
  (the two types that show the toolbar); Bold/Italic/Underline/Strikethrough/
  List/Align now apply real formatting via `document.execCommand`. Content
  for those types is now sanitized HTML (`src/utils/richText.ts`, using
  `dompurify` — new dependency) instead of plain text; `ReadWorkPage` and
  `CollaborationPage` render it with `dangerouslySetInnerHTML` after
  sanitizing. The paywall preview truncation in `ReadWorkPage` used to
  `.slice()` the raw string, which would have cut HTML mid-tag — replaced
  with `truncateHtml()`, a DOM-walking truncator that keeps the markup valid.
  Poetry/screenplay/playlet/artwork are untouched (still plain `<textarea>`,
  matching their monospace/plain-text intent).
  - **Known limitation**: uses `document.execCommand`, which is deprecated
    (though still supported by all major browsers). A production-grade
    replacement would move to a maintained editor library (TipTap/Lexical),
    which is a much larger change than this pass warranted.
- [x] **Dead no-op buttons** — Home "See all" now navigates to Explore;
  Marketplace and Creator Profile "Hire" now open a `mailto:` link to the
  provider/creator's email (no messaging system exists to build a real hire
  flow against, so this is the honest option rather than a fake action);
  Profile's "This Month ›" was inaccurate (Analytics isn't month-scoped) so
  it's now a plain "All Time" label; removed Writing Studio's and
  Collaboration's "⋮ More options" (no defined destination — a dead button
  promising a menu that doesn't exist is worse than no button).

## Lower priority — larger features / cleanup

- [x] **Chapters for long-form works** — `long_work` now stores its text as
  `Chapters` documents (`useChapters.ts`) instead of one flat `content` string.
  The Writing Studio shows a chapter strip (select / add / delete, with `order`
  kept contiguous on delete); the editor remounts per chapter and flushes the
  open one before switching, saving, publishing or exporting. `ReadWorkPage`
  stitches chapters back together in order under `<h3>` headings. Works created
  before this seed their first chapter from the existing `content`, so no
  existing draft is stranded. Deleted the dead `chapter.service.ts` (404).
- [x] **Export** — rewritten client-side in `export.service.ts`; the Writing
  Studio header now has an Export button. PDF renders into a hidden iframe and
  opens the print dialog ("Save as PDF") — an iframe rather than `window.open`
  so popup blockers don't eat it; Word downloads an HTML-based `.doc`; plain
  text downloads a flattened `.txt`. Long works export whole, not just the open
  chapter.
  - **EPUB deliberately dropped**: it's a ZIP container with a required
    manifest, which needs a zip dependency to produce something readers will
    actually open. A broken `.epub` is worse than not offering it.
- [ ] **Premium upgrade** — still blocked. `/payments/initiate` returns **404**
  (see structural note); Settings now says "Needs payments" instead of the
  vaguer "Coming soon", and `usePremium.ts` documents why it is unreachable.
  Same blocker as Real payments above.
- [x] **Community (Posts/Groups)** — `usePosts.ts`/`useGroups.ts` rebuilt on
  Firestore (their `/community/*` endpoints 404). New `CommunityPage` at
  `/app/community` with Feed and Groups tabs: post to the feed, like a post,
  create a group, join/leave. Reachable from a Community icon on Home and from
  Settings. Posting, liking and join/leave are all optimistic.
- [x] **Settings "Coming soon" items** — **Help & Support** and **Privacy** are
  now real pages. Help is an accordion FAQ describing how the app actually
  behaves (including that payouts aren't live) plus a support mailto. Privacy is
  a factual account of what is stored and who can see it — deliberately *not* a
  fabricated legal policy, which has to be written and reviewed by the operator.
  The three that can't be honestly built yet now state a specific reason instead
  of a blanket "Coming soon": Premium and Payment Methods say "Needs payments";
  Writing Reminders says "Needs notifications" (no local-notification capability
  is installed, so a stored reminder preference would act on nothing).
  - **Found while writing the Privacy page**: the "Hire" buttons on
    `CreatorProfilePage` and `MarketplacePage` build a `mailto:` from the other
    user's `email` field, so **any signed-in user can read any other user's
    email address**, with no setting to opt out. The page discloses this
    honestly, but it's worth an explicit product decision.
- [x] **Dedupe Create entry points** — deleted the unreachable `CreateMenuPage`
  and its `/app/create` route; the bottom nav's modal is the single entry point.
  The page offered "Upload Artwork" and the modal didn't, so that option was
  folded into the modal first — deleting the page outright would have removed
  the only way to start an artwork. Both copies of the create logic are replaced
  by one `useCreateWork` hook.
- [x] **Toast system unused** — added `<Toast>` (`components/ui/Toast.tsx`),
  mounted once in `App.tsx`, subscribing to `uiStore.toast`. `showToast` now
  carries an incrementing id so an identical repeat message re-opens. Used for
  the failure side of optimistic updates, where the UI has already moved on and
  only needs to say the write didn't stick; SweetAlert2 still handles anything
  needing a decision.
- [x] **Marketplace cart icon is decorative** — removed. There is no cart flow
  and purchases complete straight from the Buy button, so the icon promised
  something that doesn't exist.

## Structural note

The external backend at `wilde-backend.onrender.com` is **live but effectively
empty**: `/api/health` returns `{"status":"ok"}` and every other route probed
(`/api/posts`, `/api/groups`, `/api/export`, `/api/payments/initiate`,
`/api/ai/generate`) returns **404**. Community, Chapters and Export have since
been rebuilt directly on Firestore, matching the rest of the app.

Still importing `api.service.ts` and therefore still dead: `payment.service.ts`,
`marketplace.service.ts`, `jobs.service.ts`, `notifications.service.ts`,
`auth.service.ts`, `usePremium.ts`. These were left in place rather than deleted
because retiring the backend is a product decision — but nothing reachable calls
them, and the endpoints they call do not exist.
