import { WorkType } from '@/types';

export const PROMPT_TOPICS: Record<WorkType, string[]> = {
  poetry:      ['Imagery', 'Emotion', 'Metaphor', 'Form', 'Rhythm'],
  screenplay:  ['Scene', 'Dialogue', 'Character', 'Conflict', 'Twist'],
  playlet:     ['Scene', 'Dialogue', 'Stage Direction', 'Conflict'],
  long_work:   ['Plot', 'Character', 'World', 'Chapter Hook', 'Twist'],
  short_story: ['Story', 'Character', 'Plot', 'Dialogue', 'Scene'],
  artwork:     ['Concept', 'Mood', 'Composition', 'Color'],
};

export const PROMPT_PLACEHOLDERS: Record<WorkType, string> = {
  poetry:      'A quiet grief that blooms like a flower…',
  screenplay:  'A tense standoff in a diner at midnight…',
  playlet:     'Two strangers stuck in an elevator…',
  long_work:   'A kingdom on the brink of a forgotten war…',
  short_story: 'A mysterious house in the forest with a secret…',
  artwork:     'A city skyline dissolving into watercolor…',
};
