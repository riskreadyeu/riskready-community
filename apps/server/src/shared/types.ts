import { Request } from 'express';

export interface JwtUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  organisationId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtUser;
}
