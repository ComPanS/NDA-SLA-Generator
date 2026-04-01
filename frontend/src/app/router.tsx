import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
import { Admin } from '@/pages/Admin';
import { Profile } from '@/pages/Profile';
import { ADMIN_ROUTE } from '@/shared/constants';
import { OAuthYandexCallback } from '@/pages/OAuthYandexCallback';
import { OAuthGoogleCallback } from '@/pages/OAuthGoogleCallback';
import { YandexSuggestToken } from '@/pages/YandexSuggestToken';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfUse } from '@/pages/TermsOfUse';
import { NotFound } from '@/pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/terms',
    element: <TermsOfUse />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/guest-contract',
    element: <GuestContract />,
  },
  {
    path: '/new-contract',
    element: <NewContract />,
  },
  {
    path: '/contract/:id',
    element: <ContractView />,
  },
  {
    path: '/billing',
    element: <Billing />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/templates',
    element: <Templates />,
  },
  {
    path: ADMIN_ROUTE,
    element: <Admin />,
  },
  {
    path: '/oauth/yandex/callback',
    element: <OAuthYandexCallback />,
  },
  {
    path: '/oauth/google/callback',
    element: <OAuthGoogleCallback />,
  },
  {
    path: '/oauth/yandex/token',
    element: <YandexSuggestToken />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
