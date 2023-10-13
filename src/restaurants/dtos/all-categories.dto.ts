import { CoreOutput } from '../../common/dtos/output.dto';
import { Category } from '../entities/category.entity';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AllCategoriesOutput extends CoreOutput {
  @Field(() => [Category], { nullable: true })
  categories?: Category[];
}
