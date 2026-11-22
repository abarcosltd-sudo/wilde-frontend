import {
  queryDocuments, deleteDocument, Collections, where,
} from '@/firebase/firestore.helpers';
import { deleteFile, getStoragePath } from '@/firebase/storage.helpers';
import { Chapter, Work } from '@/types';

/** Firebase Storage's error code for a path that holds no file. */
const OBJECT_NOT_FOUND = 'storage/object-not-found';

/**
 * Permanently deletes a draft: its chapters, its cover image, then the work.
 *
 * The order is not cosmetic. The rules authorise a chapter delete and a cover
 * delete by reading the parent `Works` document to see who the author is, so
 * once that document is gone neither can be removed again and they would be
 * orphaned for good. The work goes last, and a failure part-way leaves it in
 * place, so the user can simply try again: every step is safe to repeat.
 *
 * Only drafts. A published work has readers, buyers and orders pointing at it,
 * and removing it needs a decision about those, not a trash button.
 *
 * Not covered: comments left on the draft by collaborators (`Comments` can only
 * be deleted by their own author or by staff) and any Likes rows. Neither
 * exposes the draft's text, and both are tracked in TODO.md.
 */
export const deleteDraft = async (work: Pick<Work, 'id' | 'status'>): Promise<void> => {
  if (work.status !== 'draft') {
    throw new Error('Only drafts can be deleted');
  }

  const chapters = await queryDocuments<Chapter>(Collections.CHAPTERS, [
    where('workId', '==', work.id),
  ]);
  await Promise.all(chapters.map(c => deleteDocument(Collections.CHAPTERS, c.id)));

  try {
    await deleteFile(getStoragePath.workCover(work.id));
  } catch (err) {
    // Most drafts never had a cover; a missing file is the normal case.
    if ((err as { code?: string }).code !== OBJECT_NOT_FOUND) throw err;
  }

  await deleteDocument(Collections.WORKS, work.id);
};
