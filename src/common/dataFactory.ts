import { faker } from '@faker-js/faker';
import { proposeNegativeCases } from '../mcp/swaggerClient';

export const PetFactory = {
  valid() {
    return {
      name: faker.person.firstName(),
      photoUrls: ['http://example.com/img.jpg'],
      status: 'available'
    };
  },
  negativeFromMCP() {
    return proposeNegativeCases('POST /pet');
  }
};

export const UserFactory = {
  valid(username?: string) {
    const u = username ?? (faker.internet.username() as string).replace(/\W+/g, '');
    return {
      id: faker.number.int({ min: 1, max: 1_000_000 }),
      username: u,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number()
    };
  }
};

export const OrderFactory = {
  valid() {
    return {
      id: faker.number.int({ min: 1, max: 1_000_000 }),
      petId: faker.number.int({ min: 1, max: 1_000_000 }),
      quantity: faker.number.int({ min: 1, max: 5 }),
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: false
    };
  }
};
