import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './output.dto';

@ArgsType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field(() => Int, { nullable: true })
  totalPage?: number;
}
