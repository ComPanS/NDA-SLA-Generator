export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  NEW_CONTRACT: '/new-contract',
  CONTRACT_VIEW: (id: string) => `/contract/${id}`,
  BILLING: '/billing',
} as const;
