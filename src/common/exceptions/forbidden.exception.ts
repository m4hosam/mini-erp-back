import { HttpException, HttpStatus } from '@nestjs/common';

export class ForbiddenException extends HttpException {
  constructor(
    error: { key: string; message: string } = {
      key: 'INSUFFICIENT_PERMISSIONS',
      message: 'Insufficient permissions',
    },
    details?: any,
  ) {
    super(
      {
        messageKey: error.key,
        message: error.message,
        details,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
