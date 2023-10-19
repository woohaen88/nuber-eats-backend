import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import { CoreEntity } from 'src/common/entities/core.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Driver,
  Entity,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { Order } from 'src/orders/entitis/order.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(() => String) // for GraphQL
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field(() => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  verified: boolean;

  @Field(() => [Restaurant])
  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];

  // @Field(() => [Order], { nullable: true })
  @OneToMany(() => Order, (order) => order.customer)
  orders?: Order[];

  // @Field(()=>[Order])
  @OneToMany(() => Order, (order: Order) => order.driver)
  driver: Driver;

  // ========== METHOD ==========
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      const ok = await bcrypt.compare(aPassword, this.password);
      return ok;
    } catch (error) {
      console.log('checkPassword: ', error);
      throw new InternalServerErrorException();
    }
  }
}
