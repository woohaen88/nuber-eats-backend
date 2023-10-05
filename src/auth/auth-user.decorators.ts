import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const gqlcontext = GqlExecutionContext.create(context).getContext();
    const user = gqlcontext['user'];
    return user;
  },
);
