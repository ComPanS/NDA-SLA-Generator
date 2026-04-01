import { Box, Typography } from '@mui/material';
import type { LegalBlock } from './legalTypes';

export function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'p') {
          return (
            <Typography key={index} variant="body1" paragraph>
              {block.text}
            </Typography>
          );
        }
        if (block.type === 'h6') {
          return (
            <Typography key={index} variant="h6" sx={{ mt: index > 0 ? 2 : 0 }}>
              {block.text}
            </Typography>
          );
        }
        return (
          <Box key={index} component="ul" sx={{ pl: 3, my: 1 }}>
            {block.items.map((item, j) => (
              <Typography
                key={`${index}-${j}`}
                component="li"
                variant="body1"
                paragraph
                sx={{ display: 'list-item' }}
              >
                {item}
              </Typography>
            ))}
          </Box>
        );
      })}
    </>
  );
}
