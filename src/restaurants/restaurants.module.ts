import { Module } from '@nestjs/common';
import {
  CategoryResolver,
  DishResolver,
  restaurantResolver,
} from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    restaurantResolver,
    RestaurantService,
    CategoryResolver,
    DishResolver,
  ],
})
export class RestaurantsModule {}
