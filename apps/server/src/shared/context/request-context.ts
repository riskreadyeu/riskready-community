import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextData {
  userId?: string;
  userEmail?: string;
  organisationId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContextData>();

export class RequestContext {
  static current(): RequestContextData | undefined {
    return requestContextStorage.getStore();
  }

  static userId(): string | undefined {
    return requestContextStorage.getStore()?.userId;
  }

  static userEmail(): string | undefined {
    return requestContextStorage.getStore()?.userEmail;
  }

  static organisationId(): string | undefined {
    return requestContextStorage.getStore()?.organisationId;
  }

  static requestId(): string | undefined {
    return requestContextStorage.getStore()?.requestId;
  }
}
