import { chapterLabel } from '@/features/writing/chapterLabel';

/**
 * Regression cover for chapter numbering going stale. Titles used to be stored
 * as "Chapter 1", "Chapter 2", … — a position masquerading as a name — so
 * deleting the middle of three left the survivors reading "Chapter 1" and
 * "Chapter 3".
 */
describe('chapterLabel', () => {
  it('numbers an untitled chapter by its position', () => {
    expect(chapterLabel({ title: '' }, 0)).toBe('Chapter 1');
    expect(chapterLabel({ title: '' }, 2)).toBe('Chapter 3');
  });

  it('treats whitespace as untitled', () => {
    expect(chapterLabel({ title: '   ' }, 1)).toBe('Chapter 2');
  });

  it('ignores a stored auto-generated title, so legacy data renumbers too', () => {
    // Written before titles stopped carrying the position.
    expect(chapterLabel({ title: 'Chapter 3' }, 1)).toBe('Chapter 2');
  });

  it('keeps a real title the author chose', () => {
    expect(chapterLabel({ title: 'The Harmattan Arrives' }, 4)).toBe('The Harmattan Arrives');
  });

  it('keeps a title that merely starts with the word Chapter', () => {
    expect(chapterLabel({ title: 'Chapter of Accidents' }, 0)).toBe('Chapter of Accidents');
  });

  it('renumbers correctly after a middle chapter is removed', () => {
    // Three auto-titled chapters, the second deleted. Previously "Chapter 1",
    // "Chapter 3"; the remaining pair must read 1 and 2.
    const remaining = [{ title: 'Chapter 1' }, { title: 'Chapter 3' }];
    expect(remaining.map(chapterLabel)).toEqual(['Chapter 1', 'Chapter 2']);
  });
});
