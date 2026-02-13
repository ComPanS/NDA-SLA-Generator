import BulletList from '@tiptap/extension-bullet-list';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dashList: {
      toggleDashList: () => ReturnType;
    };
  }
}

export const DashList = BulletList.extend({
  name: 'dashList',

  addAttributes() {
    return {
      ...this.parent?.(),
      'data-list-style': {
        default: 'dash',
        parseHTML: (element) => element.getAttribute('data-list-style') || 'dash',
        renderHTML: () => ({
          'data-list-style': 'dash',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'ul[data-list-style="dash"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['ul', { ...HTMLAttributes, 'data-list-style': 'dash' }, 0];
  },

  addCommands() {
    return {
      toggleDashList:
        () =>
        ({ commands }) =>
          commands.toggleList(this.name, 'listItem'),
    };
  },
});
