import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  searchOutline, homeOutline, compassOutline, bagOutline, peopleOutline,
  personOutline, settingsOutline, addOutline, documentTextOutline, returnDownBackOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useUiStore } from '@/store/slices/uiStore';
import { useExplore } from '@/features/explore/hooks/useExplore';
import Avatar from '@/components/ui/Avatar';
import { ROUTES } from '@/constants';

/**
 * Cmd/Ctrl+K palette: jump to any screen, or straight to a work or creator.
 *
 * The result list is a `listbox` the input `combobox` owns via
 * `aria-activedescendant`, so focus never leaves the field — arrow keys move a
 * highlight rather than the caret, which is what makes a palette feel like a
 * palette and also what screen readers expect from this pattern.
 */

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  /** Rendered instead of the icon — used for creator avatars. */
  avatar?: { src?: string; name?: string };
  group: string;
  run: () => void;
}

/** Subsequence match: "wst" finds "Writing Studio". Cheap and forgiving. */
const fuzzyMatches = (haystack: string, needle: string): boolean => {
  if (!needle) return true;
  const target = haystack.toLowerCase();
  let at = 0;
  for (const char of needle.toLowerCase()) {
    at = target.indexOf(char, at);
    if (at === -1) return false;
    at += 1;
  }
  return true;
};

/** Ranks a direct substring hit above a scattered subsequence one. */
const score = (haystack: string, needle: string): number => {
  if (!needle) return 0;
  const index = haystack.toLowerCase().indexOf(needle.toLowerCase());
  return index === -1 ? 1 : -1000 + index;
};

