const mockAuthService = {
  getCurrentUser: jest.fn(),
  register: jest.fn(),
  login: jest.fn(),
};

const mockUserService = {
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

const mockDocumentService = {
  getDocuments: jest.fn(),
  getDocumentById: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  archiveDocument: jest.fn(),
};

const mockCorrectiveActionService = {
  getCorrectiveActions: jest.fn(),
  getCorrectiveActionById: jest.fn(),
  createCorrectiveAction: jest.fn(),
  updateCorrectiveAction: jest.fn(),
  completeCorrectiveAction: jest.fn(),
};

const mockNonConformanceService = {
  getNonConformances: jest.fn(),
  getNonConformanceById: jest.fn(),
  createNonConformance: jest.fn(),
  updateNonConformance: jest.fn(),
  closeNonConformance: jest.fn(),
};

jest.mock('@/modules/auth/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => mockAuthService),
}));

jest.mock('@/modules/user/user.service', () => ({
  UserService: jest.fn().mockImplementation(() => mockUserService),
}));

jest.mock('@/modules/document/document.service', () => ({
  DocumentService: jest.fn().mockImplementation(() => mockDocumentService),
}));

jest.mock('@/modules/correctiveAction/correctiveAction.service', () => ({
  CorrectiveActionService: jest.fn().mockImplementation(() => mockCorrectiveActionService),
}));

jest.mock('@/modules/nonConformance/nonConformance.service', () => ({
  NonConformanceService: jest.fn().mockImplementation(() => mockNonConformanceService),
}));

import { authResolvers } from '@/modules/auth/auth.resolver';
import { correctiveActionResolvers } from '@/modules/correctiveAction/correctiveAction.resolver';
import { documentResolvers } from '@/modules/document/document.resolver';
import { nonConformanceResolvers } from '@/modules/nonConformance/nonConformance.resolver';
import { userResolvers } from '@/modules/user/user.resolver';
import { AppError } from '@/shared/errors';

describe('auth resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('me throws when user is not authenticated', async () => {
    mockAuthService.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));
    await expect(authResolvers.Query.me({}, {}, {} as never)).rejects.toThrow('Not authenticated');
  });

  it('me returns current user via service', async () => {
    const user = { id: 'u1', email: 'a@b.com' };
    mockAuthService.getCurrentUser.mockResolvedValue(user);

    const result = await authResolvers.Query.me(
      {},
      {},
      { user: { userId: 'u1', email: 'a@b.com', role: 'USER' } }
    );

    expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith({ userId: 'u1', email: 'a@b.com', role: 'USER' });
    expect(result).toEqual(user);
  });

  it('register forwards payload to service', async () => {
    const payload = { user: { id: 'u1' }, token: 't' };
    mockAuthService.register.mockResolvedValue(payload);

    const result = await authResolvers.Mutation.register(
      {},
      { input: { email: 'a@b.com', password: 'secret', firstName: 'A', lastName: 'B' } }
    );

    expect(mockAuthService.register).toHaveBeenCalledWith('a@b.com', 'secret', 'A', 'B');
    expect(result).toEqual(payload);
  });

  it('login forwards payload to service', async () => {
    const payload = { user: { id: 'u1' }, token: 't' };
    mockAuthService.login.mockResolvedValue(payload);

    const result = await authResolvers.Mutation.login({}, { input: { email: 'a@b.com', password: 'secret' } });

    expect(mockAuthService.login).toHaveBeenCalledWith('a@b.com', 'secret');
    expect(result).toEqual(payload);
  });
});

