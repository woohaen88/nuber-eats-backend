import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit.user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<[boolean, string?]> {
    try {
      // check new user
      const exists = await this.users.findOneBy({
        email: email,
      });
      if (exists) {
        // make error
        return [false, 'There is a user with that email already'];
      }

      // create user
      await this.users.save(this.users.create({ email, password, role }));
      return [true];
    } catch (error) {
      // make error
      return [false, '저기여 계정을 만들수가 없어라'];
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // make a JWT and give it to the user

    try {
      // find the user with the email
      const user = await this.users.findOne({ where: { email: email } });
      if (!user) {
        return {
          ok: false,
          error: '없는 이메일로 로그인 하려구 하면 오또케~~',
        };
      }

      // check if the password is correct
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: '저기여~ 다른 패스워드를 입력하면 오또케',
        };
      }
      // make a JWT and give it to the user
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id: number): Promise<User> {
    return await this.users.findOneBy({ id: id });
  }

  async editProfile(userId: number, editProfileInput: EditProfileInput) {
    return await this.users.update({ id: userId }, { ...editProfileInput });
  }
}
