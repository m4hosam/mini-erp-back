import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  data: null;
  error: {
    messageKey: string;
    message: string;
    details?: any;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageKey = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal Server Error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = exception.message;

      if (
        typeof exceptionResponse === 'object' &&
        'messageKey' in exceptionResponse
      ) {
        messageKey = (exceptionResponse as any).messageKey;
        if ('message' in exceptionResponse) {
          message = (exceptionResponse as any).message;
        }
        details = (exceptionResponse as any).details;
      } else if (typeof exceptionResponse === 'string') {
        messageKey = exceptionResponse;
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        // Handle class-validator errors
        const messages = (exceptionResponse as any).message;
        if (Array.isArray(messages) && messages.length > 0) {
          messageKey = 'VALIDATION_ERROR';
          message = messages[0];
          details = { validationErrors: messages };
        } else {
          messageKey = (exceptionResponse as any).message;
          message = (exceptionResponse as any).message;
        }
      }
    } else if (exception instanceof Error) {
      const util = require('util');
      console.log(
        'FULL ERROR INSPECT:',
        util.inspect(exception, { depth: null, colors: true }),
      );
      this.logger.error(exception.message, exception.stack);
      messageKey = 'INTERNAL_SERVER_ERROR';
      message = exception.message;
      details = undefined;
    }

    const errorResponse = {
      data: null,
      error: {
        messageKey,
        message,
        details,
      },
    };

    this.logger.error(
      `${request.method} ${request.url} - Status: ${statusCode} - MessageKey: ${messageKey}`,
    );

    response.status(statusCode).json(errorResponse);
  }
}
