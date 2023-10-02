import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateAccountInput } from './dtos/create-account.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<string | undefined> {
    try {
      // check new user
      const exists = await this.users.findOneBy({
        email: email,
      });
      if (exists) {
        // make error
        return 'There is a user with that email already';
      }

      // create user
      await this.users.save(this.users.create({ email, password, role }));
    } catch (error) {
      // make error
      return '저기여 계정을 만들수가 없어라';
    }
  }
}