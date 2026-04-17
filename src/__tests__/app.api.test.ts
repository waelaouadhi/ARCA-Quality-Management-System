import request from 'supertest';
import { Express } from 'express';
import { createDemoApp } from '../app';

describe('API testing with Supertest', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createDemoApp();
  });

  it('returns health status from REST endpoint', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.message).toBe('QMS Backend is running');
  });

  it('returns GraphQL query result', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('Content-Type', 'application/json')
      .send({ query: '{ hello health version }' });

    expect(response.status).toBe(200);
    expect(response.body.data.hello).toBe('QMS Backend is running!');
    expect(response.body.data.health).toBe('Server is healthy and operational');
    expect(response.body.data.version).toBe('1.0.0');
  });

  it('returns GraphQL mutation result', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('Content-Type', 'application/json')
      .send({ query: 'mutation { echo(message: "Hello test") }' });

    expect(response.status).toBe(200);
    expect(response.body.data.echo).toBe('Echo: Hello test');
  });
});
