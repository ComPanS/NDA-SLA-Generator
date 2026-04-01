import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { buildAppRouteObjects } from './routesConfig';

const router = createBrowserRouter(buildAppRouteObjects());

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
