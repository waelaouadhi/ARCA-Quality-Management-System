import 'package:dartz/dartz.dart';
import 'package:logger/logger.dart';

import '../../../../core/errors/failures.dart';
import '../../../../shared/models/pagination.dart';
import '../../../auth/domain/entities/user.dart';
import '../../domain/entities/users_list.dart';
import '../../domain/repositories/users_repository.dart';
import '../datasources/users_remote_datasource.dart';
import '../models/update_user_request_model.dart';

class UsersRepositoryImpl implements UsersRepository {
  final UsersRemoteDataSource _remoteDataSource;
  final Logger _logger;

  UsersRepositoryImpl({
    required UsersRemoteDataSource remoteDataSource,
    Logger? logger,
  })  : _remoteDataSource = remoteDataSource,
        _logger = logger ?? Logger();

  @override
  Future<Either<Failure, UsersList>> getUsers({
    required PaginationInput pagination,
    String? search,
    String? roleFilter,
  }) async {
    try {
      final result = await _remoteDataSource.getUsers(
        pagination: pagination,
        search: search,
        roleFilter: roleFilter,
      );
      return Right(result);
    } on UnauthorizedException catch (e) {
      return Left(AuthenticationFailure(message: e.message));
    } on ValidationException catch (e) {
      return Left(ValidationFailure(message: e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on GraphQLException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      _logger.e('getUsers failed', error: e);
      return const Left(ServerFailure(message: 'Failed to load users'));
    }
  }

  @override
  Future<Either<Failure, User>> getUserById(String id) async {
    try {
      final result = await _remoteDataSource.getUserById(id);
      return Right(result);
    } on NotFoundException catch (e) {
      return Left(NotFoundFailure(message: e.message, resourceType: 'User'));
    } on UnauthorizedException catch (e) {
      return Left(AuthenticationFailure(message: e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } catch (e) {
      _logger.e('getUserById failed', error: e);
      return const Left(ServerFailure(message: 'Failed to load user'));
    }
  }

  @override
  Future<Either<Failure, User>> updateUser({
    required String id,
    String? firstName,
    String? lastName,
    String? email,
  }) async {
    try {
      final request = UpdateUserRequestModel(
        firstName: firstName,
        lastName: lastName,
        email: email,
      );
      final result = await _remoteDataSource.updateUser(id, request);
      return Right(result);
    } on ValidationException catch (e) {
      return Left(ValidationFailure(message: e.message));
    } on UnauthorizedException catch (e) {
      return Left(PermissionFailure(message: e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } catch (e) {
      _logger.e('updateUser failed', error: e);
      return const Left(ServerFailure(message: 'Failed to update user'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteUser(String id) async {
    try {
      await _remoteDataSource.deleteUser(id);
      return const Right(null);
    } on UnauthorizedException catch (e) {
      return Left(PermissionFailure(message: e.message));
    } on NotFoundException catch (e) {
      return Left(NotFoundFailure(message: e.message, resourceType: 'User'));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } catch (e) {
      _logger.e('deleteUser failed', error: e);
      return const Left(ServerFailure(message: 'Failed to delete user'));
    }
  }

  @override
  Future<Either<Failure, List<User>>> searchUsers(String query) async {
    final usersResult = await getUsers(
      pagination: const PaginationInput(page: 1, limit: 20),
      search: query,
    );
    return usersResult.fold(
      Left.new,
      (usersList) => Right(usersList.users),
    );
  }
}
