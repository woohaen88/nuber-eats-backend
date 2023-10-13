import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

export type AllowedRoles = keyof typeof UserRole | 'Any';
// export function Role(roles: AllowedRoles[]): CustomDecorator<string> {
//   return SetMetadata('roles', roles);
// }

export const Role = (roles: AllowedRoles[]) => SetMetadata('roles', roles);
