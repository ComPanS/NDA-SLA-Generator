/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ADMIN_ROUTE?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_YANDEX_CLIENT_ID?: string;
  readonly VITE_YANDEX_SUGGEST_REDIRECT_URI?: string;
  readonly VITE_YANDEX_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
