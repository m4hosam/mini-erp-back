import { HttpException, HttpStatus } from '@nestjs/common';

export class ConflictException extends HttpException {
  constructor(error: { key: string; message: string }, details?: any) {
    super(
      {
        messageKey: error.key,
        message: error.message,
        details,
      },
      HttpStatus.CONFLICT,
    );
  }
}
