import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Verification } from '../entities/verification.user.entity';

@ObjectType()
export class EmailVerifyOutput extends CoreOutput {}

@InputType()
export class EmailVerifyInput extends PickType(Verification, ['code']) {}
