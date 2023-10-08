import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

type AllowedRoles = keyof typeof UserRole | 'Any';
export function Role(roles: AllowedRoles[]): CustomDecorator<string> {
  return SetMetadata('roles', roles);
}
