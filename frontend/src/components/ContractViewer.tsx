import { Paper, Stack, Typography } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type Props = {
  content: string;
  riskReport?: string[];
};

export default function ContractViewer({ content, riskReport }: Props) {
  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Документ
        </Typography>
        <ReactQuill value={content} readOnly theme="snow" />
      </Paper>
      {riskReport && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Риски</Typography>
          <ul>
            {riskReport.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </Paper>
      )}
    </Stack>
  );
}
