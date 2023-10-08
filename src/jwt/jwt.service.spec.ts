import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';
import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from './jwt.constants';

// ======== Constant ========
const TEST_KEY = 'testKey';
const USER_ID = 1;

// ========= external module mocking ==========
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
    verify: jest.fn(() => ({ id: USER_ID })),
  };
});

describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { SECRET_KEY: TEST_KEY },
        },
      ], // Dependencies Injection
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('sign', () => {
    it('should return a sign token', () => {
      // ============= test =============
      const token = service.sign(USER_ID);
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_KEY);
    });
  });
  describe('verify', () => {
    it('should return the decoded token', () => {
      // ============== constant ===============
      const TOKEN = 'TOKEN';
      // ============== test ===============
      const decodedToken = service.verify('TOKEN');
      expect(decodedToken).toEqual({ id: USER_ID });
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
    });
  });
});
