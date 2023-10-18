import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
class DishChoice {
  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  extra?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
  @Field(() => String)
  name: string;

  @Field(() => [DishChoice], { nullable: true })
  choices?: DishChoice[];

  @Field(() => Int, { nullable: true })
  extra: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  name: string;

  @Column()
  @Field(() => Int)
  @IsInt()
  price: number;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  photo?: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  @Length(0, 150)
  description?: string;

  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Field(() => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];
}

/**
 * 구조화된 데이터를 저장
 * 특정형태를 가진 데이터를 저장
 * 새로운 Entity안에 새로운 테이블을 만들때
 * 새로운 entity 안에 새로운 테이블을 생성하면 find, create, delete, update, count 등을 또
 * 만들어야함
 *
 * JSON은 mysql, postgresql에서 지원하는 데이터 Type
 * */
