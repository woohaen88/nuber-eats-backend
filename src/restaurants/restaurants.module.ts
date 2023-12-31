import { Module } from '@nestjs/common';
import { CategoryResolver, restaurantResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [restaurantResolver, RestaurantService, CategoryResolver],
})
export class RestaurantsModule {}
