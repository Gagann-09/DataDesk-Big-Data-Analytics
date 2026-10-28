/**
 * Express 5 application factory.
 *
 * Routes are mounted on /api. Errors are translated to stable JSON error
 * responses; file contents, credentials, and stack traces never leave the
 * server (rules.md §7, Architecture §9).
 */

import express from 'express';
import { createUploadRoute } from './routes/datasets';
import type { UploadDependencies } from './types';
import { isAppError } from './errors';

export function createApp(deps: UploadDependencies) {
  const app = express();

  app.get('/api/health', (_req, res) => {
    const ready = deps.repository.isConnected();
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ok' : 'degraded',
      service: 'datadesk-backend',
      components: {
        mongodb: ready ? 'ready' : 'unavailable',
      },
    });
  });

  app.use('/api', createUploadRoute(deps));

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (isAppError(err)) {
      return res.status(err.statusCode).json({ error: err.code, message: err.message });
    }
    // Unexpected errors: stable client-facing message, no internals leaked.
    res.status(500).json({ error: 'internal', message: 'An unexpected error occurred.' });
  });

  return app;
}
