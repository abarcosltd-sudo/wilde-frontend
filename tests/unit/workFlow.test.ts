import { workRoute, saveStatusFor } from '@/utils/workFlow';

const work = (over: object = {}) => ({ id: 'w1', authorId: 'me', status: 'draft' as const, ...over });

describe('workRoute', () => {
  it('opens your own draft in the editor', () => {
    expect(workRoute(work(), 'me')).toBe('/app/write/w1');
  });

  it('opens your own published work in the reader, not the editor', () => {
    expect(workRoute(work({ status: 'published' }), 'me')).toBe('/app/read/w1');
  });

  it('opens an archived work of yours in the editor, so it can be fixed or republished', () => {
    expect(workRoute(work({ status: 'archived' }), 'me')).toBe('/app/write/w1');
  });

  it('opens someone else\'s work in the reader, whatever its status', () => {
    expect(workRoute(work({ authorId: 'them', status: 'published' }), 'me')).toBe('/app/read/w1');
    expect(workRoute(work({ authorId: 'them', status: 'draft' }), 'me')).toBe('/app/read/w1');
  });

  it('opens the reader when nobody is signed in, never the editor', () => {
    expect(workRoute(work(), undefined)).toBe('/app/read/w1');
  });
});

describe('saveStatusFor', () => {
  it('keeps a published work published, so saving never unpublishes it', () => {
    expect(saveStatusFor('published')).toBe('published');
  });

  it('keeps drafts as drafts', () => {
    expect(saveStatusFor('draft')).toBe('draft');
  });

  it('turns an archived work back into a draft, as saving it always did', () => {
    expect(saveStatusFor('archived')).toBe('draft');
  });
});
