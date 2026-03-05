import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Table as TableIcon,
  Youtube as YoutubeIcon,
  Minus,
  Pilcrow,
  Type,
  RemoveFormatting,
  Unlink,
  TableProperties,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
}

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa", "#99f6e4", "#fda4af",
];

export default function RichTextEditor({
  content,
  onChange,
  onImageUpload,
  placeholder = "Start writing your blog post...",
  className,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Image.configure({ allowBase64: true, inline: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Youtube.configure({ width: 640, height: 360 }),
      CharacterCount,
      Typography,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none w-full break-words break-all focus:outline-none h-full px-8 py-6",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      if (onImageUpload) {
        try {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        } catch {
          // Fallback to base64 if upload fails
          const reader = new FileReader();
          reader.onload = () => {
            editor
              .chain()
              .focus()
              .setImage({ src: reader.result as string })
              .run();
          };
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          editor
            .chain()
            .focus()
            .setImage({ src: reader.result as string })
            .run();
        };
        reader.readAsDataURL(file);
      }

      // Reset
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor, onImageUpload]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    setLinkUrl("");
  }, [editor, linkUrl]);

  const addYoutubeVideo = useCallback(() => {
    if (!editor || !youtubeUrl) return;
    editor.commands.setYoutubeVideo({ src: youtubeUrl });
    setYoutubeUrl("");
  }, [editor, youtubeUrl]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    tooltip,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    tooltip: string;
    children: React.ReactNode;
  }) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-150",
              "hover:bg-slate-100 hover:text-slate-900",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isActive
                ? "bg-slate-200 text-slate-900 shadow-inner"
                : "text-slate-600"
            )}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const charCount = editor.storage.characterCount;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm min-h-[400px] flex flex-col w-full max-w-full overflow-hidden",
        "focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100",
        "transition-all duration-200",
        className
      )}
    >
      {/* ── Toolbar ── */}
      <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white sticky top-0 z-10">
        {/* Row 1 – Text formatting */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
          {/* Text type dropdown */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            tooltip="Paragraph"
          >
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            tooltip="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            tooltip="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            tooltip="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Inline formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            tooltip="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            tooltip="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            tooltip="Inline Code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <Palette className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Text Color
              </p>
              <div className="grid grid-cols-10 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-5 h-5 rounded-sm border border-slate-200 hover:scale-125 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      editor.chain().focus().setColor(color).run()
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Reset color
              </button>
            </PopoverContent>
          </Popover>

          {/* Highlight */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-1.5 transition-all",
                  "hover:bg-slate-100",
                  editor.isActive("highlight")
                    ? "bg-yellow-100 text-yellow-700"
                    : "text-slate-600"
                )}
              >
                <Highlighter className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Highlight
              </p>
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color })
                        .run()
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                onClick={() =>
                  editor.chain().focus().unsetHighlight().run()
                }
              >
                Remove highlight
              </button>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
            isActive={editor.isActive({ textAlign: "left" })}
            tooltip="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
            isActive={editor.isActive({ textAlign: "center" })}
            tooltip="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
            isActive={editor.isActive({ textAlign: "right" })}
            tooltip="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign("justify").run()
            }
            isActive={editor.isActive({ textAlign: "justify" })}
            tooltip="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            isActive={editor.isActive("bulletList")}
            tooltip="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            isActive={editor.isActive("orderedList")}
            tooltip="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
            isActive={editor.isActive("blockquote")}
            tooltip="Block Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setHorizontalRule().run()
            }
            tooltip="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Media */}
          <ToolbarButton onClick={handleImageUpload} tooltip="Insert Image">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-1.5 transition-all",
                  "hover:bg-slate-100",
                  editor.isActive("link")
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600"
                )}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Insert Link
              </p>
              <div className="flex gap-2">
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && setLink()}
                />
                <Button size="sm" onClick={setLink}>
                  Set
                </Button>
              </div>
              {editor.isActive("link") && (
                <button
                  type="button"
                  className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                  onClick={() =>
                    editor.chain().focus().unsetLink().run()
                  }
                >
                  <Unlink className="h-3 w-3" /> Remove link
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* YouTube */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <YoutubeIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Embed YouTube Video
              </p>
              <div className="flex gap-2">
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="text-sm"
                  onKeyDown={(e) =>
                    e.key === "Enter" && addYoutubeVideo()
                  }
                />
                <Button size="sm" onClick={addYoutubeVideo}>
                  Add
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Table */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-1.5 transition-all",
                  "hover:bg-slate-100",
                  editor.isActive("table")
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-600"
                )}
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Table
              </p>
              <div className="space-y-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({
                        rows: 3,
                        cols: 3,
                        withHeaderRow: true,
                      })
                      .run()
                  }
                >
                  <Plus className="h-3 w-3 mr-2" /> Insert 3×3 Table
                </Button>
                {editor.isActive("table") && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() =>
                        editor.chain().focus().addColumnAfter().run()
                      }
                    >
                      Add Column
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() =>
                        editor.chain().focus().addRowAfter().run()
                      }
                    >
                      Add Row
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs text-red-600"
                      onClick={() =>
                        editor.chain().focus().deleteTable().run()
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-2" /> Delete Table
                    </Button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Clear formatting */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            tooltip="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>

          {/* Undo / Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* ── Bubble menu (appears on text selection) ── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="bg-white rounded-lg shadow-xl border border-slate-200 flex items-center gap-0.5 p-1"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-slate-100",
              editor.isActive("bold") && "bg-slate-200"
            )}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-slate-100",
              editor.isActive("italic") && "bg-slate-200"
            )}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-1.5 rounded hover:bg-slate-100",
              editor.isActive("underline") && "bg-slate-200"
            )}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHighlight().run()
            }
            className={cn(
              "p-1.5 rounded hover:bg-slate-100",
              editor.isActive("highlight") && "bg-yellow-100"
            )}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </button>
        </BubbleMenu>
      )}

      {/* ── Editor content ── */}
      <EditorContent editor={editor} className="blog-editor-content flex-1 overflow-x-hidden" />

      {/* ── Footer stats ── */}
      <div className="border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-400 bg-slate-50/50">
        <span>
          {charCount.characters()} characters · {charCount.words()} words
        </span>
        <span>~{Math.max(1, Math.ceil(charCount.words() / 200))} min read</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
