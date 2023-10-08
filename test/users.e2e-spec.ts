import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as process from 'process';

// ========== constant ==========
const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'test@test.com',
  password: 'test123!@#',
};

// ==============================

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();

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
  it.todo('userProfile');
  it.todo('me');
  it.todo('emailVerify');
  it.todo('editProfile');
});
