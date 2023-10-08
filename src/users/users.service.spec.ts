import { Test } from '@nestjs/testing';
import { UsersService } from './users.services';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
  findOneOrFail: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn(() => 'signed-token'),
  verify: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let jwtService: JwtService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
    jwtService = module.get<JwtService>(JwtService);
  });

  // service가 정의 되어야함
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: '',
      password: '',
      role: 0,
    };
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });
    it('should create a new user', async () => {
      // ========= mocking =========
      // User mock
      usersRepository.findOne.mockResolvedValue(undefined); // 유저를 찾았을 때 없다고 함.
      usersRepository.create.mockReturnValue(createAccountArgs); // create의 return값 생성.
      usersRepository.save.mockResolvedValue(createAccountArgs);

      // Verification mock
      verificationsRepository.create.mockReturnValue(createAccountArgs);
      verificationsRepository.save.mockResolvedValue({ code: 'code' });
      // ===========================

      const result = await service.createAccount(createAccountArgs);
      expect(usersRepository.create).toHaveBeenCalledTimes(1); // 함수를 한번만 콜해야함
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs); // 정해진 아규먼트를 call해야함

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        createAccountArgs,
      );

      expect(result).toMatchObject({ ok: true });
    });
    it('should fail on exception', async () => {
      // ========= mocking =========
      usersRepository.findOne.mockRejectedValue(new Error()); // 아무것도 리젝트하지 않음 -> 에러가 존재
      // ===========================

      const result = await service.createAccount(createAccountArgs); // fail할 코드
      expect(result).toMatchObject({
        ok: false,
        error: '저기여 계정을 만들수가 없어라',
      });
    });
  });

  describe('login', () => {
    // constant
    const loginArgs = {
      email: 'test@test.com',
      password: 'test.password',
    };

    it('should fail if user does not exist', async () => {
      // ========= mocking =========
      usersRepository.findOne.mockResolvedValue(null);

      // =========  test   =========
      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: false,
        error: '없는 이메일로 로그인 하려구 하면 오또케~~',
      });
    });
    it('should fail if the password is wrong', async () => {
      // users.findOne은 id, checkPassword function이 포함되어 있는 user object룰 return해야함
      // ========= mocking =========
      // user
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);

      // ========= test =========
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: '저기여~ 다른 패스워드를 입력하면 오또케',
      });
    });
    it('should return token if password correct', async () => {
      // ========= mocking =========
      // user
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);

      // ========= test =========
      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: 'signed-token' });
    });
    it('should be fail on exception when findone', async () => {
      // ========= mocking =========
      const error = new Error();
      usersRepository.findOne.mockRejectedValue(error);

      // ========= test =========
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error });
    });
  });
  describe('findById', () => {
    // ========= Arguments =========
    const findByIdArgs = {
      id: 1,
    };
    it('should find an existing user', async () => {
      // ========= mocking =========
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);

      // ========= test =========
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });
    it('should fail if no user is found', async () => {
      // ========= mocking =========
      usersRepository.findOneOrFail.mockRejectedValue(new Error());

      // ========= test =========
      const result = await service.findById(findByIdArgs.id);
      expect(result).toEqual({
        ok: false,
        error: '저기여 유저가 없어라!!',
      });
    });
  });
  describe('editProfile', () => {
    // ========= Argument =========
    const oldUser = {
      email: 'old@example.com',
      verified: true,
    };
    const editProfileArgs = {
      userId: 1,
      input: { email: 'new@example.com' },
    };
    const newVerification = {
      code: 'verifyCode',
    };
    const newUser = {
      verified: false,
      email: editProfileArgs.input.email,
    };
    const editChangePasswordArgs = {
      userId: 1,
      input: { password: 'new@enew.passwordxample.com' },
    };
    it('should change email', async () => {
      // ========== mocking ==========
      usersRepository.findOne.mockResolvedValue({
        ...oldUser,
      });
      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      // ========== test ==========
      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });

      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );
    });
    it('should change password', async () => {
      // ========== mocking ==========
      usersRepository.findOne.mockResolvedValue({
        password: 'old',
      });

      // ========== test ==========
      const result = await service.editProfile(
        editChangePasswordArgs.userId,
        editChangePasswordArgs.input,
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(
        editChangePasswordArgs.input,
      );
      expect(result).toEqual({ ok: true });
    });
    it('should fail on exception', async () => {
      // ========== mocking ==========
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(result).toEqual({
        ok: false,
        error: '저기여!! 유저 프로파일을 업데이트 할 수 없어요',
      });
    });
  });
  describe('emailVerify', () => {
    it('should verify email', () => {});
    it.todo('should fail on verification not found');
    it.todo('should fail on exception');
  });
});
