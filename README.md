# Nuber Easts

The backend of Nuber Eats Clone

## User Model:

- id
- createdAt
- updatedAt

- email
- password
- role(client|owner|delivery)

## User CRUD:

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

---
외부라이브러리 Mocking  
`jwt.service.spec.ts`
```typescript
describe('이름', () => {  
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
it.todo('something');
it.todo('verify');
});
```

## Restaurant Model

- name  
- category
- address
- coverImage


## Category

- See Categories
- See Restaurants by Category (pagination)
- See Restaurants (pagination)
- See Restaurant

- Edit Restaurant
- Delete Restaurant

- Create Dish
- Edit Dish
- Delete Dish