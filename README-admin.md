# WILDE Admin

An admin panel for wilde-frontend: every content type, users, the market, and an
analytics dashboard. It lives inside this repo at `/admin`, lazy-loaded so the
bundle never reaches ordinary readers.

## Where it lives

Already merged into the app — steps 1–4 below are done, and recorded here only
so the layout is not a surprise:

| | |
| --- | --- |
| `src/features/admin/` | components, hooks, services, store, the content-type registry |
| `src/pages/admin/` | the six screens |
| `src/routes/AdminRoutes.tsx` | route table, mounted in `AppRouter` |
| `src/routes/AdminGuard.tsx` | the gate — alongside `AuthGuard`/`GuestGuard`, not in a `middleware/` folder the repo does not have |

Paths are declared in `ROUTES` (`src/constants/index.ts`) with the rest of the
app's routes. Services import `db` from `@/firebase/config`, which is where this
project's Firebase instance actually lives.

The admin clauses have been merged into the root `firestore.rules`, and the
composite indexes into `firestore.indexes.json`. Note that the `firestore.rules`
originally shipped alongside this panel was **not** the repo's rules plus admin
clauses, as its instructions claimed — it was a shorter, more permissive rewrite
that would have dropped the `authorId` check on `Works` creation and reopened
chapter writes to any signed-in user. Only the additions were taken. If a future
drop of this panel ships a `firestore.rules`, diff it before copying it over.

Deploy the rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

**Grant a role.** Roles are Firebase custom claims. They can only be written
with the Admin SDK, which bypasses Firestore rules — so the first superadmin has
to come from a privileged run, and no rule or client change can substitute for
one. Use `scripts/grant-admin-role.mjs`, from Cloud Shell:

```bash
npm install --no-save firebase-admin
node scripts/grant-admin-role.mjs --apply
```

With no arguments it grants `superadmin` to the project's default admin account,
`fredottache@gmail.com` — the constant at the top of that script. Pass an email
to target someone else, `--role` to grant a lesser one, `--revoke` to take it
back, and `--list` to see who currently holds one. It is a dry run until
`--apply`.

The account must already exist — this grants a role to a user who has signed up,
it does not create one. After any change that user must sign out and back in: a
claim only reaches the client in a newly minted ID token.

**Optional env vars** in `.env`:

```
VITE_ADMIN_DATA_SOURCE=firestore   # or `api` once the backend has /admin routes
```

## Roles

| Role | Can do |
| --- | --- |
| `superadmin` | Everything, including granting roles and issuing refunds |
| `admin` | All content, users, market — no role changes, no refunds |
| `moderator` | Moderate content, suspend users, read the market |
| `analyst` | Read-only across the board, including analytics |

The panel checks permissions to decide what to render. `firestore.rules` checks
the claim to decide what is actually allowed. Only the second one is security —
the first is just there so people aren't shown buttons that will fail.

## What's in it

**Overview** (`/admin`) — headline counts with sparklines, an attention banner
that only appears when something is waiting, and growth charts.

**Analytics** (`/admin/analytics`) — sign-ups, works started, posts, gross
volume, average order value, completion and refund rates, order status
breakdown, and top creators, over 7 / 30 / 90 days.

**Users** (`/admin/users`) — search, suspend and reinstate, set admin roles, and
a per-user activity panel (works, posts, comments, listings, orders, followers)
so you can see what an account has done before acting on it.

**Market** (`/admin/market`) — revenue KPIs and chart, then listings (approve,
reject, pause), orders (resolve disputes, cancel), the payment ledger, and jobs.

**Moderation** (`/admin/moderation`) — flagged posts, flagged comments, listings
awaiting approval and disputed orders, oldest first, each with two-click
resolution.

**Content** (`/admin/c/:type`) — one generic screen serving all 16 collections:
Works, Chapters, Prompts, Posts, Comments, Groups, GroupMembers, Follows,
Listings, Orders, Payments, Jobs, Notifications, Reminders, Streaks and the
audit log. Search, filter, sort, bulk status changes, bulk delete, and a record
editor with inputs matched to each field's type.

## How it's put together

Everything except Users and Analytics is generated from one file:
`config/contentTypes.ts`. A `ContentTypeDef` declares the collection, its
fields, which are columns, which are editable, what statuses exist, and what
row actions moderators get. Add a collection there and it gets a sidebar entry,
a list view, search, filters and an editor — no new components.

The field lists are inferred from `firestore.rules` (`authorId`, `userId`,
`buyerId`, `sellerId`, `posterId`, `createdBy`) plus the shape each feature
implies. Where a real document has different field names, correct them in the
registry and every screen follows.

Data access sits behind `AdminRepository`, with two implementations: Firestore
direct (default, works today) and REST against `wilde-backend` (flip
`VITE_ADMIN_DATA_SOURCE`). Screens don't know which is in use.

Every write goes through `adminData`, which records an entry in `AdminAudit`
first. The rules make that collection append-only, including for superadmins.

Charts are hand-written SVG. The repo has no charting dependency and four chart
shapes don't justify adding ~100kb to a Capacitor app.

## Worth knowing before you ship

**Client-side aggregation has a ceiling.** The analytics screens pull raw
documents for the selected range and bucket them in the browser, capped at 5,000
per collection. That's fine at current volume and honest for a while. Past that,
move to scheduled Cloud Functions writing daily rollups to an `Analytics`
collection and point `analytics.service.ts` at those instead — the interface
won't change.

**Search is prefix-only.** Firestore has no substring operator, so "Half of a"
finds *Half of a Yellow Sun* and "Yellow" doesn't. If that's not good enough,
Algolia or Typesense is the usual next step.

**Suspension and role changes need the backend.** Custom claims can only be set
with the Admin SDK. `services/rest.repository.ts` declares the endpoints
(`POST /admin/users/:uid/role`, `/suspend`, `/reinstate`,
`/payments/:id/refund`, `/notifications/broadcast`) — the panel calls them and
falls back to a status-field write where it safely can, so suspension works
today and gets stronger when those routes land.

**Payments are read-only on purpose.** Refunds move real money and belong to the
payment provider integration in the backend, never to a client write.

**Bulk actions are sequential.** Selecting 200 rows means 200 writes. It keeps
the audit log ordered and stays under Firestore's write limits, but it isn't
instant — the UI stays responsive throughout.
