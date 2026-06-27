import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Maps any error to an RFC 9457 Problem Details JSON response, attaches the
 * request id, and logs server errors. Never leaks internals on 5xx.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = (res.getHeader('x-request-id') as string) ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail: string | undefined;
    let code = 'INTERNAL_ERROR';
    let errors: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        title = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        title = (b.error as string) ?? exception.message;
        detail = Array.isArray(b.message)
          ? undefined
          : (b.message as string) ?? undefined;
        if (Array.isArray(b.message)) errors = b.message;
        code = (b.code as string) ?? httpStatusToCode(status);
      }
    } else if (exception instanceof Error) {
      detail = undefined; // do not leak on 5xx
      this.logger.error(`${exception.name}: ${exception.message}`, exception.stack);
    }

    if (status >= 500) {
      this.logger.error(`Unhandled ${status} on ${req.method} ${req.url} [${requestId}]`);
    }

    res.status(status).json({
      type: `https://travelos.ai/errors/${code.toLowerCase()}`,
      title,
      status,
      code: code || httpStatusToCode(status),
      ...(detail ? { detail } : {}),
      ...(errors ? { errors } : {}),
      requestId,
    });
  }
}

function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
  };
  return map[status] ?? 'INTERNAL_ERROR';
}
