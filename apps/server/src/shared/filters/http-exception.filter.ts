import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

/** Error names from Prisma that must never leak to clients. */
const PRISMA_ERROR_NAMES = new Set([
  'PrismaClientKnownRequestError',
  'PrismaClientUnknownRequestError',
  'PrismaClientValidationError',
  'PrismaClientInitializationError',
  'PrismaClientRustPanicError',
]);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        // Only pass through string messages to avoid leaking validation details
        message = typeof responseObj['message'] === 'string'
          ? responseObj['message']
          : message;
        error = (responseObj['error'] as string) || exception.name;
      }
    } else if (exception instanceof Error) {
      // Log the full error internally for debugging
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );

      // Suppress internal details from client responses
      if (PRISMA_ERROR_NAMES.has(exception.constructor.name)) {
        message = 'A database error occurred';
        error = 'DatabaseError';
      } else if (exception.name === 'SyntaxError' && exception.message.includes('JSON')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid request body';
        error = 'Bad Request';
      } else if (exception.name === 'PayloadTooLargeError' || exception.message.includes('entity too large')) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = 'Request payload too large';
        error = 'Payload Too Large';
      } else {
        // Generic fallback — never leak internal error messages
        message = 'Internal server error';
        error = 'Internal Server Error';
      }
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error for monitoring
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
