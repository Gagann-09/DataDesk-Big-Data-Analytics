/**
 * DataDesk Phase 1 backend entry point.
 *
 * Starts the Express 5 API bound to loopback only, connects to MongoDB
 * (degrades gracefully when unavailable), and serves the single upload
 * endpoint POST /api/datasets plus GET /api/health.
 */

import { createServer } from 'node:http';
import { createApp } from './app';
import { config } from './config';
import { MongoDatasetRepository } from './services/mongo';
import { WebHdfsDatasetStore } from './services/store';
import type { UploadDependencies } from './types';

async function main(): Promise<void> {
  // Fail fast when MongoDB is absent so the API still boots in degraded mode
  // (health reports unavailable; registration returns 503) instead of hanging
  // on the driver's default 30s server-selection timeout.
  const repository = new MongoDatasetRepository(config.mongodbUri, config.mongodbDb, {
    serverSelectionTimeoutMS: 3000,
  });
  let connected = false;

  try {
    await repository.connect();
    await repository.ensureIndexes();
    connected = true;
    console.log('[datadesk] MongoDB connected:', config.mongodbDb);
  } catch (err) {
    // Degraded mode: health reports mongodb unavailable, upload returns 503.
    console.error(
      '[datadesk] MongoDB unavailable; registration degraded:',
      err instanceof Error ? err.message : String(err),
    );
  }

  const store = new WebHdfsDatasetStore({
    webhdfsBase: config.webhdfsBase,
    webhdfsUser: config.webhdfsUser,
  });

  // Startup reconciliation repairs interrupted uploads (PRD §11 / Architecture §6).
  if (connected) {
    try {
      const report = await repository.reconcile(store);
      if (report.versionsRecovered || report.claimsCleared) {
        console.log('[datadesk] reconciliation:', JSON.stringify(report));
      }
    } catch (err) {
      console.error(
        '[datadesk] reconciliation failed:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  const deps: UploadDependencies = { repository, store, config };
  const app = createApp(deps);
  const server = createServer(app);

  server.listen(config.port, config.host, () => {
    console.log(
      `[datadesk] backend listening on ${config.host}:${config.port} (env=${config.nodeEnv}, mongodb=${connected ? 'ready' : 'unavailable'})`,
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`[datadesk] received ${signal}, shutting down`);
    server.close(async () => {
      try {
        await repository.close();
      } catch {
        // ignore
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[datadesk] fatal:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
