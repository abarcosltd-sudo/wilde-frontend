/**
 * A public handle for someone who signed in with Google and so never typed one.
 *
 * It is built from the display name and the account id and takes no email
 * address as input. It used to be the part of the email before the `@`, which
 * published half of a private address on a world-readable profile.
 *
 * The id fragment keeps two people called "Sam Lee" apart. Nothing else in the
 * app checks usernames for uniqueness, so this is a courtesy, not a guarantee.
 */
const MAX_NAME_PART = 12;
const ID_PART = 5;
const FALLBACK_NAME = 'creative';

export const generateUsername = (displayName: string | null | undefined, uid: string): string => {
  const name = (displayName ?? '')
    // "Zoë" -> "Zoe": split off the accent, then drop it with every other mark.
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, MAX_NAME_PART);

  const id = uid.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, ID_PART);
  return `${name || FALLBACK_NAME}_${id}`;
};
