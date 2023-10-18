/**
 * restaurantId 가 필요
 * dish를 추가하려고 하면 어떤 레스토랑인지가 필요
 */

import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType('CreateDishInputType', { isAbstract: true })
export class CreateDishInput extends PickType(Dish, [
  'name',
  'price',
  'description',
  'options',
]) {
  @Field(() => Int)
  restaurantId: number;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
