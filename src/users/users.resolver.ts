import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { User } from './entities/user.entity';
import { UsersService } from './users.services';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/auth-user.decorators';
import { UserProfileInput, UserProfileOutout } from './dtos/user-profile.dto';
import {
  EditProfileInput,
  EditProfileOutput,
} from './dtos/edit.user-profile.dto';
import { EmailVerifyInput, EmailVerifyOutput } from './dtos/verify-email.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Query(() => Boolean)
  hi() {
    return true;
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      const [ok, error] =
        await this.userService.createAccount(createAccountInput);
      return {
        ok,
        error,
      };
    } catch (error) {
      return {
        error,
        ok: false,
      };
    }
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return await this.userService.login(loginInput);
    } catch (error) {
      console.log('resolver->login: ', error);
      return {
        ok: false,
        error,
      };
    }
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @UseGuards(AuthGuard)
  @Query(() => UserProfileOutout)
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutout> {
    try {
      const user = await this.userService.findById(userProfileInput.userId);
      if (!user) throw Error();
      return {
        ok: true,
        user: user,
      };
    } catch (error) {
      return {
        error: '저기여! 유저가 없어용!!',
        ok: false,
      };
    }
  }

  @Mutation(() => EditProfileOutput)
  @UseGuards(AuthGuard)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      await this.userService.editProfile(authUser.id, editProfileInput);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'error',
      };
    }
  }

  @Mutation(() => EmailVerifyOutput)
  async emailVerify(
    @Args('input') emailVeryfyInput: EmailVerifyInput,
  ): Promise<EmailVerifyOutput> {
    try {
      await this.userService.emailVerify(emailVeryfyInput.code);
      return {
        ok: true,
      };
    } catch (error) {
      console.log('[ERROR] -> users.resolver.emailVerify', error);
      return {
        ok: false,
        error,
      };
    }
  }
}
