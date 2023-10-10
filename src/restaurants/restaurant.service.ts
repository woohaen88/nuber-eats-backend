import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { User } from '../users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';

@Injectable()
export class RestaurantService {
  // Repository Inject
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async getOrCreateCategory(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase(); // 앞뒤 공백제거 -> 소문자 변환
    const categorySlug = categoryName.replace(/ /g, '-'); // 공백 -> -
    let category = await this.categories.findOne({
      where: { slug: categorySlug },
    });
    if (!category) {
      // 카테고리가 없으면 생성
      category = await this.categories.save(
        this.categories.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      newRestaurant.category = await this.getOrCreateCategory(
        createRestaurantInput.categoryName,
      );
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '레스토라을 만들수가 없어라~~',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaunant = await this.restaurants.findOne({
        where: { id: editRestaurantInput.restaurantId },
      });
      if (!restaunant)
        return {
          ok: false,
          error: '저기여!! 해당 restaurant가 존재하지 않아여',
        };

      // check owner
      if (owner.id !== restaunant.ownerId) {
        return {
          ok: false,
          error: '저기여~!! 남에껄 수정할라면 오또케~',
        };
      }
      // edit restaurant logic
      if (editRestaurantInput.categoryName) {
        restaunant.category = await this.getOrCreateCategory(
          editRestaurantInput.categoryName,
        );
        return {
          ok: true,
        };
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: '흠.... restaurant를 수정할수가 없어요~',
      };
    }
  }
}
