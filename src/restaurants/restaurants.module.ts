import { Module } from '@nestjs/common';
import { restaurantResolver } from './restaurants.resolver';

@Module({
  providers: [restaurantResolver],
})
export class RestaurantsModule {}
