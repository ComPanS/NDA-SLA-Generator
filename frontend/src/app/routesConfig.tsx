import type { RouteObject } from 'react-router-dom';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { NewContract } from '@/pages/NewContract';
import { ContractView } from '@/pages/ContractView';
import { Billing } from '@/pages/Billing';
import { Templates } from '@/pages/Templates';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { GuestContract } from '@/pages/GuestContract';
import { Profile } from '@/pages/Profile';
import { OAuthYandexCallback } from '@/pages/OAuthYandexCallback';
import { OAuthGoogleCallback } from '@/pages/OAuthGoogleCallback';
import { YandexSuggestToken } from '@/pages/YandexSuggestToken';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfUse } from '@/pages/TermsOfUse';
import { NotFound } from '@/pages/NotFound';
import { Admin } from '@/pages/Admin';
import { LocaleLayout } from './LocaleLayout';
import { ADMIN_ROUTE } from '@/shared/constants';

/** Child routes under `/` (ru) and under `/:locale` (en|es|th). Paths are relative to parent. */
export const localeChildRouteObjects: RouteObject[] = [
  { index: true, element: <Landing /> },
  { path: 'login', element: <Login /> },
  { path: 'register', element: <Register /> },
  { path: 'forgot-password', element: <ForgotPassword /> },
  { path: 'reset-password', element: <ResetPassword /> },
  { path: 'verify-email', element: <VerifyEmail /> },
  { path: 'privacy', element: <PrivacyPolicy /> },
  { path: 'terms', element: <TermsOfUse /> },
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'guest-contract', element: <GuestContract /> },
  { path: 'new-contract', element: <NewContract /> },
  { path: 'contract/:id', element: <ContractView /> },
  { path: 'billing', element: <Billing /> },
  { path: 'profile', element: <Profile /> },
  { path: 'templates', element: <Templates /> },
];

/** Flat routes for Russian (no locale prefix). */
export function ruFlatRoutes(): RouteObject[] {
  return localeChildRouteObjects.map((c) => {
    if (c.index) {
      return { path: '/', element: c.element };
    }
    const path = typeof c.path === 'string' ? c.path : '';
    return { path: `/${path}`, element: c.element };
  });
}

export function buildAppRouteObjects(): RouteObject[] {
  return [
    { path: ADMIN_ROUTE, element: <Admin /> },
    { path: '/oauth/yandex/callback', element: <OAuthYandexCallback /> },
    { path: '/oauth/google/callback', element: <OAuthGoogleCallback /> },
    { path: '/oauth/yandex/token', element: <YandexSuggestToken /> },
    ...ruFlatRoutes(),
    {
      path: '/:locale',
      element: <LocaleLayout />,
      children: localeChildRouteObjects,
    },
    { path: '*', element: <NotFound /> },
  ];
}
