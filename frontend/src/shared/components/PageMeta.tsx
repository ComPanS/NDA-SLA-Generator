import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description?: string;
  /**
   * Optional keywords for meta keywords tag (used by Yandex and other search engines).
   */
  keywords?: string;
  /**
   * Optional path for canonical/OG URL. Falls back to current pathname.
   */
  path?: string;
  /**
   * Optional preview image for social cards.
   */
  image?: string;
}

const ENV_SITE_URL = import.meta.env.VITE_SITE_URL?.trim();
const getBaseUrl = () => {
  // Prefer explicit env value if it looks like a full URL, otherwise fall back to current origin
  if (ENV_SITE_URL && /^https?:\/\//i.test(ENV_SITE_URL)) {
    return ENV_SITE_URL;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://dogovarai.ru';
};
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

export const PageMeta = ({ title, description, keywords, path, image }: PageMetaProps) => {
  useEffect(() => {
    document.title = title;

    const baseUrl = getBaseUrl();
    // Gracefully handle malformed env base URLs to avoid crashing the whole app
    let url = baseUrl;
    try {
      url = new URL(path || window.location.pathname, baseUrl).toString();
    } catch {
      const sanitizedBase = baseUrl.replace(/\/+$/, '');
      const resolvedPath = path || window.location?.pathname || '/';
      url = `${sanitizedBase}${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
    }

    if (description) {
      ensureMetaTag('description', description);
    }

    if (keywords) {
      ensureMetaTag('keywords', keywords);
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
  }, [title, description, keywords, path, image]);

  return null;
};
