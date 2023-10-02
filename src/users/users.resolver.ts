import { Query, Resolver } from '@nestjs/graphql';

import { User } from './entities/user.entity';
import { UsersService } from './users.services';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Query(() => Boolean)
  hi() {
    return true;
  }
}
