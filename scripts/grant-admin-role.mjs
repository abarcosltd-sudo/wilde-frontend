/**
 * Grants an admin role for the panel at /admin.
 *
 * Roles are Firebase custom claims. They can only be set with the Admin SDK,
 * which bypasses Firestore rules entirely — so this is the only way to create
 * the first superadmin, and no rule or client change can substitute for it.
 * A `role` field on the Users document is deliberately not trusted by
 * firestore.rules: users can write their own Users document, so honouring it
 * would let anyone promote themselves. This script does not touch Firestore.
 *
 * Dry run by default. Nothing is written without --apply.
 *
 *   node scripts/grant-admin-role.mjs                          # report only
 *   node scripts/grant-admin-role.mjs --apply                  # grant the default
 *   node scripts/grant-admin-role.mjs --apply someone@x.com    # a different account
 *   node scripts/grant-admin-role.mjs --apply someone@x.com --role moderator
 *   node scripts/grant-admin-role.mjs --revoke someone@x.com --apply
 *   node scripts/grant-admin-role.mjs --list                   # who currently holds a role
 *
 * Run it from Google Cloud Shell, where application-default credentials already
 * exist, so no service-account key has to be downloaded:
 *
 *   npm install --no-save firebase-admin
 *   node scripts/grant-admin-role.mjs --apply
 *
 * The account must have signed up first — this grants a role to an existing
 * user, it does not create one. After a change the user must sign out and back
 * in: a claim only reaches the client in a newly minted ID token.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * The account the project treats as its default superadmin. Kept here rather
 * than passed in every time so re-running after an accidental revoke, or on a
 * restored project, lands on the same account instead of whoever ran it.
 */
const DEFAULT_SUPERADMIN = 'fredottache@gmail.com';

const VALID_ROLES = ['superadmin', 'admin', 'moderator', 'analyst'];

const APPLY  = process.argv.includes('--apply');
const LIST   = process.argv.includes('--list');
const REVOKE = process.argv.includes('--revoke');

const flagValue = (name) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

// First bare argument is the email; anything starting with `-` is a flag, and
// the value after --role belongs to that flag.
const roleFlag = flagValue('--role');
const email =
  process.argv.slice(2).find((a, i, all) => !a.startsWith('-') && all[i - 1] !== '--role')
  ?? DEFAULT_SUPERADMIN;
const role = roleFlag ?? 'superadmin';

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? 'wilde-2b0b5';

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const auth = getAuth();

const listStaff = async () => {
  const held = [];
  let pageToken;
  // No way to query users by claim, so this walks the directory. Fine at this
  // scale; if the user count ever makes it slow, keep a roster in Firestore.
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      if (u.customClaims?.role) held.push({ email: u.email, uid: u.uid, role: u.customClaims.role });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  console.log(`Accounts holding a role: ${held.length}`);
  for (const u of held) console.log(`  ${u.role.padEnd(11)} ${u.email ?? '(no email)'}  ${u.uid}`);
  if (held.length === 0) console.log('  (none — nobody can reach /admin yet)');
};

const run = async () => {
  console.log(`Project: ${PROJECT_ID}`);

  if (LIST) return listStaff();

  if (!REVOKE && !VALID_ROLES.includes(role)) {
    throw new Error(`Unknown role "${role}". Expected one of: ${VALID_ROLES.join(', ')}`);
  }

  console.log(`Account: ${email}`);
  console.log(`Action:  ${REVOKE ? 'revoke any role' : `grant "${role}"`}`);
  console.log(APPLY ? 'Mode:    APPLY (the claim will be written)\n' : 'Mode:    dry run (no writes)\n');

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`No account exists for ${email}.`);
      console.error('Sign up in the app with that address first, then re-run this.');
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  const existing = user.customClaims ?? {};
  console.log(`Found:   ${user.displayName ?? 'no display name'}  (${user.uid})`);
  console.log(`Current: ${existing.role ? `role "${existing.role}"` : 'no role'}`);

  if (!REVOKE && existing.role === role) {
    console.log(`\nAlready a ${role}. Nothing to do.`);
    return;
  }
  if (REVOKE && !existing.role) {
    console.log('\nHolds no role. Nothing to do.');
    return;
  }

  if (!APPLY) {
    console.log(`\nDry run only. Re-run with --apply to ${REVOKE ? 'revoke it' : 'write the claim'}.`);
    return;
  }

  /**
   * setCustomUserClaims replaces the whole claims object rather than merging,
   * so the rest of it is carried across explicitly. Dropping an unrelated claim
   * here would silently break whatever else depends on it.
   */
  const next = { ...existing };
  if (REVOKE) delete next.role;
  else next.role = role;

  await auth.setCustomUserClaims(user.uid, next);

  // Read it back rather than trusting the write — this is the only record that
  // the grant actually landed.
  const after = (await auth.getUser(user.uid)).customClaims ?? {};
  if (REVOKE ? after.role : after.role !== role) {
    throw new Error(`Verification failed. Claims now read: ${JSON.stringify(after)}`);
  }

  console.log(`\nDone. ${email} ${REVOKE ? 'no longer holds a role' : `is now a ${role}`}.`);
  console.log('They must sign out and back in — the claim only appears in a fresh token.');
};

run().catch(err => {
  console.error('\nFailed:', err.message ?? err);
  process.exitCode = 1;
});
