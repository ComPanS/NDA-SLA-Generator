import {
  Box,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  FormatAlignCenter,
  FormatAlignJustify,
  FormatAlignLeft,
  FormatAlignRight,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatUnderlined,
  Remove,
  ViewStream,
  TextFields,
  ViewColumn,
} from '@mui/icons-material';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { ColumnBreak, ColumnSpan, Columns } from '../extensions/columns';
import { DashList } from '../extensions/dashList';
import './ContractEditor.css';

/** Keeps MUI tooltips in the toolbar subtree; portals + TipTap DOM moves can trigger React removeChild errors in dev. */
const toolbarTooltipSlots = { popper: { disablePortal: true } } as const;

interface ContractEditorProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export const ContractEditor = ({ content, onChange, readOnly = false }: ContractEditorProps) => {
  const { t } = useTranslation('editor');
  const onChangeRef = useRef(onChange);
  const contentRef = useRef(content);
  onChangeRef.current = onChange;
  contentRef.current = content;

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        underline: false,
      }),
      Underline,
      TextStyle,
      DashList,
      ColumnSpan,
      ColumnBreak,
      Columns,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    []
  );

  const editor = useEditor(
    {
      extensions,
      content,
      editable: !readOnly,
      onCreate: ({ editor }) => {
        const normalized = editor.getHTML();
        const startHtml = contentRef.current;
        if (normalized !== startHtml) {
          onChangeRef.current?.(normalized);
        }
      },
      onUpdate: ({ editor }) => {
        onChangeRef.current?.(editor.getHTML());
      },
    },
    [readOnly, extensions]
  );

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content, { emitUpdate: false });
      // try to restore selection to prevent scroll jumps, but guard against invalid positions
      try {
        const docSize = editor.state.doc.content.size;
        const clampedFrom = Math.min(from, docSize);
        const clampedTo = Math.min(to, docSize);
        const $from = editor.state.doc.resolve(clampedFrom);
        // Only restore if selection is inside a textblock; otherwise skip
        if ($from.parent.isTextblock) {
          editor.commands.setTextSelection({ from: clampedFrom, to: clampedTo });
        }
      } catch {
        // ignore selection restore errors
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const logColumnsAction = (_action: string) => {};

  const handle = (fn: () => boolean, action?: string) => {
    const result = fn();
    if (action) {
      logColumnsAction(action);
    }
    return result;
  };

  return (
    <Paper
      sx={{
        p: 0,
        width: '100%',
        maxWidth: { xs: '100%', md: '210mm' },
        margin: '0 auto',
        '& .ProseMirror': {
          padding: {
            xs: '20mm 10mm 20mm 30mm',
            sm: '20mm 10mm 20mm 30mm',
            md: '20mm 10mm 20mm 30mm',
          },
          lineHeight: '1.8',
          fontSize: '14px',
          fontFamily: '"Times New Roman", serif',
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          maxWidth: '210mm',
          width: { xs: '100%', md: '210mm' },
          margin: '0 auto',
        },
        '& .editor-toolbar': {
          position: 'sticky',
          top: 64,
          zIndex: 40,
          backgroundColor: '#f5f5f5',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          maxWidth: '210mm',
          width: { xs: '100%', md: '210mm' },
          margin: '0 auto',
        },
      }}
    >
      {!readOnly && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ px: 1, py: 0.75 }}
          className="editor-toolbar"
        >
          <ToggleButtonGroup size="small" exclusive>
            <ToggleButton
              value="bold"
              selected={editor.isActive('bold')}
              onClick={() => handle(() => editor.chain().focus().toggleBold().run())}
            >
              <Tooltip title={t('bold')} slotProps={toolbarTooltipSlots}>
                <FormatBold fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="italic"
              selected={editor.isActive('italic')}
              onClick={() => handle(() => editor.chain().focus().toggleItalic().run())}
            >
              <Tooltip title={t('italic')} slotProps={toolbarTooltipSlots}>
                <FormatItalic fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="underline"
              selected={editor.isActive('underline')}
              onClick={() => handle(() => editor.chain().focus().toggleUnderline().run())}
            >
              <Tooltip title={t('underline')} slotProps={toolbarTooltipSlots}>
                <FormatUnderlined fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" exclusive>
            <ToggleButton
              value="h1"
              selected={editor.isActive('heading', { level: 1 })}
              onClick={() => handle(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
            >
              <Tooltip title={t('h1')}>
                <TextFields fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="h2"
              selected={editor.isActive('heading', { level: 2 })}
              onClick={() => handle(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
            >
              H2
            </ToggleButton>
            <ToggleButton
              value="h3"
              selected={editor.isActive('heading', { level: 3 })}
              onClick={() => handle(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
            >
              H3
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <ToggleButtonGroup size="small" exclusive>
            <ToggleButton
              value="left"
              selected={editor.isActive({ textAlign: 'left' })}
              onClick={() => handle(() => editor.chain().focus().setTextAlign('left').run())}
            >
              <Tooltip title={t('alignLeft')} slotProps={toolbarTooltipSlots}>
                <FormatAlignLeft fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="center"
              selected={editor.isActive({ textAlign: 'center' })}
              onClick={() => handle(() => editor.chain().focus().setTextAlign('center').run())}
            >
              <Tooltip title={t('alignCenter')} slotProps={toolbarTooltipSlots}>
                <FormatAlignCenter fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="right"
              selected={editor.isActive({ textAlign: 'right' })}
              onClick={() => handle(() => editor.chain().focus().setTextAlign('right').run())}
            >
              <Tooltip title={t('alignRight')} slotProps={toolbarTooltipSlots}>
                <FormatAlignRight fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="justify"
              selected={editor.isActive({ textAlign: 'justify' })}
              onClick={() => handle(() => editor.chain().focus().setTextAlign('justify').run())}
            >
              <Tooltip title={t('alignJustify')} slotProps={toolbarTooltipSlots}>
                <FormatAlignJustify fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <ToggleButtonGroup size="small" exclusive>
            <ToggleButton
              value="ordered"
              selected={editor.isActive('orderedList')}
              onClick={() => handle(() => editor.chain().focus().toggleOrderedList().run())}
            >
              <Tooltip title={t('ol')} slotProps={toolbarTooltipSlots}>
                <FormatListNumbered fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="bullet"
              selected={editor.isActive('bulletList')}
              onClick={() => handle(() => editor.chain().focus().toggleBulletList().run())}
            >
              <Tooltip title={t('ul')} slotProps={toolbarTooltipSlots}>
                <FormatListBulleted fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton
              value="dash"
              selected={editor.isActive('dashList')}
              onClick={() => handle(() => editor.chain().focus().toggleDashList().run())}
            >
              <Tooltip title={t('dashList')} slotProps={toolbarTooltipSlots}>
                <Remove fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <IconButton
            size="small"
            color={editor.isActive('columns') ? 'primary' : 'default'}
            onClick={() =>
              handle(() => {
                const chain = editor.chain().focus();
                if (editor.isActive('columnSpan')) {
                  chain.lift('columnSpan');
                }
                return chain.toggleColumns(2).run();
              }, 'create-2-columns')
            }
          >
            <Tooltip title={t('columns')} slotProps={toolbarTooltipSlots}>
              <ViewColumn fontSize="small" />
            </Tooltip>
          </IconButton>
          <IconButton
            size="small"
            color={editor.isActive('columnSpan') ? 'primary' : 'default'}
            onClick={() =>
              handle(() => editor.chain().focus().toggleColumnSpan().run(), 'span-all')
            }
          >
            <Tooltip
              title={editor.isActive('columnSpan') ? t('columnUnspan') : t('columnSpan')}
              slotProps={toolbarTooltipSlots}
            >
              <ViewStream fontSize="small" />
            </Tooltip>
          </IconButton>
        </Stack>
      )}

      <Box sx={{ borderTop: readOnly ? '1px solid #e0e0e0' : 'none' }}>
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
};
