import { NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

const METRIC_PREFIX = 'qms_backend_';

const registry = new Registry();

collectDefaultMetrics({
  prefix: METRIC_PREFIX,
  register: registry,
});

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry],
});

function normalizeRoute(req: Request): string {
  if (req.route && typeof req.route.path === 'string') {
    return req.route.path;
  }

  if (req.path === '/graphql') {
    return '/graphql';
  }

  return req.path || 'unknown';
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
    const statusCode = String(res.statusCode);
    const route = normalizeRoute(req);
    const labels = { method: req.method, route, status_code: statusCode };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}

export function getMetricsContentType(): string {
  return registry.contentType;
}

export async function getMetricsSnapshot(): Promise<string> {
  return registry.metrics();
}
