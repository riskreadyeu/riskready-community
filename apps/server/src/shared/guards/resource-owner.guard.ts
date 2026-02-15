import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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
      const model = (this.prisma as any)[resourceName];
      if (!model) {
        console.warn(`Resource model ${resourceName} not found`);
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
      console.error('ResourceOwnerGuard error:', error);
      return true;
    }
  }
}
