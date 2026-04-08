import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';

import '../../../../core/errors/failures.dart';
import '../../../../shared/models/pagination.dart';
import '../../domain/usecases/delete_user_usecase.dart';
import '../../domain/usecases/get_user_by_id_usecase.dart';
import '../../domain/usecases/get_users_usecase.dart';
import '../../domain/usecases/update_user_usecase.dart';
import 'users_event.dart';
import 'users_state.dart';

/// BLoC for managing users state
class UsersBloc extends Bloc<UsersEvent, UsersState> {
  final GetUsersUseCase _getUsersUseCase;
  final GetUserByIdUseCase _getUserByIdUseCase;
  final UpdateUserUseCase _updateUserUseCase;
  final DeleteUserUseCase _deleteUserUseCase;
  final Logger? _logger;

  // Cache for pagination and filters
  PaginationInput _lastPaginationInput = const PaginationInput(page: 1, limit: 20);
  String? _lastSearch;
  String? _lastRoleFilter;
  Timer? _searchDebounceTimer;

  UsersBloc({
    required GetUsersUseCase getUsersUseCase,
    required GetUserByIdUseCase getUserByIdUseCase,
    required UpdateUserUseCase updateUserUseCase,
    required DeleteUserUseCase deleteUserUseCase,
    Logger? logger,
  })  : _getUsersUseCase = getUsersUseCase,
        _getUserByIdUseCase = getUserByIdUseCase,
        _updateUserUseCase = updateUserUseCase,
        _deleteUserUseCase = deleteUserUseCase,
        _logger = logger,
        super(const UsersInitial()) {
    // Register event handlers
    on<UsersLoadRequested>(_onUsersLoadRequested);
    on<UsersLoadMoreRequested>(_onUsersLoadMoreRequested);
    on<UserDetailsLoadRequested>(_onUserDetailsLoadRequested);
    on<UserUpdateRequested>(_onUserUpdateRequested);
    on<UserDeleteRequested>(_onUserDeleteRequested);
    on<UsersRefreshRequested>(_onUsersRefreshRequested);
    on<UsersSearchChanged>(_onUsersSearchChanged);
    on<UsersRoleFilterChanged>(_onUsersRoleFilterChanged);
  }

  @override
  Future<void> close() {
    _searchDebounceTimer?.cancel();
    return super.close();
  }

  /// Load users list with pagination and filters
  Future<void> _onUsersLoadRequested(
    UsersLoadRequested event,
    Emitter<UsersState> emit,
  ) async {
    try {
      _logger?.d('Loading users - page: ${event.page}, search: ${event.search}, role: ${event.roleFilter}');

      // Only show loading if this is the first page
      if (event.page == 1) {
        emit(const UsersLoading());
      }

      // Update cache
      _lastPaginationInput = PaginationInput(page: event.page, limit: 20);
      _lastSearch = event.search;
      _lastRoleFilter = event.roleFilter;

      final result = await _getUsersUseCase(
        pagination: _lastPaginationInput,
        search: event.search,
        roleFilter: event.roleFilter,
      );

      result.fold(
        (failure) {
          _logger?.e('Failed to load users: ${failure.message}');
          emit(UsersError(_mapFailureToMessage(failure)));
        },
        (usersList) {
          _logger?.i('Loaded ${usersList.users.length} users');
          emit(UsersLoaded(
            users: usersList.users,
            pagination: usersList.pagination,
            currentSearch: event.search,
            currentRoleFilter: event.roleFilter,
          ));
        },
      );
    } catch (e) {
      _logger?.e('Unexpected error loading users: $e');
      emit(UsersError('An unexpected error occurred: ${e.toString()}'));
    }
  }

  /// Load more users for infinite scroll
  Future<void> _onUsersLoadMoreRequested(
    UsersLoadMoreRequested event,
    Emitter<UsersState> emit,
  ) async {
    final currentState = state;
    if (currentState is! UsersLoaded) return;
    if (!currentState.hasMore) return;
    if (currentState.isLoadingMore) return;

    try {
      _logger?.d('Loading more users - next page: ${currentState.pagination.page + 1}');

      // Show loading indicator
      emit(currentState.copyWith(isLoadingMore: true));

      final nextPage = currentState.pagination.page + 1;
      _lastPaginationInput = PaginationInput(page: nextPage, limit: 20);

      final result = await _getUsersUseCase(
        pagination: _lastPaginationInput,
        search: currentState.currentSearch,
        roleFilter: currentState.currentRoleFilter,
      );

      result.fold(
        (failure) {
          _logger?.e('Failed to load more users: ${failure.message}');
          // Keep the current data and show error as snackbar
          emit(currentState.copyWith(isLoadingMore: false));
          emit(UsersError(
            _mapFailureToMessage(failure),
            retainPreviousData: true,
          ));
        },
        (usersList) {
          _logger?.i('Loaded ${usersList.users.length} more users');
          // Append new users to existing list
          final updatedUsers = [...currentState.users, ...usersList.users];
          emit(UsersLoaded(
            users: updatedUsers,
            pagination: usersList.pagination,
            currentSearch: currentState.currentSearch,
            currentRoleFilter: currentState.currentRoleFilter,
            isLoadingMore: false,
          ));
        },
      );
    } catch (e) {
      _logger?.e('Unexpected error loading more users: $e');
      emit(currentState.copyWith(isLoadingMore: false));
      emit(UsersError(
        'Failed to load more users',
        retainPreviousData: true,
      ));
    }
  }

