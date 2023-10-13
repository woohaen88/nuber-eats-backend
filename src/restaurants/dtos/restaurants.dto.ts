import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';
import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';

@ArgsType()
export class RestaurantsInput extends PaginationInput {}

@ObjectType()
export class RestaurantsOutput extends PaginationOutput {
  @Field(() => [Restaurant])
  results?: Restaurant[];
}
