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

- [x] **Real AI Prompt generation** (2026-07-26) — `useAiPrompts.ts` now calls
  `POST /api/ai/generate` on the local backend, which holds the OpenAI key. The
  backend validates `{workType, topic, prompt}`, builds the system prompt from
  `prompt.templates.ts` (previously dead code — the service inlined its own and
  interpolated the raw enum, asking the model for "a compelling short_story
  prompt"), writes the `Prompts` record server-side and rate-limits per uid.
  History moved to `GET /api/ai/prompts`: the old client query filtered on
  `category` with no `userId`, which the Prompts rule rejects outright.
  - The stored field was renamed `category` → `workType`. Records written by the
    old fake generator keep `category` and no longer appear in history.
  - **Needs a deploy**: two new `Prompts` composite indexes. The Admin SDK
    bypasses rules but still needs indexes.
- [x] **Real payments** (2026-07-26) — `useBuyWork.ts` no longer writes a
  `completed` Order; it calls `POST /api/payments/initiate` and hands off to the
  provider's checkout. The backend resolves the price from the Work / listing
  document (the old endpoint took `amount` from the request body, so any caller
  could set their own price), creates the pending Order, and settles it only on
  signature-verified provider confirmation. Paystack and Flutterwave are both
  wired; `stripe` was removed from the provider enum, having never had a service
  behind it.
  - New `PaymentCallbackPage` at `/app/payment/callback` handles the return leg.
  - **Needs a deploy**: `firestore.rules` no longer allows client `create` on
    `/Orders`. Until that lands, the free-unlock hole stays open.
  - **Not yet exercised against live provider keys** — no test purchase has been
    run end to end.
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
- [x] **Premium upgrade** (2026-07-26) — reachable. New `PremiumPage` at
  `/app/settings/premium` (Settings → Premium is no longer blocked) lists the
  benefits, quotes the price from `GET /api/payments/pricing/premium` so the
  displayed price cannot drift from the charged one, and lets the buyer pick a
  provider. `isPremium` is set by the backend on confirmed payment, never by the
  client.
  - "Payment Methods" is still blocked: providers hold the card details and
    there is no saved-instrument flow, so there is nothing for the screen to
    show yet.
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

## Production verification (2026-07-25)

Firebase was exercised against the real staging project (`wilde-2b0b5`) for the
first time. Three separate layers were broken, none of them app code:

- [x] **Bucket CORS** — uploads failed the preflight with "does not have HTTP ok
  status". `cors.json` is now applied to the bucket. **`firebase deploy` does not
  apply it** — it needs `gcloud storage buckets update` (see README). Verified:
  preflight went 404 → 200.
- [x] **Storage rules were never deployed** — the bucket was still on Firebase's
  default deny rules, so uploads returned `storage/unauthorized` even after CORS
  was fixed. `--only firestore:rules` does not include storage; it needs
  `--only storage`. Verified deployed: paths with `allow read: if true` return
  404 for a missing object, while an unmatched path returns 403.
- [x] **Storage rules were too open** — `/works/{workId}` allowed any signed-in
  user to overwrite any work's cover, any file type, up to 20MB. Now scoped to
  the work's author via `firestore.get()`, images only, 10MB.

End-to-end confirmed: cover uploads succeed and the thumbnail renders on the
timeline.

**Still unverified against production**: the Firestore rules deploy (the
previously-denied writes are liking a post and joining a group), and the new
composite indexes. Everything else in this app has only ever run against mocks.

## Outstanding (audit, 2026-07-26)

Everything below is unbuilt, dead, or undecided — none of it is a regression.
Backend-side counterparts are tracked in `../wilde-backend/TODO.md`.

### Blocking anything else

- [ ] **Payments have never touched a real provider.** Initiate → redirect →
  webhook → fulfilment is verified by typecheck and unit tests only. The webhook
  is what settles a purchase when the buyer closes the tab, and it **cannot be
  exercised locally without a tunnel** (ngrok or similar) pointed at
  `POST /api/payments/webhook/paystack`. Until that has run against Paystack test
  keys, treat payments as unproven rather than done.
- [ ] **Deploy the Firestore rules and indexes.** The marketplace query now
  depends on the `Works {status ASC, price DESC}` composite index — without it
  the Marketplace fails with `FAILED_PRECONDITION` rather than merely showing
  nothing. The `Prompts` indexes and the `Orders`/`Prompts` rule changes are in
  the same deploy: `firebase deploy --only firestore:indexes,firestore:rules`.

### Native shell — blocks notifications

- [ ] **Capacitor is configured but not installed.** `capacitor.config.ts`
  declares the appId and the PushNotifications / LocalNotifications plugins, but
  `package.json` has **no `@capacitor/*` dependency at all**, so `npx cap` won't
  run and there is no native build. The backend's CORS allow-list already admits
  the native origins in anticipation.
- [ ] **Writing Reminders** stays blocked ("Needs notifications") on the above —
  the capability genuinely does not exist, so a stored preference would act on
  nothing. The backend has a `Reminders` collection and a `reminderJob`, but the
  job is never scheduled.

### Stale or dead

- [ ] **"Payment Methods" setting is stale copy.** It still says "Needs
  payments", but payments work. What is actually missing is a saved-card vault —
  and since the provider holds the card and WILDE never sees it, that is a
  provider-side tokenisation flow, not a local feature. Build it or retire the
  row; the current label is now misleading.
- [ ] **Four dead service modules** still import `api.service.ts` and call
  endpoints nothing reaches: `auth.service.ts`, `jobs.service.ts`,
  `marketplace.service.ts`, `notifications.service.ts`. Retiring them is a
  product decision (see Structural note), but nothing reachable calls them.
- [ ] **`quill` is an unused dependency** — zero imports anywhere in `src`. The
  editor is the hand-rolled `RichTextEditor`. Safe to drop.

### Features not started

- [ ] **Messaging.** `HireRequest` is one-directional: the recipient sees a
  notification and replies out of band. No threads, no reply path in-app.
- [ ] **Seller payouts.** Money reaches the platform account and stops there.
  `totalSales` is a counter, not a balance. The Help page states this honestly —
  keep the two in step if it changes.
- [ ] **Search doesn't scale.** Explore filters one cached page in memory. Fine
  at current volume; needs real full-text search before it isn't.
- [ ] **EPUB export** — deliberately dropped, needs a zip dependency to produce
  a container readers will open. A broken `.epub` is worse than not offering it.

## Structural note

The external backend at `wilde-backend.onrender.com` is **live but effectively
empty**: `/api/health` returns `{"status":"ok"}` and every other route probed
(`/api/posts`, `/api/groups`, `/api/export`, `/api/payments/initiate`,
`/api/ai/generate`) returns **404**. Community, Chapters and Export have since
been rebuilt directly on Firestore, matching the rest of the app.

**Update (2026-07-26).** The backend in `../wilde-backend` is now the live
source and runs locally; the Render deployment is stale and still needs
redeploying from it. Its root cause was found: `initFirebase()` was never
called, so every authenticated route returned "Invalid token" even for a valid
one.

The app deliberately stays Firestore-direct for ordinary reads and writes. The
backend owns only what cannot live in a browser because it needs a secret or
server-side trust: **AI generation** and **payments**. `payment.service.ts` and
`usePremium.ts` are now live.

Still importing `api.service.ts` and still dead: `marketplace.service.ts`
(`/market/buy` does not exist server-side), `jobs.service.ts`,
`notifications.service.ts`, `auth.service.ts`. Left in place rather than deleted
because retiring them is a product decision — but nothing reachable calls them.
