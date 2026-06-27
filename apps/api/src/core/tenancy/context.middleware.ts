import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { TenantContext } from './tenant-context';

/**
 * Establishes the AsyncLocalStorage request context at the very start of the
 * pipeline. Auth guards later patch in tenantId/userId/scope/permissions on the
 * same store object. A request id is generated if not supplied and echoed back.
 */
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContext) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('x-request-id', requestId);

    this.tenantContext.run(
      {
        requestId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      () => next(),
    );
  }
}
