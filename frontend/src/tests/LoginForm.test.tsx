import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Login from '../pages/Login';

test('login form renders and validates', async () => {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <Login />
    </QueryClientProvider>,
  );

  const submit = screen.getByRole('button', { name: /войти/i });
  await userEvent.click(submit);
  expect(screen.getByText(/email/i)).toBeInTheDocument();
});
