import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description?: string;
  /**
   * Optional path for canonical/OG URL. Falls back to current pathname.
   */
  path?: string;
  /**
   * Optional preview image for social cards.
   */
  image?: string;
}

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://dogovarai.ru';
const SITE_NAME = 'ДоговорAI';

function ensureMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function ensurePropertyTag(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function ensureLinkTag(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

export const PageMeta = ({ title, description, path, image }: PageMetaProps) => {
  useEffect(() => {
    document.title = title;

    const url = new URL(path || window.location.pathname, SITE_URL).toString();

    if (description) {
      ensureMetaTag('description', description);
    }

    ensureMetaTag('robots', 'index,follow');
    ensurePropertyTag('og:title', title);
    ensurePropertyTag('og:type', 'website');
    ensurePropertyTag('og:url', url);
    ensurePropertyTag('og:site_name', SITE_NAME);
    ensureMetaTag('twitter:card', 'summary_large_image');
    ensureMetaTag('twitter:title', title);
    ensureLinkTag('canonical', url);

    if (description) {
      ensurePropertyTag('og:description', description);
      ensureMetaTag('twitter:description', description);
    }

    if (image) {
      ensurePropertyTag('og:image', image);
      ensureMetaTag('twitter:image', image);
    }
  }, [title, description, path, image]);

  return null;
};
