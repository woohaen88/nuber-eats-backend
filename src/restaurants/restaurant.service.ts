import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
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
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { CreateDishInput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { DeleteDishInput } from './dtos/delete-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';

const PAGE_SIZE = 3;

@Injectable()
export class RestaurantService {
  // Repository Inject
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    @InjectRepository(Category)
    private readonly categories: Repository<Category>,

    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

  async getOrCreateCategory(name: string) {
    const categoryName = name.trim().toLowerCase();

    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.categories.findOne({
      where: { slug: categorySlug },
    });

    if (!category) {
      category = await this.categories.save(
        this.categories.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }

  async findByRestaurantId({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });

      if (!restaurant) {
        return {
          ok: false,
          error: '해당 레스토랑은 없어라~',
        };
      }

      return {
        ok: true,
        result: restaurant,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        error: '레스토랑을 불러올 수 없어용~',
      };
    }
  }

  async findBySearchName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw((name) => `${name} ILIKE '%${query}%'`),
        },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      });

      if (!restaurants) {
        return {
          ok: false,
          error: '해당 레스토랑이 없어영~~',
        };
      }

      return {
        ok: true,
        result: restaurants,
        totalPage: ~~(totalResults / PAGE_SIZE) + 1,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
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
    } catch (error) {
      return {
        ok: false,
        error,
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
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.getOrCreateCategory(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: '흠.... restaurant를 수정할수가 없어요~',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOneOrFail({
        where: { id: deleteRestaurantInput.restaurantId },
      });

      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '저기여 남에껄 지울라고하면 오또케',
        };
      }

      this.restaurants.delete({ id: restaurant.id });
      return {
        ok: true,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  // ========== category ==========

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        error: '카테고리를 불러올 수 없어영',
      };
    }
  }

  async countRestaurants(category: Category) {
    let restaurants: Restaurant[];
    await this.restaurants.find({ loadRelationIds: true }).then((res) => {
      restaurants = res.filter((arg) => arg.categoryId === category.id);
      return restaurants;
    });

    return restaurants.length;
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug },
        relations: ['restaurants'],
      });
      if (!category) {
        return {
          ok: false,
          error: '카테고리를 찾을 수가 없어라~',
        };
      }

      const restaurants = await this.restaurants.find({
        where: { category: { id: category.id } },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        relations: ['category'],
      });

      category.restaurants = restaurants;
      const totalResult = await this.countRestaurants(category);
      return {
        ok: true,
        category,
        totalPage: ~~(totalResult / PAGE_SIZE) + 1,
      };
    } catch (error) {
      console.log('restaurant.service', error);
      return {
        ok: false,
        error: '카테고리를 불어올수 없어용~',
      };
    }
  }
  async allRestaruants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      });
      return {
        ok: true,
        totalPage: ~~(totalResults / PAGE_SIZE) + 1,
        results: restaurants,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  // Dish
  /**
   * 1. Restaurant를 찾고
   * 2. owner와 restaurant의 owner가 같은지 확인
   * 3. dish를 생성
   * 4. restaurant에 dish를 추가
   */
  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createDishInput.restaurantId },
      });

      if (!restaurant) {
        return {
          ok: false,
          error: '레스토랑이 존재하지 않아용',
        };
      }

      if (restaurant.ownerId != owner.id) {
        return {
          ok: false,
          error: '저기여~ 레스토랑 주인이 아닌거 같은데엽~',
        };
      }

      await this.dishRepository.save(
        this.dishRepository.create({ ...createDishInput, restaurant }),
      );
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: 'dish를 만들수가 없어요' };
    }
  }

  /**
   * 1. Restaurant를 찾고
   * 2. owner와 restaurant의 owner가 같은지 확인
   * 3. dish를 삭제
   */
  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const dish = await this.dishRepository.findOneOrFail({
        where: {
          id: dishId,
        },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: 'dish를 찾을 수가 없어라',
        };
      }

      if (owner.id != dish.restaurant.ownerId) {
        return {
          ok: false,
          error: '남에껄 지울순 없어요',
        };
      }

      this.dishRepository.delete({ id: dish.id });
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'dish를 삭제할 수가 없습니다.',
      };
    }
  }

  /**
   * 1. Restaurant를 찾고
   * 2. owner와 restaurant의 owner가 같은지 확인
   * 3. dish를 업데이트
   */
  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishRepository.findOne({
        where: { id: editDishInput.dishId },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: 'dish를 찾을 수가 없어라',
        };
      }

      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: '남에껄 수정할라하면 오또케',
        };
      }

      this.dishRepository.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'dish를 수정할 수 없으셈',
      };
    }
  }
}
