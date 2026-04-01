import { useEffect } from 'react';
import { APP_LOCALES, type AppLocale } from '@/shared/i18n/constants';
import { parseLocaleFromPath, toLocalizedPath } from '@/shared/i18n/localePath';

interface PageMetaProps {
  title: string;
  /** og:site_name and related branding; defaults to ДоговорAI if omitted. */
  siteName?: string;
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
const DEFAULT_SITE_NAME = 'ДоговорAI';

/** Tags created/managed by PageMeta (hreflang alternates + optionally other injected head tags). */
const MANAGED_HEAD_ATTR = 'data-contractai-page-meta';

function hreflangTagForLocale(lang: AppLocale): string {
  if (lang === 'ru') return 'ru-RU';
  return lang;
}

function absoluteFromPathname(pathname: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

function ensureMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    tag.setAttribute(MANAGED_HEAD_ATTR, '');
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function ensurePropertyTag(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    tag.setAttribute(MANAGED_HEAD_ATTR, '');
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function ensureLinkTag(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    link.setAttribute(MANAGED_HEAD_ATTR, '');
    document.head.appendChild(link);
  }
  link.href = href;
}

export const PageMeta = ({ title, siteName, description, keywords, path, image }: PageMetaProps) => {
  useEffect(() => {
    document.title = title;
    const resolvedSiteName = siteName ?? DEFAULT_SITE_NAME;

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
    ensurePropertyTag('og:site_name', resolvedSiteName);
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

    const pathnameKey = path ?? window.location.pathname;
    const { logicalPath } = parseLocaleFromPath(pathnameKey);
    document
      .querySelectorAll(`link[rel="alternate"][hreflang][${MANAGED_HEAD_ATTR}]`)
      .forEach((el) => {
        try {
          el.remove();
        } catch {
          /* ignore if detached elsewhere */
        }
      });

    const sanitizedBase = baseUrl.replace(/\/+$/, '');
    for (const lang of APP_LOCALES) {
      const localizedPathname = toLocalizedPath(logicalPath, lang);
      const href = absoluteFromPathname(localizedPathname, sanitizedBase);
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflangTagForLocale(lang);
      link.href = href;
      link.setAttribute(MANAGED_HEAD_ATTR, '');
      document.head.appendChild(link);
    }
    const xDefaultHref = absoluteFromPathname(toLocalizedPath(logicalPath, 'ru'), sanitizedBase);
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = xDefaultHref;
    xDefault.setAttribute(MANAGED_HEAD_ATTR, '');
    document.head.appendChild(xDefault);
  }, [title, siteName, description, keywords, path, image]);

  return null;
};
