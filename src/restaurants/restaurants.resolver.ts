import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class restaurantResolver {
  @Query(() => Boolean)
  isPizzaGood(): boolean {
    return true;
  }
}
