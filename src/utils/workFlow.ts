import { ROUTES } from '@/constants';
import type { Work, WorkStatus } from '@/types';

/**
 * Where tapping a work should go.
 *
 * Your own unfinished work opens in the editor, because that is what you do with
 * it. Everything else opens in the reader: someone else's work, and your own
 * once it is published. This used to send authors to the editor for every work
 * of theirs, so a published book could not be read without passing through the
 * editing screen. The reader now carries an Edit button for the author.
 */
export const workRoute = (
  work: Pick<Work, 'id' | 'authorId' | 'status'>,
  userId: string | undefined,
): string => {
  const isOwnerOfUnfinished = !!userId && work.authorId === userId && work.status !== 'published';
  return (isOwnerOfUnfinished ? ROUTES.WRITING_STUDIO : ROUTES.READ_WORK).replace(':workId', work.id);
};

/**
 * The status a plain "save" must write.
 *
 * Saving is not publishing and must never change who can see the work. A live
 * work stays live; anything else stays a draft. The editor's only save used to
 * write `draft` unconditionally, so saving a typo fix on a published book quietly
 * unpublished it. Unpublishing is a separate, confirmed action.
 */
export const saveStatusFor = (current: WorkStatus): 'draft' | 'published' =>
  current === 'published' ? 'published' : 'draft';