describe('user resolvers', () => {
  const userContext = { user: { userId: 'u1', email: 'a@b.com', role: 'USER' } };
  const adminContext = { user: { userId: 'u2', email: 'admin@b.com', role: 'ADMIN' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('users throws when unauthenticated', async () => {
    mockUserService.getUsers.mockRejectedValue(new AppError('Access denied', 403));
    await expect(userResolvers.Query.users({}, { pagination: {} }, {} as never)).rejects.toBeInstanceOf(AppError);
  });

  it('users returns paginated users when authenticated', async () => {
    const output = { data: [{ id: 'u1' }], pagination: { page: 1 } };
    mockUserService.getUsers.mockResolvedValue(output);

    const result = await userResolvers.Query.users({}, { pagination: { page: 1, limit: 10 } }, userContext);

    expect(mockUserService.getUsers).toHaveBeenCalledWith({ page: 1, limit: 10 }, userContext.user);
    expect(result).toEqual(output);
  });

  it('user returns a user by id', async () => {
    mockUserService.getUserById.mockResolvedValue({ id: 'u1' });

    const result = await userResolvers.Query.user({}, { id: 'u1' }, userContext);

    expect(mockUserService.getUserById).toHaveBeenCalledWith('u1', userContext.user);
    expect(result).toEqual({ id: 'u1' });
  });

  it('user throws when unauthenticated', async () => {
    mockUserService.getUserById.mockRejectedValue(new AppError('Access denied', 403));
    await expect(userResolvers.Query.user({}, { id: 'u1' }, {} as never)).rejects.toBeInstanceOf(AppError);
  });

  it('updateUser updates user when authenticated', async () => {
    mockUserService.updateUser.mockResolvedValue({ id: 'u1' });

    const result = await userResolvers.Mutation.updateUser({}, { id: 'u1', input: { firstName: 'N' } }, userContext);

    expect(mockUserService.updateUser).toHaveBeenCalledWith('u1', { firstName: 'N' }, userContext.user);
    expect(result).toEqual({ id: 'u1' });
  });

  it('updateUser throws when unauthenticated', async () => {
    mockUserService.updateUser.mockRejectedValue(new AppError('Access denied', 403));
    await expect(
      userResolvers.Mutation.updateUser({}, { id: 'u1', input: { firstName: 'N' } }, {} as never)
    ).rejects.toBeInstanceOf(AppError);
  });

  it('deleteUser rejects non-admin', async () => {
    mockUserService.deleteUser.mockRejectedValue(new AppError('Admin access required', 403));
    await expect(userResolvers.Mutation.deleteUser({}, { id: 'u1' }, userContext)).rejects.toThrow(
      'Admin access required'
    );
  });

  it('deleteUser succeeds for admin', async () => {
    mockUserService.deleteUser.mockResolvedValue(true);

    const result = await userResolvers.Mutation.deleteUser({}, { id: 'u1' }, adminContext);

    expect(mockUserService.deleteUser).toHaveBeenCalledWith('u1', adminContext.user);
    expect(result).toBe(true);
  });
});

describe('document resolvers', () => {
  const userContext = { user: { userId: 'u1', email: 'a@b.com', role: 'USER' } };
  const managerContext = { user: { userId: 'm1', email: 'manager@b.com', role: 'MANAGER' } };
  const adminContext = { user: { userId: 'a1', email: 'admin@b.com', role: 'ADMIN' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('documents throws when unauthenticated', async () => {
    mockDocumentService.getDocuments.mockRejectedValue(new AppError('Access denied', 403));
    await expect(documentResolvers.Query.documents({}, { pagination: {} }, {} as never)).rejects.toBeInstanceOf(
      AppError
    );
  });

  it('documents returns list when authenticated', async () => {
    const output = { data: [{ id: 'd1' }], pagination: { total: 1 } };
    mockDocumentService.getDocuments.mockResolvedValue(output);

    const result = await documentResolvers.Query.documents(
      {},
      { pagination: { page: 1, limit: 10 }, status: 'DRAFT' },
      userContext
    );

    expect(mockDocumentService.getDocuments).toHaveBeenCalledWith({ page: 1, limit: 10 }, 'DRAFT', userContext.user);
    expect(result).toEqual(output);
  });

  it('document returns one when authenticated', async () => {
    const output = { id: 'd1', title: 'Doc' };
    mockDocumentService.getDocumentById.mockResolvedValue(output);

    const result = await documentResolvers.Query.document({}, { id: 'd1' }, userContext);

    expect(mockDocumentService.getDocumentById).toHaveBeenCalledWith('d1', userContext.user);
    expect(result).toEqual(output);
  });

  it('createDocument creates for MANAGER', async () => {
    const output = { id: 'd1', title: 'Doc' };
    mockDocumentService.createDocument.mockResolvedValue(output);

    const result = await documentResolvers.Mutation.createDocument(
      {},
      { input: { title: 'Doc', content: 'Body' } },
      managerContext
    );

    expect(mockDocumentService.createDocument).toHaveBeenCalledWith(
      { title: 'Doc', content: 'Body' },
      managerContext.user
    );
    expect(result).toEqual(output);
  });

  it('updateDocument updates for ADMIN', async () => {
    const output = { id: 'd1', title: 'Doc v2' };
    mockDocumentService.updateDocument.mockResolvedValue(output);

    const result = await documentResolvers.Mutation.updateDocument(
      {},
      { id: 'd1', input: { title: 'Doc v2' } },
      adminContext
    );

    expect(mockDocumentService.updateDocument).toHaveBeenCalledWith('d1', { title: 'Doc v2' }, adminContext.user);
    expect(result).toEqual(output);
  });

  it('archiveDocument archives for MANAGER', async () => {
    const output = { id: 'd1', status: 'ARCHIVED' };
    mockDocumentService.archiveDocument.mockResolvedValue(output);

    const result = await documentResolvers.Mutation.archiveDocument({}, { id: 'd1' }, managerContext);

    expect(mockDocumentService.archiveDocument).toHaveBeenCalledWith('d1', managerContext.user);
    expect(result).toEqual(output);
  });

  it('createDocument rejects USER role', async () => {
    mockDocumentService.createDocument.mockRejectedValue(
      new AppError('Document write access requires ADMIN or MANAGER role', 403)
    );
    await expect(
      documentResolvers.Mutation.createDocument({}, { input: { title: 'Doc', content: 'Body' } }, userContext)
    ).rejects.toThrow('Document write access requires ADMIN or MANAGER role');
  });

  it('updateDocument rejects USER role', async () => {
    mockDocumentService.updateDocument.mockRejectedValue(
      new AppError('Document write access requires ADMIN or MANAGER role', 403)
    );
    await expect(
      documentResolvers.Mutation.updateDocument({}, { id: 'd1', input: { title: 'Doc v2' } }, userContext)
    ).rejects.toThrow('Document write access requires ADMIN or MANAGER role');
  });

  it('archiveDocument rejects USER role', async () => {
    mockDocumentService.archiveDocument.mockRejectedValue(
      new AppError('Document write access requires ADMIN or MANAGER role', 403)
    );
    await expect(documentResolvers.Mutation.archiveDocument({}, { id: 'd1' }, userContext)).rejects.toThrow(
      'Document write access requires ADMIN or MANAGER role'
    );
  });
});

describe('correctiveAction resolvers', () => {
  const userContext = { user: { userId: 'u1', email: 'a@b.com', role: 'USER' } };
  const managerContext = { user: { userId: 'm1', email: 'manager@b.com', role: 'MANAGER' } };
  const adminContext = { user: { userId: 'a1', email: 'admin@b.com', role: 'ADMIN' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('correctiveActions throws when unauthenticated', async () => {
    mockCorrectiveActionService.getCorrectiveActions.mockRejectedValue(new AppError('Access denied', 403));
    await expect(
      correctiveActionResolvers.Query.correctiveActions({}, { pagination: {} }, {} as never)
    ).rejects.toBeInstanceOf(AppError);
  });

  it('correctiveActions returns list for authenticated user', async () => {
    const output = { data: [{ id: 'c1' }], pagination: { total: 1 } };
    mockCorrectiveActionService.getCorrectiveActions.mockResolvedValue(output);

    const result = await correctiveActionResolvers.Query.correctiveActions(
      {},
      { pagination: { page: 1, limit: 10 }, status: 'PENDING', nonConformanceId: 'n1', assignedToId: 'u1' },
      userContext
    );

    expect(mockCorrectiveActionService.getCorrectiveActions).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { status: 'PENDING', nonConformanceId: 'n1', assignedToId: 'u1' },
      userContext.user
    );
    expect(result).toEqual(output);
  });

  it('correctiveAction returns one for authenticated user', async () => {
    const output = { id: 'c1', action: 'Fix issue' };
    mockCorrectiveActionService.getCorrectiveActionById.mockResolvedValue(output);

    const result = await correctiveActionResolvers.Query.correctiveAction({}, { id: 'c1' }, userContext);

    expect(mockCorrectiveActionService.getCorrectiveActionById).toHaveBeenCalledWith('c1', userContext.user);
    expect(result).toEqual(output);
  });

  it('createCorrectiveAction allows MANAGER', async () => {
    const output = { id: 'c1', action: 'Fix issue' };
    mockCorrectiveActionService.createCorrectiveAction.mockResolvedValue(output);

    const result = await correctiveActionResolvers.Mutation.createCorrectiveAction(
      {},
      { input: { action: 'Fix issue', nonConformanceId: 'n1', assignedToId: 'u1' } },
      managerContext
    );

    expect(mockCorrectiveActionService.createCorrectiveAction).toHaveBeenCalledWith({
      action: 'Fix issue',
      nonConformanceId: 'n1',
      assignedToId: 'u1',
    }, managerContext.user);
    expect(result).toEqual(output);
  });

  it('updateCorrectiveAction allows ADMIN', async () => {
    const output = { id: 'c1', status: 'IN_PROGRESS' };
    mockCorrectiveActionService.updateCorrectiveAction.mockResolvedValue(output);

    const result = await correctiveActionResolvers.Mutation.updateCorrectiveAction(
      {},
      { id: 'c1', input: { status: 'IN_PROGRESS' } },
      adminContext
    );

    expect(mockCorrectiveActionService.updateCorrectiveAction).toHaveBeenCalledWith(
      'c1',
      { status: 'IN_PROGRESS' },
      adminContext.user
    );
    expect(result).toEqual(output);
  });

  it('completeCorrectiveAction allows MANAGER', async () => {
    const output = { id: 'c1', status: 'DONE' };
    mockCorrectiveActionService.completeCorrectiveAction.mockResolvedValue(output);

    const result = await correctiveActionResolvers.Mutation.completeCorrectiveAction({}, { id: 'c1' }, managerContext);

    expect(mockCorrectiveActionService.completeCorrectiveAction).toHaveBeenCalledWith('c1', managerContext.user);
    expect(result).toEqual(output);
  });

  it('createCorrectiveAction rejects USER', async () => {
    mockCorrectiveActionService.createCorrectiveAction.mockRejectedValue(
      new AppError('CorrectiveAction write access requires ADMIN or MANAGER role', 403)
    );
    await expect(
      correctiveActionResolvers.Mutation.createCorrectiveAction(
        {},
        { input: { action: 'Fix issue', nonConformanceId: 'n1' } },
        userContext
      )
    ).rejects.toThrow('CorrectiveAction write access requires ADMIN or MANAGER role');
  });

  it('updateCorrectiveAction rejects USER', async () => {
    mockCorrectiveActionService.updateCorrectiveAction.mockRejectedValue(
      new AppError('CorrectiveAction write access requires ADMIN or MANAGER role', 403)
    );
    await expect(
      correctiveActionResolvers.Mutation.updateCorrectiveAction({}, { id: 'c1', input: { status: 'DONE' } }, userContext)
    ).rejects.toThrow('CorrectiveAction write access requires ADMIN or MANAGER role');
  });

  it('completeCorrectiveAction rejects USER', async () => {
    mockCorrectiveActionService.completeCorrectiveAction.mockRejectedValue(
      new AppError('CorrectiveAction write access requires ADMIN or MANAGER role', 403)
    );
    await expect(
      correctiveActionResolvers.Mutation.completeCorrectiveAction({}, { id: 'c1' }, userContext)
    ).rejects.toThrow('CorrectiveAction write access requires ADMIN or MANAGER role');
  });
});

describe('nonConformance resolvers', () => {
  const userContext = { user: { userId: 'u1', email: 'a@b.com', role: 'USER' } };
  const managerContext = { user: { userId: 'm1', email: 'manager@b.com', role: 'MANAGER' } };
  const adminContext = { user: { userId: 'a1', email: 'admin@b.com', role: 'ADMIN' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('nonConformances throws when unauthenticated', async () => {
    mockNonConformanceService.getNonConformances.mockRejectedValue(new AppError('Access denied', 403));
    await expect(nonConformanceResolvers.Query.nonConformances({}, { pagination: {} }, {} as never)).rejects.toBeInstanceOf(
      AppError
    );
  });

  it('nonConformances returns list for authenticated user', async () => {
    const output = { data: [{ id: 'n1' }], pagination: { total: 1 } };
    mockNonConformanceService.getNonConformances.mockResolvedValue(output);

    const result = await nonConformanceResolvers.Query.nonConformances(
      {},
      { pagination: { page: 1, limit: 10 }, status: 'OPEN', severity: 'HIGH', reportedById: 'u1' },
      userContext
    );

    expect(mockNonConformanceService.getNonConformances).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { status: 'OPEN', severity: 'HIGH', reportedById: 'u1' },
      userContext.user
    );
    expect(result).toEqual(output);
  });

  it('nonConformance returns one for authenticated user', async () => {
    const output = { id: 'n1', title: 'Issue' };
    mockNonConformanceService.getNonConformanceById.mockResolvedValue(output);

    const result = await nonConformanceResolvers.Query.nonConformance({}, { id: 'n1' }, userContext);

    expect(mockNonConformanceService.getNonConformanceById).toHaveBeenCalledWith('n1', userContext.user);
    expect(result).toEqual(output);
  });

  it('createNonConformance allows MANAGER', async () => {
    const output = { id: 'n1', title: 'Issue' };
    mockNonConformanceService.createNonConformance.mockResolvedValue(output);

    const result = await nonConformanceResolvers.Mutation.createNonConformance(
      {},
      { input: { title: 'Issue', description: 'Desc', severity: 'HIGH' } },
      managerContext
    );

    expect(mockNonConformanceService.createNonConformance).toHaveBeenCalledWith(
      { title: 'Issue', description: 'Desc', severity: 'HIGH' },
      managerContext.user
    );
    expect(result).toEqual(output);
  });

  it('updateNonConformance allows ADMIN', async () => {
    const output = { id: 'n1', status: 'IN_PROGRESS' };
    mockNonConformanceService.updateNonConformance.mockResolvedValue(output);

    const result = await nonConformanceResolvers.Mutation.updateNonConformance(
      {},
      { id: 'n1', input: { status: 'IN_PROGRESS' } },
      adminContext
    );

    expect(mockNonConformanceService.updateNonConformance).toHaveBeenCalledWith(
      'n1',
      { status: 'IN_PROGRESS' },
      adminContext.user
    );
    expect(result).toEqual(output);
  });

  it('closeNonConformance allows MANAGER', async () => {
    const output = { id: 'n1', status: 'CLOSED' };
    mockNonConformanceService.closeNonConformance.mockResolvedValue(output);

    const result = await nonConformanceResolvers.Mutation.closeNonConformance({}, { id: 'n1' }, managerContext);

    expect(mockNonConformanceService.closeNonConformance).toHaveBeenCalledWith('n1', managerContext.user);
    expect(result).toEqual(output);
  });

  it('createNonConformance rejects USER', async () => {
    mockNonConformanceService.createNonConformance.mockRejectedValue(
      new AppError('NonConformance write access requires ADMIN or MANAGER role', 403)
    );
    await expect(
      nonConformanceResolvers.Mutation.createNonConformance(
        {},
        { input: { title: 'Issue', description: 'Desc', severity: 'HIGH' } },
        userContext
      )
    ).rejects.toThrow('NonConformance write access requires ADMIN or MANAGER role');
  });

  it('updateNonConformance rejects USER', async () => {
    mockNonConformanceService.updateNonConformance.mockRejectedValue(
      new AppError('NonConformance write access requires ADMIN or MANAGER role', 403)
    );
    await expect(
      nonConformanceResolvers.Mutation.updateNonConformance({}, { id: 'n1', input: { status: 'CLOSED' } }, userContext)
    ).rejects.toThrow('NonConformance write access requires ADMIN or MANAGER role');
  });

  it('closeNonConformance rejects USER', async () => {
    mockNonConformanceService.closeNonConformance.mockRejectedValue(
      new AppError('NonConformance write access requires ADMIN or MANAGER role', 403)
    );
    await expect(nonConformanceResolvers.Mutation.closeNonConformance({}, { id: 'n1' }, userContext)).rejects.toThrow(
      'NonConformance write access requires ADMIN or MANAGER role'
    );
  });
});
