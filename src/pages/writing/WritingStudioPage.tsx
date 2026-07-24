import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonFooter, IonIcon, IonSpinner,
} from '@ionic/react';
import {
  chevronBackOutline,
  listOutline, textOutline, swapHorizontalOutline, imageOutline, sparklesOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useWritingStore } from '@/store/slices/writingStore';
import { useWorkEditor } from '@/features/writing/hooks/useWorkEditor';
import { getDocument, Collections } from '@/firebase/firestore.helpers';
import { uploadFile, getStoragePath } from '@/firebase/storage.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { ROUTES } from '@/constants';
import { User, WorkType } from '@/types';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import RichTextEditor, { RichTextEditorHandle } from '@/components/ui/RichTextEditor';
import CollaboratorPickerModal from '@/features/writing/components/CollaboratorPickerModal';
import AiPromptModal from '@/features/ai-assistant/components/AiPromptModal';
import Swal from '@/utils/swal';

const TOOLBAR_BUTTONS = [
  { key: 'bold', label: 'Bold', display: 'B', command: 'bold' },
  { key: 'italic', label: 'Italic', display: 'I', command: 'italic' },
  { key: 'underline', label: 'Underline', display: 'U', command: 'underline' },
  { key: 'list', label: 'Bulleted list', icon: listOutline, command: 'insertUnorderedList' },
  { key: 'strike', label: 'Strikethrough', icon: textOutline, command: 'strikeThrough' },
] as const;

const ALIGN_COMMANDS = ['justifyLeft', 'justifyCenter', 'justifyRight'] as const;

const TYPE_CONFIG: Record<WorkType, {
  sectionLabel?: string;
  placeholder: string;
  font: string;
  showToolbar: boolean;
}> = {
  short_story: { placeholder: 'Once upon a time…',                             font: 'font-serif',        showToolbar: true  },
  long_work:   { placeholder: 'Begin your story…', sectionLabel: 'Chapter 1',   font: 'font-serif',        showToolbar: true  },
  poetry:      { placeholder: 'Let the words find their own shape…',           font: 'font-serif italic', showToolbar: false },
  screenplay:  { placeholder: 'INT. LOCATION - DAY\n\nAction description…',    font: 'font-mono',         showToolbar: false },
  playlet:     { placeholder: 'ACT 1, SCENE 1\n\nStage direction…',            font: 'font-mono',         showToolbar: false },
  artwork:     { placeholder: 'Describe this piece…',                          font: '',                  showToolbar: false },
};

