import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
}

export const PageHeader = ({ title, subtitle, breadcrumbs, action }: PageHeaderProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 2 }}>
          {breadcrumbs.map((crumb, index) =>
            crumb.path ? (
              <MuiLink
                key={index}
                component={Link}
                to={crumb.path}
                underline="hover"
                color="inherit"
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={index} color="text.primary">
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
};
