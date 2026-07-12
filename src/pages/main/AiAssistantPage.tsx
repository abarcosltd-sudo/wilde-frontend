import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useAiPrompts } from '@/features/ai-assistant/hooks/useAiPrompts';
import Button from '@/components/ui/Button';

const CATEGORIES = ['Story', 'Character', 'Plot', 'Dialogue', 'Scene'];

const AiAssistantPage: React.FC = () => {
  const [category, setCategory] = useState('Story');
  const [input, setInput] = useState('');
  const { generate, output, history, isGenerating } = useAiPrompts();

  return (
    <IonPage>
      <IonContent>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black">WILDE AI</h1>
          </div>
          <p className="text-sm font-semibold">What are you creating?</p>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat}
                onClick={() => setCategory(cat)}
                className={'text-xs px-3 py-1.5 rounded-full transition-colors ' +
                  (category === cat ? 'bg-wilde-black text-white' : 'border border-wilde-border')}>
                {cat}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-wilde-muted mb-1 block">Prompt</label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={100}
              rows={3}
              placeholder="A mysterious house in the forest with a secret…"
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm resize-none" />
            <p className="text-right text-xs text-wilde-muted">{input.length}/100</p>
          </div>
          <Button expand="block" isLoading={isGenerating}
            onClick={() => generate(category, input)}>Generate</Button>
          {output && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm leading-relaxed text-gray-700">
              {output}
            </div>
          )}
          {history.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-wilde-muted mb-2">History</h3>
              {history.map((h, i) => (
                <div key={i} className="text-xs text-gray-500 border-b border-wilde-border py-2">
                  {h.prompt}
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AiAssistantPage;
