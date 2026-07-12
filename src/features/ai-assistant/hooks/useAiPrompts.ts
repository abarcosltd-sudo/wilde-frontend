import { useState } from 'react';
import { createDocument, queryDocuments, Collections, orderBy, limit } from '@/firebase/firestore.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useQuery } from '@tanstack/react-query';

interface PromptRecord { id: string; category: string; prompt: string; output: string; createdAt: string; }

export const useAiPrompts = () => {
  const { user } = useAuthStore();
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ['prompts', user?.uid],
    queryFn:  () => queryDocuments<PromptRecord>(Collections.PROMPTS,
      [orderBy('createdAt', 'desc'), limit(10)]),
    enabled: !!user,
  });

  const generate = async (category: string, prompt: string) => {
    setIsGenerating(true);
    // TODO: call backend /api/ai/generate
    const fakeOutput = `The old house stood at the edge of the forest… (${category}: ${prompt})`;
    setOutput(fakeOutput);
    if (user) {
      await createDocument(Collections.PROMPTS, {
        userId: user.uid, category, prompt, output: fakeOutput,
      });
    }
    setIsGenerating(false);
  };

  return { generate, output, history, isGenerating };
};
