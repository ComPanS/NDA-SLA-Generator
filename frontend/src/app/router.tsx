import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { NewContract } from '@/pages/NewContract';
import { ContractView } from '@/pages/ContractView';
import { Billing } from '@/pages/Billing';
import { Templates } from '@/pages/Templates';
import { GuestContract } from '@/pages/GuestContract';
import { Admin } from '@/pages/Admin';
import { ADMIN_ROUTE } from '@/shared/constants';
import { OAuthYandexCallback } from '@/pages/OAuthYandexCallback';
import { YandexSuggestToken } from '@/pages/YandexSuggestToken';

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
    path: '/oauth/yandex/token',
    element: <YandexSuggestToken />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
