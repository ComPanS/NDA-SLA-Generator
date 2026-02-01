const rawAdminRoute = import.meta.env.VITE_ADMIN_ROUTE || '/internal-admin';
export const ADMIN_ROUTE = rawAdminRoute.startsWith('/') ? rawAdminRoute : `/${rawAdminRoute}`;
