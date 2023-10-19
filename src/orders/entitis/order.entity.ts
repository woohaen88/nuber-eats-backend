import {
  Field,
  Float,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  /**
   * order는 한명의 customer를 가짐, => ManyToOne()
   * user는 여러개의 order가 가능
   */
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @Field(() => User, { nullable: true }) // 주문을 하면 바로 배달하는 사람이 배정되지 않음
  @ManyToOne(() => User, (user) => user.driver, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @Field(() => Restaurant, { nullable: true })
  @ManyToOne(() => Restaurant, (restaurant: Restaurant) => restaurant.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  restaurant: Restaurant;

  @RelationId((order: Order) => order.restaurant)
  restaurantId: number;

  @Field(() => [Dish])
  @ManyToMany(() => Dish)
  @JoinTable()
  dishes: Dish[];

  @Field(() => Float)
  total: number;

  @Field(() => OrderStatus)
  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;
}
