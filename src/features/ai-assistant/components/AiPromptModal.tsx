import React, { useEffect, useState } from 'react';
import { IonModal, IonContent, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useAiPrompts } from '../hooks/useAiPrompts';
import { PROMPT_TOPICS, PROMPT_PLACEHOLDERS } from '../promptTopics';
import { WorkType } from '@/types';
import Button from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workType: WorkType;
  onInsert: (text: string) => void;
}

const workTypeLabel = (type: WorkType) =>
  type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

const AiPromptModal: React.FC<Props> = ({ isOpen, onClose, workType, onInsert }) => {
  const topics = PROMPT_TOPICS[workType];
  const [topic, setTopic] = useState(topics[0]);
  const [input, setInput] = useState('');
  const { generate, output, history, isGenerating } = useAiPrompts(workType);

  useEffect(() => {
    setTopic(topics[0]);
    setInput('');
  }, [workType]);

  const handleInsert = () => {
    onInsert(output);
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.75} breakpoints={[0, 0.75]}>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose}
            aria-label="Close"
            className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
          <h2 className="font-bold">{workTypeLabel(workType)} AI Prompt</h2>
          <span className="min-w-11" />
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">What do you need help with?</p>
          <div className="flex gap-2 flex-wrap">
            {topics.map(t => (
              <button key={t}
                onClick={() => setTopic(t)}
                className={'text-xs px-3 py-1.5 rounded-full transition-colors ' +
                  (topic === t ? 'bg-wilde-black text-white' : 'border border-wilde-border')}>
                {t}
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
              placeholder={PROMPT_PLACEHOLDERS[workType]}
              className="w-full border border-wilde-border rounded-lg px-3 py-2 text-sm resize-none" />
            <p className="text-right text-xs text-wilde-muted">{input.length}/100</p>
          </div>
          {output && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm leading-relaxed text-gray-700">
              {output}
            </div>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" isLoading={isGenerating}
              onClick={() => generate(topic, input)}>Generate</Button>
            {output && (
              <Button className="flex-1" onClick={handleInsert}>Insert into work</Button>
            )}
          </div>
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
    </IonModal>
  );
};

export default AiPromptModal;
