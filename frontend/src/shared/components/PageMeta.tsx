import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description?: string;
}

export const PageMeta = ({ title, description }: PageMetaProps) => {
  useEffect(() => {
    document.title = title;

    if (description) {
      let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [title, description]);

  return null;
};
