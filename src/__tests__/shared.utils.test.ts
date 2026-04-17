import { AppError, AuthenticationError, AuthorizationError, ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import { paginate } from '@/shared/utils/pagination';

describe('shared errors', () => {
  it('creates typed application errors with expected status codes', () => {
    expect(new ValidationError('x').statusCode).toBe(400);
    expect(new AuthenticationError().statusCode).toBe(401);
    expect(new AuthorizationError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError('x').statusCode).toBe(409);
  });

  it('creates base app error defaults', () => {
    const err = new AppError('boom');
    expect(err.message).toBe('boom');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });
});

describe('pagination utility', () => {
  it('paginates model result with computed metadata', async () => {
    const model = {
      findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      count: jest.fn().mockResolvedValue(25),
    };

    const result = await paginate(model, { page: 2, limit: 2 }, { active: true }, { profile: true });

    expect(model.findMany).toHaveBeenCalledWith({
      where: { active: true },
      include: { profile: true },
      skip: 2,
      take: 2,
    });
    expect(model.count).toHaveBeenCalledWith({ where: { active: true } });
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 25,
      totalPages: 13,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('uses default page and limit when input is empty', async () => {
    const model = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };

    const result = await paginate(model, {});

    expect(model.findMany).toHaveBeenCalledWith({
      where: {},
      include: {},
      skip: 0,
      take: 10,
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});
