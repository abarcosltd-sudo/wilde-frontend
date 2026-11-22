import {
  normalizeComment, canDeleteComment, visibleComments, displayCount, MAX_COMMENT_LENGTH,
} from '@/features/comments/commentRules';

describe('normalizeComment', () => {
  it('trims what was typed', () => {
    expect(normalizeComment('  lovely ending \n')).toBe('lovely ending');
  });

  it('refuses empty and whitespace-only input', () => {
    expect(normalizeComment('')).toBeNull();
    expect(normalizeComment('   \n\t ')).toBeNull();
  });

  it('accepts exactly the limit and refuses one over, rather than cutting it', () => {
    expect(normalizeComment('a'.repeat(MAX_COMMENT_LENGTH))).toHaveLength(MAX_COMMENT_LENGTH);
    expect(normalizeComment('a'.repeat(MAX_COMMENT_LENGTH + 1))).toBeNull();
  });

  it('counts the limit after trimming, not before', () => {
    expect(normalizeComment(' ' + 'a'.repeat(MAX_COMMENT_LENGTH) + ' ')).not.toBeNull();
  });
});

describe('canDeleteComment', () => {
  const comment = { authorId: 'reader' };

  it('lets people delete their own comment', () => {
    expect(canDeleteComment(comment, 'reader', 'author')).toBe(true);
  });

  it('lets the work\'s author clear comments under their own work', () => {
    expect(canDeleteComment(comment, 'author', 'author')).toBe(true);
  });

  it('does not let anyone else delete it', () => {
    expect(canDeleteComment(comment, 'stranger', 'author')).toBe(false);
  });

  it('allows nothing when nobody is signed in, even if ids are unknown', () => {
    expect(canDeleteComment(comment, undefined, 'author')).toBe(false);
    expect(canDeleteComment(comment, undefined, undefined)).toBe(false);
  });

  it('does not treat an unknown work author as a match for an unknown user', () => {
    expect(canDeleteComment(comment, undefined, undefined)).toBe(false);
  });
});

describe('visibleComments', () => {
  const at = (h: number) => new Date(Date.UTC(2026, 10, 1, h)).toISOString();

  it('puts the newest first', () => {
    const out = visibleComments([
      { id: 'old', createdAt: at(1) }, { id: 'new', createdAt: at(9) }, { id: 'mid', createdAt: at(5) },
    ]);
    expect(out.map(c => c.id)).toEqual(['new', 'mid', 'old']);
  });

  it('removes comments a moderator has hidden, but keeps flagged and unmarked ones', () => {
    const out = visibleComments([
      { id: 'a', status: 'hidden', createdAt: at(1) },
      { id: 'b', status: 'flagged', createdAt: at(2) },
      { id: 'c', status: 'visible', createdAt: at(3) },
      { id: 'd', createdAt: at(4) },
    ]);
    expect(out.map(c => c.id).sort()).toEqual(['b', 'c', 'd']);
  });

  it('keeps a just-posted comment (no server timestamp yet) at the top', () => {
    const out = visibleComments([
      { id: 'old', createdAt: at(1) }, { id: 'pending', createdAt: null }, { id: 'new', createdAt: at(9) },
    ]);
    expect(out[0].id).toBe('pending');
  });

  it('does not mutate the list it was given', () => {
    const input = [{ id: 'a', createdAt: at(1) }, { id: 'b', createdAt: at(2) }];
    visibleComments(input);
    expect(input.map(c => c.id)).toEqual(['a', 'b']);
  });
});

describe('displayCount', () => {
  it('uses the stored counter when nothing is loaded', () => {
    expect(displayCount(7, null)).toBe(7);
  });

  it('trusts the loaded list when the counter has fallen behind', () => {
    expect(displayCount(0, 3)).toBe(3);
    expect(displayCount(undefined, 2)).toBe(2);
  });

  it('is zero for a work with no comments and no counter', () => {
    expect(displayCount(undefined, null)).toBe(0);
  });
});
