import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import xss from 'xss';

const FORBIDDEN_REQUEST_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'connect',
  'connectOrCreate',
  'create',
  'createMany',
  'delete',
  'deleteMany',
  'disconnect',
  'set',
  'update',
  'updateMany',
  'upsert',
]);

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }
    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      return xss(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }
    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        if (FORBIDDEN_REQUEST_KEYS.has(key)) {
          throw new BadRequestException(`Request body contains a forbidden field: ${key}`);
        }
        sanitized[key] = this.sanitize((value as Record<string, unknown>)[key]);
      }
      return sanitized;
    }
    return value;
  }
}
