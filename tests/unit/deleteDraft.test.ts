import { vi } from 'vitest';

// The module under test talks to Firebase through these two modules only, so
// replacing them tests the sequencing without touching the network.
const calls: string[] = [];

vi.mock('@/firebase/firestore.helpers', () => ({
  Collections: { WORKS: 'Works', CHAPTERS: 'Chapters' },
  where: (...args: unknown[]) => args,
  queryDocuments: vi.fn(async () => [{ id: 'c1' }, { id: 'c2' }]),
  deleteDocument: vi.fn(async (col: string, id: string) => { calls.push(`delete ${col}/${id}`); }),
}));

vi.mock('@/firebase/storage.helpers', () => ({
  getStoragePath: { workCover: (id: string) => `works/${id}/cover.jpg` },
  deleteFile: vi.fn(async (path: string) => { calls.push(`delete file ${path}`); }),
}));

import { deleteDraft } from '@/features/writing/services/deleteDraft';
import { queryDocuments } from '@/firebase/firestore.helpers';
import { deleteFile } from '@/firebase/storage.helpers';

const draft = { id: 'w1', status: 'draft' as const };

beforeEach(() => {
  calls.length = 0;
  vi.mocked(deleteFile).mockClear();
  vi.mocked(queryDocuments).mockClear();
});

describe('deleteDraft', () => {
  it('removes the work last, after its chapters and cover', async () => {
    await deleteDraft(draft);
    const work = calls.indexOf('delete Works/w1');
    expect(work).toBe(calls.length - 1);
    expect(calls).toContain('delete Chapters/c1');
    expect(calls).toContain('delete Chapters/c2');
    expect(calls).toContain('delete file works/w1/cover.jpg');
  });

  it('refuses anything that is not a draft, and touches nothing', async () => {
    await expect(deleteDraft({ id: 'w1', status: 'published' })).rejects.toThrow('Only drafts');
    await expect(deleteDraft({ id: 'w1', status: 'archived' })).rejects.toThrow('Only drafts');
    expect(calls).toEqual([]);
    expect(queryDocuments).not.toHaveBeenCalled();
  });

  it('treats a draft with no cover file as normal', async () => {
    vi.mocked(deleteFile).mockRejectedValueOnce({ code: 'storage/object-not-found' });
    await deleteDraft(draft);
    expect(calls).toContain('delete Works/w1');
  });

  it('keeps the work if the cover cannot be removed, so the user can retry', async () => {
    vi.mocked(deleteFile).mockRejectedValueOnce({ code: 'storage/unauthorized' });
    await expect(deleteDraft(draft)).rejects.toMatchObject({ code: 'storage/unauthorized' });
    expect(calls).not.toContain('delete Works/w1');
  });

  it('works for a draft with no chapters', async () => {
    vi.mocked(queryDocuments).mockResolvedValueOnce([]);
    await deleteDraft(draft);
    expect(calls).toEqual(['delete file works/w1/cover.jpg', 'delete Works/w1']);
  });
});