  /// Load a single user's details
  Future<void> _onUserDetailsLoadRequested(
    UserDetailsLoadRequested event,
    Emitter<UsersState> emit,
  ) async {
    try {
      _logger?.d('Loading user details for ID: ${event.userId}');
      emit(const UsersLoading());

      final result = await _getUserByIdUseCase(event.userId);

      result.fold(
        (failure) {
          _logger?.e('Failed to load user details: ${failure.message}');
          emit(UsersError(_mapFailureToMessage(failure)));
        },
        (user) {
          _logger?.i('Loaded user details: ${user.fullName}');
          emit(UserDetailsLoaded(user));
        },
      );
    } catch (e) {
      _logger?.e('Unexpected error loading user details: $e');
      emit(UsersError('An unexpected error occurred: ${e.toString()}'));
    }
  }

  /// Update a user
  Future<void> _onUserUpdateRequested(
    UserUpdateRequested event,
    Emitter<UsersState> emit,
  ) async {
    try {
      _logger?.d('Updating user ID: ${event.userId}');
      emit(UserActionInProgress(
        action: 'update',
        userId: event.userId,
      ));

      final result = await _updateUserUseCase(
        id: event.userId,
        email: event.email,
        firstName: event.firstName,
        lastName: event.lastName,
      );

      result.fold(
        (failure) {
          _logger?.e('Failed to update user: ${failure.message}');
          emit(UsersError(_mapFailureToMessage(failure)));
        },
        (user) {
          _logger?.i('Successfully updated user: ${user.fullName}');
          emit(const UserActionSuccess(
            message: 'User updated successfully',
            action: 'update',
          ));
          // Reload user details
          add(UserDetailsLoadRequested(event.userId));
        },
      );
    } catch (e) {
      _logger?.e('Unexpected error updating user: $e');
      emit(UsersError('Failed to update user: ${e.toString()}'));
    }
  }

  /// Delete a user
  Future<void> _onUserDeleteRequested(
    UserDeleteRequested event,
    Emitter<UsersState> emit,
  ) async {
    try {
      _logger?.d('Deleting user ID: ${event.userId}');
      emit(UserActionInProgress(
        action: 'delete',
        userId: event.userId,
      ));

      final result = await _deleteUserUseCase(event.userId);

      result.fold(
        (failure) {
          _logger?.e('Failed to delete user: ${failure.message}');
          emit(UsersError(_mapFailureToMessage(failure)));
        },
        (_) {
          _logger?.i('Successfully deleted user: ${event.userId}');
          emit(const UserActionSuccess(
            message: 'User deleted successfully',
            action: 'delete',
          ));
        },
      );
    } catch (e) {
      _logger?.e('Unexpected error deleting user: $e');
      emit(UsersError('Failed to delete user: ${e.toString()}'));
    }
  }

  /// Refresh users list
  Future<void> _onUsersRefreshRequested(
    UsersRefreshRequested event,
    Emitter<UsersState> emit,
  ) async {
    _logger?.d('Refreshing users list');
    // Reload from first page with current filters
    add(UsersLoadRequested(
      page: 1,
      search: _lastSearch,
      roleFilter: _lastRoleFilter,
    ));
  }

  /// Handle search query change with debouncing
  Future<void> _onUsersSearchChanged(
    UsersSearchChanged event,
    Emitter<UsersState> emit,
  ) async {
    _logger?.d('Search changed: ${event.search}');

    // Cancel previous timer
    _searchDebounceTimer?.cancel();

    // Create new debounce timer (300ms)
    _searchDebounceTimer = Timer(const Duration(milliseconds: 300), () {
      // Trigger search after debounce
      add(UsersLoadRequested(
        page: 1,
        search: event.search.isEmpty ? null : event.search,
        roleFilter: _lastRoleFilter,
      ));
    });
  }

  /// Handle role filter change
  Future<void> _onUsersRoleFilterChanged(
    UsersRoleFilterChanged event,
    Emitter<UsersState> emit,
  ) async {
    _logger?.d('Role filter changed: ${event.roleFilter}');
    
    // Immediately load with new filter
    add(UsersLoadRequested(
      page: 1,
      search: _lastSearch,
      roleFilter: event.roleFilter,
    ));
  }

  /// Map failure to user-friendly message
  String _mapFailureToMessage(Failure failure) {
    if (failure is ServerFailure) {
      return failure.message.isNotEmpty
          ? failure.message
          : 'Server error occurred. Please try again.';
    } else if (failure is NetworkFailure) {
      return 'No internet connection. Please check your network.';
    } else if (failure is ValidationFailure) {
      return failure.message;
    } else if (failure is AuthenticationFailure) {
      return 'Authentication failed. Please log in again.';
    } else if (failure is PermissionFailure) {
      return 'You do not have permission to perform this action.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}
