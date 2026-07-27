import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonFooter, IonIcon,
} from '@ionic/react';
import {
  chevronBackOutline, listOutline, textOutline, swapHorizontalOutline,
  sparklesOutline, addOutline, trashOutline, downloadOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useWritingStore } from '@/store/slices/writingStore';
import { useWorkEditor, PublishPricing } from '@/features/writing/hooks/useWorkEditor';
import { useChapters } from '@/features/writing/hooks/useChapters';
import { chapterLabel } from '@/features/writing/chapterLabel';
import { getStoragePath } from '@/firebase/storage.helpers';
import { useAuthStore } from '@/store/slices/authStore';
import { useUsers } from '@/hooks/useUser';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ROUTES } from '@/constants';
import { User, WorkType } from '@/types';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import Tooltip from '@/components/ui/Tooltip';
import RichTextEditor, { RichTextEditorHandle } from '@/components/ui/RichTextEditor';
import UploadDropzone from '@/components/ui/UploadDropzone';
import CollaboratorPickerModal from '@/features/writing/components/CollaboratorPickerModal';
import PublishModal from '@/features/writing/components/PublishModal';
import AiPromptModal from '@/features/ai-assistant/components/AiPromptModal';
import { exportWork, EXPORT_FORMATS, ExportFormat } from '@/features/premium/services/export.service';
import { escapeHtml, formatBytes } from '@/utils';
import Swal from '@/utils/swal';

const TOOLBAR_BUTTONS = [
  { key: 'bold', label: 'Bold', display: 'B', command: 'bold' },
  { key: 'italic', label: 'Italic', display: 'I', command: 'italic' },
  { key: 'underline', label: 'Underline', display: 'U', command: 'underline' },
  { key: 'list', label: 'Bulleted list', icon: listOutline, command: 'insertUnorderedList' },
  { key: 'strike', label: 'Strikethrough', icon: textOutline, command: 'strikeThrough' },
] as const;

const ALIGN_COMMANDS = ['justifyLeft', 'justifyCenter', 'justifyRight'] as const;

// One button cycles through the three alignments, so its label has to name the
// alignment currently applied rather than a fixed "Text alignment".
const ALIGN_LABELS = ['Aligned left', 'Aligned centre', 'Aligned right'] as const;

/**
 * Storage rules cap uploads under `works/{workId}` at 20MB and don't restrict
 * content type, so both limits are enforced here too — a 19MB bitmap would be
 * accepted by the server but is a poor thumbnail and a slow feed.
 */
const COVER_MAX_BYTES = 5 * 1024 * 1024;

