import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth';
import templateRoutes from './routes/templates';
import contractRoutes from './routes/contracts';
import billingRoutes from './routes/billing';
import adminRoutes from './routes/admin';
import noticeRoutes from './routes/notice';
import profileRoutes from './routes/profile';
import { startSubscriptionExpiryJob } from './lib/subscriptionCleanup';
import { securityHeaders } from './middleware/securityHeaders';

export function createApp() {
  const app = express();
  const allowAnyOrigin = env.corsOrigins.includes('*');
  app.use(securityHeaders);
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
  app.use('/notice', noticeRoutes);
  app.use('/profile', profileRoutes);
  app.use(env.adminRoute, adminRoutes);

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      void _next;
      console.error(err);
      res.status(500).json({ detail: 'Internal server error' });
    },
  );
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  // Start daily expiry checker
  startSubscriptionExpiryJob();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}
