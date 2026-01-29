import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import NewContract from '../pages/NewContract';

test('new contract form shows prompt field', async () => {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <NewContract />
    </QueryClientProvider>,
  );

  expect(screen.getByLabelText(/Промпт/i)).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/Название/i), 'Test NDA');
});
