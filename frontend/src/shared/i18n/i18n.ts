import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18N_NAMESPACES } from './constants';
import ruCommon from './locales/ru/common.json';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import thCommon from './locales/th/common.json';
import ruAuth from './locales/ru/auth.json';
import enAuth from './locales/en/auth.json';
import esAuth from './locales/es/auth.json';
import thAuth from './locales/th/auth.json';
import ruLanding from './locales/ru/landing';
import enLanding from './locales/en/landing';
import esLanding from './locales/es/landing';
import thLanding from './locales/th/landing';
import ruErrors from './locales/ru/errors.json';
import enErrors from './locales/en/errors.json';
import esErrors from './locales/es/errors.json';
import thErrors from './locales/th/errors.json';
import ruDashboard from './locales/ru/dashboard.json';
import enDashboard from './locales/en/dashboard.json';
import esDashboard from './locales/es/dashboard.json';
import thDashboard from './locales/th/dashboard.json';
import ruContracts from './locales/ru/contracts.json';
import enContracts from './locales/en/contracts.json';
import esContracts from './locales/es/contracts.json';
import thContracts from './locales/th/contracts.json';
import ruBilling from './locales/ru/billing.json';
import enBilling from './locales/en/billing.json';
import esBilling from './locales/es/billing.json';
import thBilling from './locales/th/billing.json';
import ruTemplates from './locales/ru/templates.json';
import enTemplates from './locales/en/templates.json';
import esTemplates from './locales/es/templates.json';
import thTemplates from './locales/th/templates.json';
import ruProfile from './locales/ru/profile.json';
import enProfile from './locales/en/profile.json';
import esProfile from './locales/es/profile.json';
import thProfile from './locales/th/profile.json';
import ruGuest from './locales/ru/guest.json';
import enGuest from './locales/en/guest.json';
import esGuest from './locales/es/guest.json';
import thGuest from './locales/th/guest.json';
import ruAdmin from './locales/ru/admin.json';
import enAdmin from './locales/en/admin.json';
import esAdmin from './locales/es/admin.json';
import thAdmin from './locales/th/admin.json';
import ruOauth from './locales/ru/oauth.json';
import enOauth from './locales/en/oauth.json';
import esOauth from './locales/es/oauth.json';
import thOauth from './locales/th/oauth.json';
import ruEditor from './locales/ru/editor.json';
import enEditor from './locales/en/editor.json';
import esEditor from './locales/es/editor.json';
import thEditor from './locales/th/editor.json';

const bundle = {
  common: { ru: ruCommon, en: enCommon, es: esCommon, th: thCommon },
  auth: { ru: ruAuth, en: enAuth, es: esAuth, th: thAuth },
  landing: { ru: ruLanding, en: enLanding, es: esLanding, th: thLanding },
  errors: { ru: ruErrors, en: enErrors, es: esErrors, th: thErrors },
  dashboard: { ru: ruDashboard, en: enDashboard, es: esDashboard, th: thDashboard },
  contracts: { ru: ruContracts, en: enContracts, es: esContracts, th: thContracts },
  billing: { ru: ruBilling, en: enBilling, es: esBilling, th: thBilling },
  templates: { ru: ruTemplates, en: enTemplates, es: esTemplates, th: thTemplates },
  profile: { ru: ruProfile, en: enProfile, es: esProfile, th: thProfile },
  guest: { ru: ruGuest, en: enGuest, es: esGuest, th: thGuest },
  admin: { ru: ruAdmin, en: enAdmin, es: esAdmin, th: thAdmin },
  oauth: { ru: ruOauth, en: enOauth, es: esOauth, th: thOauth },
  editor: { ru: ruEditor, en: enEditor, es: esEditor, th: thEditor },
} as const;

const resources = {
  ru: Object.fromEntries(Object.entries(bundle).map(([ns, packs]) => [ns, packs.ru])),
  en: Object.fromEntries(Object.entries(bundle).map(([ns, packs]) => [ns, packs.en])),
  es: Object.fromEntries(Object.entries(bundle).map(([ns, packs]) => [ns, packs.es])),
  th: Object.fromEntries(Object.entries(bundle).map(([ns, packs]) => [ns, packs.th])),
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ru',
  fallbackLng: 'en',
  supportedLngs: ['ru', 'en', 'es', 'th'],
  ns: [...I18N_NAMESPACES],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

function setHtmlLang(lng: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
}

setHtmlLang(i18n.language);
i18n.on('languageChanged', (lng) => {
  setHtmlLang(lng);
});

export default i18n;
