import { useState } from 'react';
import { createDocument, queryDocuments, Collections, orderBy, where, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useQuery } from '@tanstack/react-query';
import { WorkType } from '@/types';

interface PromptRecord { id: string; category: WorkType; topic: string; prompt: string; output: string; createdAt: string; }

export const useAiPrompts = (workType: WorkType) => {
  const { user } = useAuthStore();
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ['prompts', user?.uid, workType],
    queryFn:  () => queryDocuments<PromptRecord>(Collections.PROMPTS,
      [where('category', '==', workType), orderBy('createdAt', 'desc'), limit(10)]),
    enabled: !!user,
  });

  const generate = async (topic: string, prompt: string) => {
    setIsGenerating(true);
    // TODO: call backend /api/ai/generate
    const fakeOutput = `The old house stood at the edge of the forest… (${topic}: ${prompt})`;
    setOutput(fakeOutput);
    if (user) {
      await createDocument(Collections.PROMPTS, {
        userId: user.uid, category: workType, topic, prompt, output: fakeOutput,
      });
    }
    setIsGenerating(false);
  };

  return { generate, output, history, isGenerating };
};
