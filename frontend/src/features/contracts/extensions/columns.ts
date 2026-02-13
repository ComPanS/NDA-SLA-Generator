import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      toggleColumns: (columns?: number, columnGapPx?: number, equalWidth?: boolean) => ReturnType;
      insertColumnBreak: () => ReturnType;
      toggleColumnSpan: (spanAll?: boolean) => ReturnType;
    };
  }
}

export interface ColumnsOptions {
  defaultColumns: number;
  columnGapPx: number;
  defaultEqualWidth: boolean;
  defaultAreaHeight?: number;
}

export const Columns = Node.create<ColumnsOptions>({
  name: 'columns',
  group: 'block',
  content: 'block+',
  isolating: true,

  addOptions() {
    return {
      defaultColumns: 2,
      columnGapPx: 24,
      defaultEqualWidth: true,
      defaultAreaHeight: undefined,
    };
  },

  addAttributes() {
    return {
      columns: {
        default: this.options.defaultColumns,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-columns');
          const parsed = attr ? parseInt(attr, 10) : this.options.defaultColumns;
          return Number.isFinite(parsed) && parsed > 0 ? parsed : this.options.defaultColumns;
        },
        renderHTML: (attributes) => ({
          'data-columns': attributes.columns,
          style: `column-count: ${attributes.columns}; column-gap: ${attributes.columnGapPx}px;`,
        }),
      },
      columnGapPx: {
        default: this.options.columnGapPx,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-gutter');
          const parsed = attr ? parseInt(attr, 10) : this.options.columnGapPx;
          return Number.isFinite(parsed) && parsed > 0 ? parsed : this.options.columnGapPx;
        },
        renderHTML: (attributes) => ({
          'data-gutter': attributes.columnGapPx,
        }),
      },
      equalWidth: {
        default: this.options.defaultEqualWidth,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-equal-width');
          if (attr === 'false') return false;
          if (attr === 'true') return true;
          return this.options.defaultEqualWidth;
        },
        renderHTML: (attributes) => ({
          'data-equal-width': String(!!attributes.equalWidth),
        }),
      },
      areaHeight: {
        default: this.options.defaultAreaHeight,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-area-height');
          const parsed = attr ? parseInt(attr, 10) : undefined;
          if (parsed === undefined) return this.options.defaultAreaHeight;
          return Number.isFinite(parsed) && parsed > 0 ? parsed : this.options.defaultAreaHeight;
        },
        renderHTML: (attributes) =>
          attributes.areaHeight
            ? {
                'data-area-height': attributes.areaHeight,
              }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-columns]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleColumns:
        (columns?: number, columnGapPx?: number, equalWidth?: boolean) =>
        ({ commands, state, dispatch }) => {
          const columnsCount = columns || this.options.defaultColumns;
          const gap = columnGapPx ?? this.options.columnGapPx;
          const equal = equalWidth ?? this.options.defaultEqualWidth;
          const { selection, schema, tr } = state;
          const columnsType = schema.nodes.columns;
          const { $from, $to } = selection;

          // unwrap if selection touches a columns node
          for (let depth = $from.depth; depth > 0; depth -= 1) {
            const fromNode = depth <= $from.depth ? $from.node(depth) : null;
            const toNode = depth <= $to.depth ? $to.node(depth) : null;

            if (
              (fromNode && fromNode.type === columnsType) ||
              (toNode && toNode.type === columnsType)
            ) {
              const nodePos = fromNode?.type === columnsType ? $from : $to;
              const before = nodePos.before(depth);
              const after = nodePos.after(depth);
              const content = (fromNode ?? toNode)!.content;

              if (dispatch) {
                dispatch(tr.replaceWith(before, after, content));
              }
              return true;
            }
          }

          const wrapped = commands.wrapIn('columns', {
            columns: columnsCount,
            columnGapPx: gap,
            equalWidth: equal,
          });
          return wrapped;
        },
      insertColumnBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: 'columnBreak',
          }),
      toggleColumnSpan:
        (spanAll = true) =>
        ({ commands, state, editor }) => {
          const { selection, schema } = state;
          const { from, to } = selection;
          const spansNode = schema.nodes.columnSpan;

          const $from = state.doc.resolve(from);
          const $to = state.doc.resolve(to);

          // unwrap if already inside columnSpan (check both ends of selection)
          for (let depth = Math.min($from.depth, $to.depth); depth > 0; depth -= 1) {
            const fromNode = depth <= $from.depth ? $from.node(depth) : null;
            const toNode = depth <= $to.depth ? $to.node(depth) : null;
            const hitFrom = fromNode && fromNode.type === spansNode;
            const hitTo = toNode && toNode.type === spansNode;
            if (hitFrom || hitTo) {
              // Try lifting repeatedly in case of nested spans
              let ok = commands.lift('columnSpan');
              if (!ok) return false;
              for (let i = 0; i < 4 && editor.isActive('columnSpan'); i += 1) {
                ok = commands.lift('columnSpan');
              }
              const stillSpan = editor.isActive('columnSpan');
              return !stillSpan;
            }
          }

          if (!spanAll) {
            return false;
          }

          return commands.wrapIn('columnSpan', { span: 'all' });
        },
    };
  },
});

export const ColumnBreak = Node.create({
  name: 'columnBreak',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'div[data-column-break]',
      },
    ];
  },

  renderHTML() {
    return ['div', { 'data-column-break': 'true' }];
  },
});

export const ColumnSpan = Node.create({
  name: 'columnSpan',
  group: 'block',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      span: {
        default: 'all',
        parseHTML: (element) => element.getAttribute('data-span-columns') || 'all',
        renderHTML: (attributes) => ({
          'data-span-columns': attributes.span || 'all',
          style: `column-span: ${attributes.span === 'none' ? 'none' : 'all'};`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-span-columns]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
});