const CommandPalette: React.FC = () => {
  const isOpen = useUiStore(s => s.isCommandPaletteOpen);
  const close = useUiStore(s => s.closeCommandPalette);
  const toggle = useUiStore(s => s.toggleCommandPalette);
  const openCreateMenu = useUiStore(s => s.openCreateMenu);
  const history = useHistory();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reuses the Explore query, so opening the palette reads from the same cache
  // the Explore tab already filled rather than issuing its own fetch.
  const { works } = useExplore('', 'All');
  const { creators } = useExplore('', 'Creators');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  // A stale query from last time would make the palette open onto results the
  // user didn't ask for.
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
    // The dialog has to be painted before the input can take focus.
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  // Memoised so the command list below isn't rebuilt on every keystroke. Both
  // captured values are stable — a zustand action and the router's history.
  const go = useCallback(
    (route: string) => () => { close(); history.push(route); },
    [close, history],
  );

  const commands = useMemo<Command[]>(() => {
    const navigation: Command[] = [
      { id: 'nav-home',      label: 'Home',          icon: homeOutline,         group: 'Go to', run: go(ROUTES.HOME) },
      { id: 'nav-explore',   label: 'Explore',       icon: compassOutline,      group: 'Go to', run: go(ROUTES.EXPLORE) },
      { id: 'nav-market',    label: 'Marketplace',   icon: bagOutline,          group: 'Go to', run: go(ROUTES.MARKET) },
      { id: 'nav-community', label: 'Community',     icon: peopleOutline,       group: 'Go to', run: go(ROUTES.COMMUNITY) },
      { id: 'nav-jobs',      label: 'Jobs',          icon: documentTextOutline, group: 'Go to', run: go(ROUTES.JOBS) },
      { id: 'nav-profile',   label: 'Your profile',  icon: personOutline,       group: 'Go to', run: go(ROUTES.PROFILE) },
      { id: 'nav-settings',  label: 'Settings',      icon: settingsOutline,     group: 'Go to', run: go(ROUTES.SETTINGS) },
    ];

    const actions: Command[] = [
      {
        id: 'action-create',
        label: 'Create something new',
        hint: 'Story, poem, screenplay or artwork',
        icon: addOutline,
        group: 'Actions',
        run: () => { close(); openCreateMenu(); },
      },
    ];

    // Capped: the palette is for jumping to a known thing, and a list long
    // enough to scroll past is a worse Explore tab.
    const workCommands: Command[] = works.slice(0, 40).map(work => ({
      id: `work-${work.id}`,
      label: work.title || 'Untitled',
      hint: work.type.replace('_', ' '),
      icon: documentTextOutline,
      group: 'Works',
      run: go(ROUTES.READ_WORK.replace(':workId', work.id)),
    }));

    const creatorCommands: Command[] = creators.slice(0, 40).map(creator => ({
      id: `creator-${creator.id}`,
      label: creator.displayName || 'Unknown creator',
      hint: creator.username ? `@${creator.username}` : undefined,
      icon: personOutline,
      avatar: { src: creator.photoURL, name: creator.displayName },
      group: 'Creators',
      run: go(ROUTES.CREATOR_PROFILE.replace(':uid', creator.id)),
    }));

    return [...navigation, ...actions, ...workCommands, ...creatorCommands];
  }, [works, creators, go, close, openCreateMenu]);

  const results = useMemo(() => {
    const term = query.trim();
    return commands
      .filter(c => fuzzyMatches(`${c.label} ${c.hint ?? ''}`, term))
      .sort((a, b) => score(a.label, term) - score(b.label, term))
      .slice(0, 12);
  }, [commands, query]);

  // A shrinking result list can strand the highlight past the end.
  useEffect(() => { setActiveIndex(0); }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, results.length]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[activeIndex]?.run();
    }
  };

  let lastGroup: string | null = null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]
        bg-wilde-black/30 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
      // A click on the scrim dismisses; a click inside must not bubble out to it.
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl overflow-hidden border border-wilde-border
          ring-1 ring-gold/25 shadow-lift bg-wilde-panel/95 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2 px-3 border-b border-wilde-border">
          <IonIcon icon={searchOutline} aria-hidden="true" className="text-lg text-wilde-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search works, creators and pages…"
            aria-label="Search works, creators and pages"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-activedescendant={results[activeIndex] ? `cmd-${results[activeIndex].id}` : undefined}
            // The shared input focus ring would draw a gold box around the whole
            // bar; the dialog border already carries the focus here.
            className="flex-1 min-w-0 bg-transparent py-3.5 text-sm focus:outline-none
              focus-visible:ring-0 focus-visible:border-transparent focus-visible:shadow-none"
          />
          <kbd className="hidden sm:block text-[10px] text-wilde-muted border border-wilde-border
            rounded px-1.5 py-0.5 shrink-0">Esc</kbd>
        </div>

        <ul
          ref={listRef}
          id="command-palette-results"
          role="listbox"
          aria-label="Results"
          className="max-h-80 overflow-y-auto py-1"
        >
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-wilde-muted">
              No matches for “{query}”.
            </li>
          )}
          {results.map((command, index) => {
            const isNewGroup = command.group !== lastGroup;
            lastGroup = command.group;
            const isActive = index === activeIndex;
            return (
              <React.Fragment key={command.id}>
                {isNewGroup && (
                  <li aria-hidden="true"
                    className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider
                      text-wilde-muted">
                    {command.group}
                  </li>
                )}
                <li
                  id={`cmd-${command.id}`}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  // Pointer and keyboard drive the same highlight, so the two
                  // can't disagree about which row Enter would run.
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={command.run}
                  className={'flex items-center gap-3 px-3 py-2 mx-1 rounded-lg cursor-pointer ' +
                    'transition-colors ' + (isActive ? 'bg-wilde-subtle' : '')}
                >
                  {command.avatar
                    ? <Avatar src={command.avatar.src} name={command.avatar.name} size="sm" />
                    : <IonIcon icon={command.icon} aria-hidden="true"
                        className="text-base text-wilde-muted shrink-0" />}
                  <span className="flex-1 min-w-0 text-sm truncate">{command.label}</span>
                  {command.hint && (
                    <span className="text-xs text-wilde-muted capitalize shrink-0">{command.hint}</span>
                  )}
                  {isActive && (
                    <IonIcon icon={returnDownBackOutline} aria-hidden="true"
                      className="text-xs text-wilde-muted shrink-0" />
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
