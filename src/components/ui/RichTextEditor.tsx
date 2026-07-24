import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { sanitizeHtml } from '@/utils';

export interface RichTextEditorHandle {
  exec: (command: string, arg?: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ value, onChange, placeholder, className }, ref) => {
    const divRef = useRef<HTMLDivElement>(null);
    const lastValue = useRef(value);

    useEffect(() => {
      const el = divRef.current;
      if (!el || value === lastValue.current || document.activeElement === el) return;
      el.innerHTML = sanitizeHtml(value);
      lastValue.current = value;
    }, [value]);

    const handleInput = () => {
      const html = divRef.current?.innerHTML ?? '';
      lastValue.current = html;
      onChange(html);
    };

    useImperativeHandle(ref, () => ({
      exec: (command, arg) => {
        divRef.current?.focus();
        document.execCommand(command, false, arg);
        handleInput();
      },
    }));

    return (
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className={`rich-text-editor rich-text-content ${className ?? ''}`} />
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
