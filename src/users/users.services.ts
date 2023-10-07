import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import {
  EditProfileInput,
  EditProfileOutput,
} from './dtos/edit.user-profile.dto';
import { Verification } from './entities/verification.user.entity';
import { UserProfileOutout } from './dtos/user-profile.dto';
import { EmailVerifyOutput } from './dtos/verify-email.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      // check new user
      const exists = await this.users.findOneBy({
        email: email,
      });
      if (exists) {
        // make error
        return { ok: false, error: 'There is a user with that email already' };
      }

      // create user
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      await this.verifications.save(this.verifications.create({ user }));
      return { ok: true };
    } catch (error) {
      // make error
      return { ok: false, error: '저기여 계정을 만들수가 없어라' };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    // make a JWT and give it to the user

    try {
      // find the user with the email
      const user = await this.users.findOne({
        where: { email },
        select: ['password', 'id'],
      });
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

  async findById(id: number): Promise<UserProfileOutout> {
    try {
      const user = await this.users.findOne({ where: { id } });
      if (user) {
        return {
          ok: true,
          user: user,
        };
      }
    } catch (error) {
      console.log('[ERROR] -> users.services.findById : ', error);
      return {
        ok: false,
        error: '저기여 유저가 없어라!!',
      };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne({ where: { id: userId } });
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verifications.save(this.verifications.create({ user }));
      }

      if (password) {
        user.password = password;
      }

      await this.users.save(user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: '저기여!! 유저 프로파일을 업데이트 할 수 없어요',
      };
    }
  }

  async emailVerify(code: string): Promise<EmailVerifyOutput> {
    try {
      const verification = await this.verifications.findOne({
        where: {
          code,
        },
        relations: ['user'],
      });

      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);
        return { ok: true };
      }
      return { ok: false, error: '이메일 인증 실패했어라!' };
    } catch (error) {
      console.log('[ERROR] -> user.service.emailVerify: ', error);
      return { ok: false, error };
    }
  }
}
