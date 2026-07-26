import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@/services/api.service';
import { useAuthStore } from '@/store/slices/authStore';
import { ApiResponse, WorkType } from '@/types';

export interface PromptRecord {
  id: string;
  workType: WorkType;
  topic: string;
  prompt: string;
  output: string;
  createdAt: string;
}

/**
 * A generation is a full model round-trip, which the shared 15s client default
 * cuts off well before the server gives up (especially on a cold start).
 */
const GENERATE_TIMEOUT_MS = 60_000;

const messageFor = (err: unknown) => {
  const response = (err as AxiosError<{ message?: string }>).response;
  // No response at all — offline, DNS, CORS, or the request timed out.
  if (!response) return "Couldn't reach the AI. Check your connection and try again.";
  return response.data?.message ?? 'Something went wrong generating that. Try again.';
};

/**
 * Generation and history both run through the backend: the model call needs an
 * API key that must never reach the browser, and the Prompts document is
 * written server-side so the saved record can't drift from what was returned.
 *
 * History is read from the API rather than Firestore for the same reason the
 * old direct query failed — the Prompts rule requires a `userId` match, which
 * a client-side list query can't prove.
 */
export const useAiPrompts = (workType: WorkType) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const historyKey = ['prompts', user?.uid, workType];

  const { data: history = [] } = useQuery({
    queryKey: historyKey,
    queryFn: async () => {
      const res = await api.get<ApiResponse<PromptRecord[]>>('/ai/prompts', {
        params: { workType, limit: 10 },
      });
      return res.data.data;
    },
    enabled: !!user,
  });

  const { mutate, isPending: isGenerating } = useMutation({
    mutationFn: async ({ topic, prompt }: { topic: string; prompt: string }) => {
      const res = await api.post<ApiResponse<PromptRecord>>(
        '/ai/generate',
        { workType, topic, prompt },
        { timeout: GENERATE_TIMEOUT_MS },
      );
      return res.data.data;
    },
    onMutate: () => setError(null),
    onSuccess: (record) => {
      setOutput(record.output);
      queryClient.invalidateQueries({ queryKey: historyKey });
    },
    onError: (err) => setError(messageFor(err)),
  });

  const generate = (topic: string, prompt: string) => mutate({ topic, prompt });

  return { generate, output, error, history, isGenerating };
};
