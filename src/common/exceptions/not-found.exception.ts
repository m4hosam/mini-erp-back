import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(error: { key: string; message: string }, details?: any) {
    super(
      {
        messageKey: error.key,
        message: error.message,
        details,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
