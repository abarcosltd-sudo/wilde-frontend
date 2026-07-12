import React, { useEffect } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  chevronBackOutline, ellipsisHorizontalOutline,
  listOutline, ellipsisVerticalOutline, swapHorizontalOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useWritingStore } from '@/store/slices/writingStore';
import { useWorkEditor } from '@/features/writing/hooks/useWorkEditor';
import Button from '@/components/ui/Button';

const TOOLBAR_BUTTONS = [
  { key: 'bold', label: 'Bold', display: 'B' },
  { key: 'italic', label: 'Italic', display: 'I' },
  { key: 'underline', label: 'Underline', display: 'U' },
  { key: 'list', label: 'Bulleted list', icon: listOutline },
  { key: 'more', label: 'More formatting options', icon: ellipsisVerticalOutline },
  { key: 'align', label: 'Text alignment', icon: swapHorizontalOutline },
] as const;

const WritingStudioPage: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const history = useHistory();
  const { currentWork, updateContent, isDirty } = useWritingStore();
  const { load, save, publish } = useWorkEditor(workId);

  useEffect(() => { load(); }, [workId]);

  return (
    <IonPage>
      <IonContent>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-wilde-border">
            <button onClick={() => history.goBack()}
              aria-label="Go back"
              className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100">
              <IonIcon icon={chevronBackOutline} aria-hidden="true" />
            </button>
            <h2 className="font-bold text-base">{currentWork?.title ?? 'Untitled'}</h2>
            <button aria-label="More options"
              className="min-w-11 min-h-11 flex items-center justify-center text-lg rounded-full active:bg-gray-100">
              <IonIcon icon={ellipsisHorizontalOutline} aria-hidden="true" />
            </button>
          </div>
          <div className="flex gap-2 px-4 py-2 border-b border-wilde-border">
            {TOOLBAR_BUTTONS.map(t => (
              <button key={t.key}
                aria-label={t.label}
                className="min-w-11 min-h-9 flex items-center justify-center text-xs px-2 py-1 border border-wilde-border rounded">
                {'display' in t ? t.display : <IonIcon icon={t.icon} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="flex-1 p-4">
            <h3 className="font-bold text-sm mb-2">Chapter 1</h3>
            <textarea
              className="w-full h-full text-sm leading-relaxed resize-none focus:outline-none"
              placeholder="Begin your story…"
              value={currentWork?.content ?? ''}
              onChange={e => updateContent(e.target.value)} />
          </div>
          <div className="flex gap-2 p-4 border-t border-wilde-border text-center">
            <button onClick={() => save('draft')}
              className="flex-1 border border-wilde-border rounded-md py-2 text-xs font-medium">
              Save Draft
            </button>
            <button className="flex-1 border border-wilde-border rounded-md py-2 text-xs font-medium">
              Collaborate
            </button>
            <button onClick={() => publish()}
              className="flex-1 bg-wilde-black text-white rounded-md py-2 text-xs font-medium">
              Publish
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WritingStudioPage;
