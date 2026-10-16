import {
  bookOutline, readerOutline, pencilOutline, colorPaletteOutline,
  filmOutline, ticketOutline,
} from 'ionicons/icons';
import { WorkType } from '@/types';

/**
 * How each kind of work looks wherever it is named: a tag, a tile, a cover
 * placeholder. One hue per format, always paired with an icon and a label so
 * colour is never the only signal.
 *
 * Tailwind only generates classes it can find as whole strings, so the class
 * names are spelled out rather than assembled from a hue name.
 */
export interface FormatInfo {
  label: string;
  /** The singular noun for a call to action: "Read the full poem". */
  noun: string;
  icon: string;
  /** Foreground: text and icons. */
  text: string;
  /** Tint: chip and tile backgrounds. */
  tint: string;
  /** Solid fill, for a thin accent bar or a dot. */
  solid: string;
}

const BOOK:    Pick<FormatInfo, 'text' | 'tint' | 'solid'> = { text: 'text-fmt-book',    tint: 'bg-fmt-book-bg',    solid: 'bg-fmt-book' };
const ARTWORK: Pick<FormatInfo, 'text' | 'tint' | 'solid'> = { text: 'text-fmt-artwork', tint: 'bg-fmt-artwork-bg', solid: 'bg-fmt-artwork' };
const POEM:    Pick<FormatInfo, 'text' | 'tint' | 'solid'> = { text: 'text-fmt-poem',    tint: 'bg-fmt-poem-bg',    solid: 'bg-fmt-poem' };
const STAGE:   Pick<FormatInfo, 'text' | 'tint' | 'solid'> = { text: 'text-fmt-stage',   tint: 'bg-fmt-stage-bg',   solid: 'bg-fmt-stage' };

export const FORMATS: Record<WorkType, FormatInfo> = {
  short_story: { label: 'Story',      noun: 'story',      icon: readerOutline,       ...BOOK },
  long_work:   { label: 'Book',       noun: 'book',       icon: bookOutline,         ...BOOK },
  poetry:      { label: 'Poem',       noun: 'poem',       icon: pencilOutline,       ...POEM },
  artwork:     { label: 'Artwork',    noun: 'artwork',    icon: colorPaletteOutline, ...ARTWORK },
  screenplay:  { label: 'Screenplay', noun: 'screenplay', icon: filmOutline,         ...STAGE },
  playlet:     { label: 'Play',       noun: 'play',       icon: ticketOutline,       ...STAGE },
};

/** The filter chips on Home. `types: null` means no filtering. */
export const FORMAT_FILTERS: { id: string; label: string; types: WorkType[] | null }[] = [
  { id: 'all',    label: 'All',    types: null },
  { id: 'books',  label: 'Books',  types: ['long_work', 'short_story'] },
  { id: 'art',    label: 'Art',    types: ['artwork'] },
  { id: 'poetry', label: 'Poetry', types: ['poetry'] },
  { id: 'stage',  label: 'Stage',  types: ['screenplay', 'playlet'] },
];
