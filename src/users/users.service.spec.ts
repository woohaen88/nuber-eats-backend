import { Test } from '@nestjs/testing';
import { UsersService } from './users.services';

describe('UserService', () => {
  let service: UsersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  // service가 정의 되어야함
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it.todo('createAccount');
  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
  it.todo('emailVerify');
});
