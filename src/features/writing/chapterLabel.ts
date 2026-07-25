import { Chapter } from '@/types';

/**
 * Matches the auto-generated titles this app used to store ("Chapter 1",
 * "Chapter 2", …). Those are really a *position*, not a name, so they go stale
 * the moment a chapter is deleted or reordered — delete the middle of three and
 * the remaining two read "Chapter 1" and "Chapter 3".
 */
const AUTO_GENERATED = /^Chapter \d+$/;

/**
 * The label to show for a chapter, derived from its position unless the author
 * gave it a real name.
 *
 * New chapters are stored with an empty title, so position is the only source
 * of truth. Chapters created before that change still carry a stored
 * "Chapter N", which is treated as auto-generated and ignored — that keeps
 * existing works correct without a migration.
 *
 * The trade-off: once chapter renaming exists, someone who deliberately names a
 * chapter "Chapter 7" will see it renumbered. Naming a chapter after a position
 * that the app already derives is the rarer case, and silently-wrong numbering
 * is the worse failure.
 */
export const chapterLabel = (chapter: Pick<Chapter, 'title'>, index: number): string =>
  !chapter.title?.trim() || AUTO_GENERATED.test(chapter.title.trim())
    ? `Chapter ${index + 1}`
    : chapter.title;