const WritingStudioPage: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const history = useHistory();
  const { user } = useAuthStore();
  const { currentWork, updateContent, updateTitle, setCoverImage, setCollaborators, isSaving } = useWritingStore();
  const { load, save, publish } = useWorkEditor(workId);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [isAiPromptOpen, setAiPromptOpen] = useState(false);
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<User[]>([]);
  const [isUploadingImage, setUploadingImage] = useState(false);
  const [alignIndex, setAlignIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);

  useEffect(() => { load(); }, [workId]);

  useEffect(() => {
    if (currentWork && user && currentWork.authorId !== user.id) {
      history.replace(ROUTES.READ_WORK.replace(':workId', workId));
    }
  }, [currentWork?.authorId, user?.id]);

  useEffect(() => {
    const ids = currentWork?.collaborators ?? [];
    if (ids.length === 0) { setCollaboratorProfiles([]); return; }
    Promise.all(ids.map(id => getDocument<User>(Collections.USERS, id)))
      .then(profiles => setCollaboratorProfiles(profiles.filter((p): p is User => !!p)));
  }, [currentWork?.collaborators]);

  const type = currentWork?.type ?? 'short_story';
  const config = TYPE_CONFIG[type];

  const handleImagePick = () => fileInputRef.current?.click();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(getStoragePath.workCover(workId), file);
      setCoverImage(url);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveDraft = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Save as draft?',
      text: 'Your changes will be saved privately. You can publish later.',
      showCancelButton: true,
      confirmButtonText: 'Save Draft',
      cancelButtonText: 'Cancel',
    });
    if (result.isConfirmed) await save('draft');
  };

  const handlePublish = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Publish this work?',
      text: 'This will make it visible to everyone on WILDE.',
      showCancelButton: true,
      confirmButtonText: 'Publish',
      cancelButtonText: 'Cancel',
    });
    if (result.isConfirmed) {
      await publish();
      history.push(ROUTES.HOME);
    }
  };

  const handleCollaboratorsSaved = (users: User[]) => {
    setCollaborators(users.map(u => u.id));
    setCollaboratorProfiles(users);
  };

  const handleInsertPrompt = (text: string) => {
    const existing = currentWork?.content ?? '';
    if (config.showToolbar) {
      updateContent(existing + `<div>${text}</div>`);
    } else {
      updateContent(existing ? `${existing}\n\n${text}` : text);
    }
  };

  const handleAlign = () => {
    const nextIndex = (alignIndex + 1) % ALIGN_COMMANDS.length;
    setAlignIndex(nextIndex);
    editorRef.current?.exec(ALIGN_COMMANDS[nextIndex]);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="flex items-center gap-2 px-4 py-2">
            <button onClick={() => history.goBack()}
              aria-label="Go back"
              className="min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full active:bg-gray-100 shrink-0">
              <IonIcon icon={chevronBackOutline} aria-hidden="true" />
            </button>
            <input
              value={currentWork?.title ?? ''}
              onChange={e => updateTitle(e.target.value)}
              aria-label="Work title"
              placeholder="Untitled"
              className="flex-1 min-w-0 text-center font-bold text-base bg-transparent focus:outline-none" />
            <button onClick={() => setAiPromptOpen(true)}
              aria-label="AI Prompt"
              className="min-w-11 min-h-11 flex items-center justify-center text-lg rounded-full active:bg-gray-100 shrink-0">
              <IonIcon icon={sparklesOutline} aria-hidden="true" />
            </button>
          </div>
          {config.showToolbar && (
            <div className="flex gap-2 px-4 py-2 border-t border-wilde-border">
              {TOOLBAR_BUTTONS.map(t => (
                <button key={t.key}
                  onClick={() => editorRef.current?.exec(t.command)}
                  aria-label={t.label}
                  className="min-w-11 min-h-9 flex items-center justify-center text-xs px-2 py-1 border border-wilde-border rounded">
                  {'display' in t ? t.display : <IonIcon icon={t.icon} aria-hidden="true" />}
                </button>
              ))}
              <button onClick={handleAlign}
                aria-label="Text alignment"
                className="min-w-11 min-h-9 flex items-center justify-center text-xs px-2 py-1 border border-wilde-border rounded">
                <IonIcon icon={swapHorizontalOutline} aria-hidden="true" />
              </button>
            </div>
          )}
          {collaboratorProfiles.length > 0 && (
            <button onClick={() => history.push(ROUTES.COLLABORATION.replace(':workId', workId))}
              className="flex items-center gap-1 px-4 py-2 border-t border-wilde-border w-full">
              {collaboratorProfiles.map(u => (
                <Avatar key={u.id} name={u.displayName} src={u.photoURL} size="sm" />
              ))}
              <span className="text-xs text-wilde-muted ml-1">
                {collaboratorProfiles.length} collaborator{collaboratorProfiles.length > 1 ? 's' : ''}
              </span>
            </button>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4 h-full">
          {type === 'artwork' ? (
            <div className="flex flex-col gap-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <button type="button" onClick={handleImagePick}
                disabled={isUploadingImage}
                className="border border-dashed border-wilde-border rounded-lg h-56 flex flex-col items-center justify-center gap-2 text-wilde-muted overflow-hidden">
                {isUploadingImage ? (
                  <IonSpinner name="crescent" />
                ) : currentWork?.coverImageUrl ? (
                  <img src={currentWork.coverImageUrl} alt="Artwork preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <IonIcon icon={imageOutline} aria-hidden="true" className="text-3xl" />
                    <span className="text-sm">Tap to upload artwork</span>
                  </>
                )}
              </button>
              <textarea
                className="w-full text-sm leading-relaxed resize-none focus:outline-none min-h-24"
                placeholder={config.placeholder}
                value={currentWork?.content ?? ''}
                onChange={e => updateContent(e.target.value)} />
            </div>
          ) : config.showToolbar ? (
            <>
              {config.sectionLabel && <h3 className="font-bold text-sm mb-2">{config.sectionLabel}</h3>}
              <RichTextEditor ref={editorRef}
                className={`w-full h-full text-sm leading-relaxed focus:outline-none ${config.font}`}
                placeholder={config.placeholder}
                value={currentWork?.content ?? ''}
                onChange={updateContent} />
            </>
          ) : (
            <textarea
              className={`w-full h-full text-sm leading-relaxed resize-none focus:outline-none ${config.font}`}
              placeholder={config.placeholder}
              value={currentWork?.content ?? ''}
              onChange={e => updateContent(e.target.value)} />
          )}
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="flex gap-2 p-4 text-center">
            <button onClick={handleSaveDraft} disabled={isSaving}
              className="flex-1 border border-wilde-border rounded-md py-2 text-xs font-medium disabled:opacity-50">
              Save Draft
            </button>
            <button onClick={() => setPickerOpen(true)}
              className="flex-1 border border-wilde-border rounded-md py-2 text-xs font-medium">
              Collaborate
            </button>
            <button onClick={handlePublish} disabled={isSaving}
              className="flex-1 bg-wilde-black text-white rounded-md py-2 text-xs font-medium disabled:opacity-50">
              Publish
            </button>
          </div>
        </IonToolbar>
      </IonFooter>

      <CollaboratorPickerModal
        isOpen={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        initialSelectedIds={currentWork?.collaborators ?? []}
        onSave={handleCollaboratorsSaved} />

      <AiPromptModal
        isOpen={isAiPromptOpen}
        onClose={() => setAiPromptOpen(false)}
        workType={type}
        onInsert={handleInsertPrompt} />
    </IonPage>
  );
};

export default WritingStudioPage;