const TOOLBAR_BUTTON_CLASS =
  'min-w-11 min-h-9 flex items-center justify-center text-xs px-2 py-1 border border-wilde-border ' +
  'rounded transition-colors active:bg-wilde-subtle focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-wilde-black';

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
  const [isPublishOpen, setPublishOpen] = useState(false);
  const [isAiPromptOpen, setAiPromptOpen] = useState(false);
  const [alignIndex, setAlignIndex] = useState(0);
  const editorRef = useRef<RichTextEditorHandle>(null);

  useEffect(() => { load(); }, [workId]);

  useEffect(() => {
    if (currentWork && user && currentWork.authorId !== user.id) {
      history.replace(ROUTES.READ_WORK.replace(':workId', workId));
    }
  }, [currentWork?.authorId, user?.id]);

  // Served from the shared user cache, so the avatars are already warm if these
  // collaborators appeared anywhere else the user has been.
  const { users: collaboratorProfiles } = useUsers(currentWork?.collaborators ?? []);

  const type = currentWork?.type ?? 'short_story';
  const config = TYPE_CONFIG[type];
  const hasCover = !!currentWork?.coverImageUrl;

  // Long works keep their text in Chapter documents; every other type keeps a
  // single flat `content` string on the Work itself.
  const isLongWork = type === 'long_work';
  const { chapters, addChapter, saveChapter, removeChapter } =
    useChapters(workId, isLongWork, currentWork?.content);

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [chapterDraft, setChapterDraft] = useState('');

  const activeChapter = chapters.find(c => c.id === activeChapterId) ?? chapters[0] ?? null;

  useEffect(() => {
    if (activeChapter && activeChapter.id !== activeChapterId) setActiveChapterId(activeChapter.id);
  }, [activeChapter?.id]);

  // Reload the editor buffer whenever the selected chapter changes.
  useEffect(() => { setChapterDraft(activeChapter?.content ?? ''); }, [activeChapter?.id]);

  /** Flushes the open chapter before moving away from it, so edits aren't lost. */
  const flushActiveChapter = async () => {
    if (!isLongWork || !activeChapter || chapterDraft === activeChapter.content) return;
    await saveChapter(activeChapter.id, { content: chapterDraft });
  };

  const handleSelectChapter = async (chapterId: string) => {
    if (chapterId === activeChapter?.id) return;
    await flushActiveChapter();
    setActiveChapterId(chapterId);
  };

  const handleAddChapter = async () => {
    await flushActiveChapter();
    const id = await addChapter(undefined);
    setActiveChapterId(id);
    setChapterDraft('');
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this chapter?',
      text: 'Its text will be permanently removed.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    removeChapter(chapterId);
    if (chapterId === activeChapter?.id) setActiveChapterId(null);
  };

  const editorValue = isLongWork ? chapterDraft : (currentWork?.content ?? '');
  const handleEditorChange = isLongWork ? setChapterDraft : updateContent;

  const handleExport = async () => {
    const { value: format } = await Swal.fire({
      icon: 'question',
      title: 'Export this work',
      input: 'select',
      inputOptions: Object.fromEntries(EXPORT_FORMATS.map(f => [f.value, f.label])),
      inputValue: 'pdf',
      showCancelButton: true,
      confirmButtonText: 'Export',
      cancelButtonText: 'Cancel',
    });
    if (!format) return;

    await flushActiveChapter();
    // A long work is exported whole, not just the chapter currently open.
    const body = isLongWork
      ? chapters
          .map((c, i) => `<h3>${escapeHtml(chapterLabel(c, i))}</h3>${
            c.id === activeChapter?.id ? chapterDraft : (c.content ?? '')}`)
          .join('')
      : (currentWork?.content ?? '');

    await exportWork(currentWork?.title || 'Untitled', body, format as ExportFormat);
  };

  /**
   * Validation, preview, byte progress and retry all live in the hook, so the
   * page only has to say where the file goes and what to do with the URL.
   *
   * Failures stay inside the drop target rather than going out as a toast: a
   * toast that has already faded leaves nothing to retry from.
   */
  const coverUpload = useFileUpload({
    path: () => getStoragePath.workCover(workId),
    maxBytes: COVER_MAX_BYTES,
    onUploaded: url => setCoverImage(url),
  });

  const handleRemoveCover = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Remove this cover image?',
      text: 'The work will fall back to a placeholder on the timeline.',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
    });
    if (result.isConfirmed) {
      setCoverImage('');
      // Clears the local preview too, which would otherwise keep showing the
      // image the user just removed.
      coverUpload.reset();
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
    if (result.isConfirmed) {
      await flushActiveChapter();
      await save('draft');
    }
  };

  // The confirm step is the publish modal itself, which also collects the price.
  const handlePublish = async (pricing: PublishPricing) => {
    setPublishOpen(false);
    await flushActiveChapter();
    await publish(pricing);
    history.push(ROUTES.HOME);
  };

  // `useUsers` re-derives the profiles from the stored ids, so this only needs
  // to update the work itself.
  const handleCollaboratorsSaved = (users: User[]) => setCollaborators(users.map(u => u.id));

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
            <IconButton icon={chevronBackOutline} label="Go back" onClick={() => history.goBack()} />
            <input
              value={currentWork?.title ?? ''}
              onChange={e => updateTitle(e.target.value)}
              aria-label="Work title"
              placeholder="Untitled"
              className="flex-1 min-w-0 text-center font-bold text-base bg-transparent focus:outline-none" />
            <IconButton icon={sparklesOutline} label="AI Prompt" onClick={() => setAiPromptOpen(true)} />
            {/* The cover strip below is now always present and is itself the
                picker, so a header button would be a second way to do the same
                thing — and one that can't be dropped onto. */}
            <IconButton icon={downloadOutline} label="Export" onClick={handleExport} />
          </div>
          {config.showToolbar && (
            <div className="flex gap-2 px-4 py-2 border-t border-wilde-border">
              {TOOLBAR_BUTTONS.map(t => (
                <Tooltip key={t.key} label={t.label}>
                  <button
                    onClick={() => editorRef.current?.exec(t.command)}
                    aria-label={t.label}
                    className={TOOLBAR_BUTTON_CLASS}>
                    {'display' in t ? t.display : <IonIcon icon={t.icon} aria-hidden="true" />}
                  </button>
                </Tooltip>
              ))}
              <Tooltip label={ALIGN_LABELS[alignIndex]}>
                <button onClick={handleAlign}
                  aria-label={ALIGN_LABELS[alignIndex]}
                  className={TOOLBAR_BUTTON_CLASS}>
                  <IonIcon icon={swapHorizontalOutline} aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          )}
          {/* Shows what the timeline card will use, so the choice is verifiable
              here rather than only after publishing. Kept on screen even with no
              cover set: a drop target the user can't see isn't one they'll use. */}
          {type !== 'artwork' && (
            <div className="px-4 py-2 border-t border-wilde-border">
              <UploadDropzone
                variant="strip"
                label="cover image"
                upload={coverUpload}
                currentUrl={currentWork?.coverImageUrl}
                hint="Drag an image here, or tap — it becomes the timeline thumbnail"
                doneHint="Added — save or publish to keep it"
                onRemove={hasCover ? handleRemoveCover : undefined} />
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
              <UploadDropzone
                label="artwork"
                upload={coverUpload}
                currentUrl={currentWork?.coverImageUrl}
                hint={`JPG, PNG or WebP · up to ${formatBytes(COVER_MAX_BYTES)}`}
                doneHint="Added — save or publish to keep it"
                onRemove={hasCover ? handleRemoveCover : undefined} />
              <textarea
                className="w-full text-sm leading-relaxed resize-none focus:outline-none min-h-24"
                placeholder={config.placeholder}
                value={currentWork?.content ?? ''}
                onChange={e => updateContent(e.target.value)} />
            </div>
          ) : config.showToolbar ? (
            <>
              {isLongWork && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-wilde-border">
                  {chapters.map((c, i) => (
                    <span key={c.id} className="flex items-center shrink-0">
                      <button onClick={() => handleSelectChapter(c.id)}
                        aria-current={c.id === activeChapter?.id}
                        className={'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ' +
                          (c.id === activeChapter?.id
                            ? 'bg-wilde-black text-wilde-on-ink'
                            : 'border border-wilde-border')}>
                        {chapterLabel(c, i)}
                      </button>
                      {chapters.length > 1 && c.id === activeChapter?.id && (
                        <IconButton icon={trashOutline} label="Delete chapter" side="bottom"
                          className="!min-w-8 !min-h-8 !text-sm"
                          onClick={() => handleDeleteChapter(c.id)} />
                      )}
                    </span>
                  ))}
                  <IconButton icon={addOutline} label="Add chapter" side="bottom"
                    className="!min-w-9 !min-h-9 !text-base shrink-0"
                    onClick={handleAddChapter} />
                </div>
              )}
              {!isLongWork && config.sectionLabel && (
                <h3 className="font-bold text-sm mb-2">{config.sectionLabel}</h3>
              )}
              <RichTextEditor ref={editorRef}
                // Remounting on chapter change resets the contentEditable buffer,
                // which otherwise keeps the previous chapter's DOM.
                key={isLongWork ? activeChapter?.id : 'single'}
                className={`w-full h-full text-sm leading-relaxed focus:outline-none ${config.font}`}
                placeholder={config.placeholder}
                value={editorValue}
                onChange={handleEditorChange} />
            </>
          ) : (
            <textarea
              className={`w-full h-full text-sm leading-relaxed resize-none focus:outline-none ${config.font}`}
              placeholder={config.placeholder}
              value={editorValue}
              onChange={e => handleEditorChange(e.target.value)} />
          )}
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          {/* Saving mid-upload would persist the work without the cover URL the
              user is watching arrive, so both writes wait for it. */}
          <div className="flex gap-2 p-4 text-center">
            <button onClick={handleSaveDraft} disabled={isSaving || coverUpload.isBusy}
              className="flex-1 border border-wilde-border rounded-md py-2 text-xs font-medium disabled:opacity-50">
              Save Draft
            </button>
            <button onClick={() => setPickerOpen(true)}
              className="flex-1 border border-wilde-border rounded-md py-2 text-xs font-medium">
              Collaborate
            </button>
            <button onClick={() => setPublishOpen(true)} disabled={isSaving || coverUpload.isBusy}
              className="flex-1 bg-wilde-black text-wilde-on-ink rounded-md py-2 text-xs font-medium disabled:opacity-50">
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

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setPublishOpen(false)}
        currentPrice={currentWork?.price}
        currentCurrency={currentWork?.currency}
        isPublishing={isSaving}
        onConfirm={handlePublish} />

      <AiPromptModal
        isOpen={isAiPromptOpen}
        onClose={() => setAiPromptOpen(false)}
        workType={type}
        onInsert={handleInsertPrompt} />
    </IonPage>
  );
};

export default WritingStudioPage;
