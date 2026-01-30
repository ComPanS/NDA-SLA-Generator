import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@/app/theme';

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };
