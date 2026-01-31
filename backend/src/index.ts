import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth';
import templateRoutes from './routes/templates';
import contractRoutes from './routes/contracts';
import billingRoutes from './routes/billing';
import adminRoutes from './routes/admin';

export function createApp() {
  const app = express();
  const allowAnyOrigin = env.corsOrigins.includes('*');
  app.use(
    cors({
      origin: allowAnyOrigin ? true : env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/templates', templateRoutes);
  app.use('/contracts', contractRoutes);
  app.use('/billing', billingRoutes);
  app.use(env.adminRoute, adminRoutes);

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      // eslint-disable-next-line no-console
      console.error(err);
      res.status(500).json({ detail: 'Internal server error' });
    },
  );
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}
