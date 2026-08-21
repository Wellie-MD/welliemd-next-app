import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { Bold, Italic, Heading, Link, List, ListOrdered, RemoveFormatting, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  /** Current HTML value (controlled). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional cap for normalized serialized HTML characters. */
  maxSerializedHtmlLength?: number;
  "data-testid"?: string;
}

type ExecCommand =
  | "bold"
  | "italic"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock"
  | "removeFormat"
  | "undo";

/**
 * Dependency-free rich-text field built on a `contentEditable` region plus a
 * formatting toolbar (mirrors the client prototype's consent editor). Emits HTML
 * via `onChange`. Uncontrolled internally to preserve caret position; the DOM is
 * only re-synced when the incoming `value` differs from the live content
 * (e.g. when switching to a different record).
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  className,
  maxSerializedHtmlLength,
  "data-testid": dataTestId,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const charCount = value.trim().length;

  // Sync external value into the DOM only when it diverges from live content.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  }, [onChange]);

  const runCommand = useCallback(
    (command: ExecCommand, arg?: string) => (event: MouseEvent<HTMLButtonElement>) => {
      // Prevent the toolbar from stealing focus so the selection is preserved.
      event.preventDefault();
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      // execCommand is deprecated but remains the only cross-browser, dependency-free
      // way to apply inline formatting to a contentEditable selection.
      document.execCommand(command, false, arg);
      handleInput();
    },
    [handleInput]
  );

  const insertLink = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const url = window.prompt("Link URL", "https://");
      if (!url) return;
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      document.execCommand("createLink", false, url);
      handleInput();
    },
    [handleInput]
  );

  const toolbarButtons: Array<{
    key: string;
    label: string;
    icon: typeof Bold;
    onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void;
  }> = [
    { key: "h1", label: "Heading", icon: Heading, onMouseDown: runCommand("formatBlock", "<h1>") },
    { key: "bold", label: "Bold", icon: Bold, onMouseDown: runCommand("bold") },
    { key: "italic", label: "Italic", icon: Italic, onMouseDown: runCommand("italic") },
    { key: "ul", label: "Bullet list", icon: List, onMouseDown: runCommand("insertUnorderedList") },
    { key: "ol", label: "Numbered list", icon: ListOrdered, onMouseDown: runCommand("insertOrderedList") },
    { key: "link", label: "Insert link", icon: Link, onMouseDown: insertLink },
    { key: "clear", label: "Clear formatting", icon: RemoveFormatting, onMouseDown: runCommand("removeFormat") },
    { key: "undo", label: "Undo", icon: Undo2, onMouseDown: runCommand("undo") },
  ];

  const overLimit =
    typeof maxSerializedHtmlLength === "number" &&
    charCount > maxSerializedHtmlLength;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors focus-within:border-[#2563eb] focus-within:ring-[3px] focus-within:ring-[#eff4ff]",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {toolbarButtons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.key}
              type="button"
              aria-label={button.label}
              title={button.label}
              onMouseDown={button.onMouseDown}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              data-testid={`rich-text-${button.key}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        {typeof maxSerializedHtmlLength === "number" && (
          <span
            className={cn(
              "ml-auto text-[11px] font-medium",
              overLimit ? "text-red-600" : "text-slate-400"
            )}
            aria-label={`Serialized HTML characters: ${charCount} of ${maxSerializedHtmlLength}`}
            aria-live="polite"
          >
            {charCount.toLocaleString()}/{maxSerializedHtmlLength.toLocaleString()}
          </span>
        )}
      </div>

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        data-testid={dataTestId}
        className={cn(
          "min-h-[160px] px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none",
          "prose prose-sm max-w-none focus:ring-0",
          "empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
        )}
      />
    </div>
  );
}
