import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import * as process from 'process';
import { User } from '../src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from '../src/users/entities/verification.user.entity';

// ========== constant ==========
const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'test@test.com',
  password: 'test123!@#',
};

// ==============================

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verifyRepository: Repository<Verification>;
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verifyRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );

    await app.init();
  });

  afterAll(async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const connection = await dataSource.initialize();
    await connection.dropDatabase();
    await connection.destroy();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email: "${testUser.email}",
              password: "${testUser.password}",
              role: Owner,
            }){
              error
              ok
            }
        }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        }));
    it('should fail if account already exists', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email: "${testUser.email}",
              password: "${testUser.password}",
              role: Owner,
            }){
              error
              ok
            }
        }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(false);
          expect(error).toBe('There is a user with that email already');
        }));
  });
  describe('login', () => {
    it('should login with correct credentials', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            login(input: {
              email: "${testUser.email}",
              password: "${testUser.password}"
            }){
              ok
              error
              token
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(token).toEqual(expect.any(String));
          jwtToken = token;
        }));
    it('should not be able to login with wrong credentials', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            login(input: {
              email: "${testUser.email}",
              password: "wrongPassword"
            }){
              ok
              error
              token
            }
          }`,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;
          expect(ok).toBe(false);
          expect(error).toBe('저기여~ 다른 패스워드를 입력하면 오또케');
          expect(token).toBe(null);
        }));
  });
  describe('userProfile', () => {
    /**
     * userProfile test 이전에 database에 접근해서 db를 가지고옴
     * beforAll hook으로 DB에 접근해서 가지고옴
     * 처음 테스트할때 usersRespository를 가지고옴
     */
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it("should see a user's profile", () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
      {
        userProfile(userId:${userId}){
          error
          ok
          user{
            id
          }
        }
    }`,
        })
        .expect(200)
        .expect((res) => {
          const { error, ok, user } = res.body.data.userProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(user.id).toBe(userId);
        }));
    it('should not find a profile', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          {
            userProfile(userId:333){
              error
              ok
              user{
                id
              }
            }
        }`,
        })
        .expect(200)
        .expect((res) => {
          const { error, ok, user } = res.body.data.userProfile;
          expect(ok).toBe(false);
          expect(error).toBe('저기여 유저가 없어라!!');
          expect(user).toBe(null);
        }));
  });
  describe('me', () => {
    it('should find my profile', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          {
            me {
              email
            }
          }
      `,
        })
        .expect(200)
        .expect((res) => {
          const { email } = res.body.data.me;
          expect(email).toBe(testUser.email);
        }));
    it('should not allow logged out user', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          {
            me {
              email
            }
          }
      `,
        })
        .expect(200)
        .expect((res) => {
          const { errors } = res.body;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        }));
  });

  describe('emailVerify', () => {
    let code: string;
    /**
     * DB 접근
     * */
    beforeAll(async () => {
      const [verification] = await verifyRepository.find();
      code = verification.code;
    });
    it('should be email verify', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          mutation{
            emailVerify(input: {
              code: "${code}"
            }){
              error
              ok
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.emailVerify;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        }));

    it('should not be email verify', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          mutation{
            emailVerify(input: {
              code: "${code}"
            }){
              error
              ok
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.emailVerify;
          expect(ok).toBe(false);
          expect(error).toBe('이메일 인증 정보를 받을수가 없어라!!');
        }));
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'new@example.com';
    it('should change email', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          mutation {
              editProfile(input:{
                email: "${NEW_EMAIL}"
              }) {
                ok
                error
              }
            }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        }));

    it('should have new email', () =>
      request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          {
            me {
              email
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const { email } = res.body.data.me;
          expect(email).toBe(NEW_EMAIL);
        }));
  });
});
