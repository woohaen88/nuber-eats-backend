import { Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

type UserRole = 'client' | 'owner' | 'delivery';

@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsEmail()
  email: string;

  @Field(() => String)
  @Column()
  password: string;

  @Field(() => String)
  @Column()
  role: UserRole;
}
