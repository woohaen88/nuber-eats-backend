import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.services';
import { UsersResolver } from './users.resolver';
import { ConfigService } from '@nestjs/config';
import { Verification } from './entities/verification.user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Verification])],
  providers: [UsersService, UsersResolver, ConfigService],
  exports: [UsersService],
})
export class UsersModule {}
