import { toMillis, DateLike } from '@/utils/format';

/** Matches the Firestore rule, which allows up to 1000; the app stops earlier. */
export const MAX_COMMENT_LENGTH = 500;

/**
 * The text to store for what was typed, or `null` if there is nothing to post.
 * Trimmed; over-long input is refused rather than silently cut, so nobody posts
 * half a sentence by accident.
 */
export const normalizeComment = (raw: string): string | null => {
  const text = raw.trim();
  return text.length > 0 && text.length <= MAX_COMMENT_LENGTH ? text : null;
};

/**
 * Who may remove a comment: whoever wrote it, and the author of the work it is
 * on, who otherwise could not clear abuse from under their own book.
 */
export const canDeleteComment = (
  comment: { authorId: string },
  userId: string | undefined,
  workAuthorId: string | undefined,
): boolean =>
  !!userId && (comment.authorId === userId || workAuthorId === userId);

interface Listable { status?: string; createdAt: DateLike }

/**
 * What a reader sees: moderator-hidden comments removed, newest first. A comment
 * that was just posted has no server timestamp yet (`createdAt` is null) and
 * belongs at the top, not sorted to the bottom as if it were from 1970.
 */
export const visibleComments = <T extends Listable>(comments: T[]): T[] => {
  const age = (c: T) => (c.createdAt == null ? Infinity : toMillis(c.createdAt));
  return comments.filter(c => c.status !== 'hidden').sort((a, b) => age(b) - age(a));
};

/**
 * The count to show. The stored counter is stepped by clients and can lag (a
 * failed step, or a comment posted before the rules allow it), while the loaded
 * list is the truth once it is open, so the larger of the two wins.
 */
export const displayCount = (stored: number | undefined, loaded: number | null): number =>
  Math.max(stored ?? 0, loaded ?? 0);
