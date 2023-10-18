import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ArgsType()
export class DeleteDishInput {
  @Field(() => Int)
  dishId: number;
}

@ObjectType()
export class DeleteDishOuput extends CoreOutput {}
