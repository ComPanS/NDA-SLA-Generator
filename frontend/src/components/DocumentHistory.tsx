import { useState } from 'react';
import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

type HistoryItem = {
  id: string;
  title: string;
  updated_at: string;
};

// Placeholder data; replace with fetch from API
const mockHistory: HistoryItem[] = [
  { id: '1', title: 'NDA для партнера', updated_at: '2026-01-01' },
  { id: '2', title: 'SLA для клиента', updated_at: '2026-01-15' },
];

export default function DocumentHistory() {
  const [items] = useState<HistoryItem[]>(mockHistory);

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">История документов</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Обновлён</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.updated_at}</TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined">
                  Открыть
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
