import { generateUsername } from '@/utils/username';

describe('generateUsername', () => {
  const uid = 'aB3xK9mQ2LzP7wRtY1vNcD4eF5gH';

  it('combines the display name with a short id fragment', () => {
    expect(generateUsername('Amara Okafor', uid)).toBe('amaraokafor_ab3xk');
  });

  it('strips accents and punctuation, then applies the 12-character cap', () => {
    expect(generateUsername('Zoë O\'Brien-Núñez', uid)).toBe('zoeobriennun_ab3xk');
  });

  it('caps the name part so handles stay short', () => {
    const handle = generateUsername('Bartholomew Featherstonehaugh', uid);
    expect(handle).toBe('bartholomewf_ab3xk');
    expect(handle.length).toBeLessThanOrEqual(18);
  });

  it('falls back when the name has nothing usable in it', () => {
    expect(generateUsername('李小龍', uid)).toBe('creative_ab3xk');
    expect(generateUsername('!!!', uid)).toBe('creative_ab3xk');
    expect(generateUsername('', uid)).toBe('creative_ab3xk');
    expect(generateUsername(null, uid)).toBe('creative_ab3xk');
    expect(generateUsername(undefined, uid)).toBe('creative_ab3xk');
  });

  it('tells two people with the same name apart by account id', () => {
    expect(generateUsername('Sam Lee', 'AAAAA1xyz')).not.toBe(generateUsername('Sam Lee', 'BBBBB2xyz'));
  });

  it('is stable for the same person', () => {
    expect(generateUsername('Sam Lee', uid)).toBe(generateUsername('Sam Lee', uid));
  });

  it('never produces an @, so it cannot be an email address or local part of one', () => {
    const handles = [
      generateUsername('jane.doe@example.com', uid),
      generateUsername('@jane', uid),
      generateUsername('Jane', 'a@b.c-1234'),
    ];
    for (const h of handles) expect(h).toMatch(/^[a-z0-9]+_[a-z0-9]*$/);
  });
});
