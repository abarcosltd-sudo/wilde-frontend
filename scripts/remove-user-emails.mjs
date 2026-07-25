/**
 * One-off cleanup: removes the `email` field from every document in `Users`.
 *
 * The app stopped writing it (the Users document is world-readable and Firestore
 * rules cannot hide individual fields, so anything stored there is public), but
 * addresses written before that change are still there. Email lives in Firebase
 * Auth, which remains the source of truth — this does not touch Auth, so nobody
 * loses the ability to sign in.
 *
 * Dry run by default. Nothing is written without --apply.
 *
 *   node scripts/remove-user-emails.mjs              # report only
 *   node scripts/remove-user-emails.mjs --apply      # actually delete
 *
 * Run it from Google Cloud Shell, where application-default credentials already
 * exist, so no service-account key has to be downloaded:
 *
 *   npm install --no-save firebase-admin
 *   node scripts/remove-user-emails.mjs
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? 'wilde-2b0b5';

// Firestore caps a batch at 500 writes; stay under it.
const BATCH_SIZE = 400;

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const run = async () => {
  console.log(`Project: ${PROJECT_ID}`);
  console.log(APPLY ? 'Mode:    APPLY (fields will be deleted)\n' : 'Mode:    dry run (no writes)\n');

  const snap = await db.collection('Users').get();
  const withEmail = snap.docs.filter(d => d.get('email') !== undefined);

  console.log(`Users documents:      ${snap.size}`);
  console.log(`Carrying an email:    ${withEmail.length}`);

  if (withEmail.length === 0) {
    console.log('\nNothing to do.');
    return;
  }

  // Shown so the run can be sanity-checked before anything is deleted. Only the
  // domain is printed — the point of this script is to stop leaking addresses.
  console.log('\nAffected documents:');
  for (const doc of withEmail.slice(0, 10)) {
    const domain = String(doc.get('email')).split('@')[1] ?? '?';
    console.log(`  ${doc.id}  (${doc.get('displayName') ?? 'no name'}, @${domain})`);
  }
  if (withEmail.length > 10) console.log(`  … and ${withEmail.length - 10} more`);

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to delete the field.');
    return;
  }

  let done = 0;
  for (let i = 0; i < withEmail.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of withEmail.slice(i, i + BATCH_SIZE)) {
      // Deletes the single field, leaving the rest of the profile untouched.
      batch.update(doc.ref, { email: FieldValue.delete() });
    }
    await batch.commit();
    done += Math.min(BATCH_SIZE, withEmail.length - i);
    console.log(`  committed ${done}/${withEmail.length}`);
  }

  console.log(`\nDone. Removed the email field from ${done} document(s).`);
  console.log('Sign-in is unaffected — Firebase Auth still holds every address.');
};

run().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
