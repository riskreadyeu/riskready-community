import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const RESOURCE_KEY = 'resource';
export const PARAM_KEY = 'param';

export interface ResourceOwnerOptions {
  resource: string;
  param?: string;
  ownerField?: string;
}

export const CheckResourceOwner = (options: ResourceOwnerOptions) =>
  SetMetadata(RESOURCE_KEY, options);

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  private readonly logger = new Logger(ResourceOwnerGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<ResourceOwnerOptions>(
      RESOURCE_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const paramName = options.param || 'id';
    const resourceId = request.params[paramName];

    if (!resourceId) {
      return true;
    }

    const ownerField = options.ownerField || 'createdById';
    const resourceName = options.resource;

    try {
      const model = (this.prisma as unknown as Record<string, { findUnique: (args: { where: { id: string }; select: Record<string, boolean> }) => Promise<Record<string, unknown> | null> }>)[resourceName];
      if (!model) {
        this.logger.warn(`Resource model ${resourceName} not found`);
        return true;
      }

      const resource = await model.findUnique({
        where: { id: resourceId },
        select: { [ownerField]: true },
      });

      if (!resource) {
        return true;
      }

      if (resource[ownerField] !== userId) {
        throw new ForbiddenException(
          'You do not have permission to access this resource',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('ResourceOwnerGuard error', error instanceof Error ? error.stack : String(error));
      return true;
    }
  }
}
