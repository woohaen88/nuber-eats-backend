import { CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // console.log(context); // nestjs pipeline context
    const gqlcontext = GqlExecutionContext.create(context).getContext();
    const user = gqlcontext['user'];
    if (!user) {
      return false;
    }

    return true;
  }
}
