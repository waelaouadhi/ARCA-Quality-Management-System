import 'package:equatable/equatable.dart';

import '../../../auth/domain/entities/user.dart';
import '../../../../shared/models/pagination.dart';

/// Base state for UsersBloc
abstract class UsersState extends Equatable {
  const UsersState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class UsersInitial extends UsersState {
  const UsersInitial();
}

/// State when loading users for the first time
class UsersLoading extends UsersState {
  const UsersLoading();
}

/// State when users are successfully loaded
class UsersLoaded extends UsersState {
  final List<User> users;
  final PaginationInfo pagination;
  final String? currentSearch;
  final String? currentRoleFilter;
  final bool isLoadingMore;

  const UsersLoaded({
    required this.users,
    required this.pagination,
    this.currentSearch,
    this.currentRoleFilter,
    this.isLoadingMore = false,
  });

  /// Check if there are more pages to load
  bool get hasMore => pagination.hasNextPage;

  /// Check if list is empty
  bool get isEmpty => users.isEmpty;

  /// Check if list is not empty
  bool get isNotEmpty => users.isNotEmpty;

  /// Create a copy with updated fields
  UsersLoaded copyWith({
    List<User>? users,
    PaginationInfo? pagination,
    String? currentSearch,
    String? currentRoleFilter,
    bool? isLoadingMore,
    bool clearSearch = false,
    bool clearRoleFilter = false,
  }) {
    return UsersLoaded(
      users: users ?? this.users,
      pagination: pagination ?? this.pagination,
      currentSearch: clearSearch ? null : (currentSearch ?? this.currentSearch),
      currentRoleFilter: clearRoleFilter ? null : (currentRoleFilter ?? this.currentRoleFilter),
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }

  @override
  List<Object?> get props => [
        users,
        pagination,
        currentSearch,
        currentRoleFilter,
        isLoadingMore,
      ];
}

/// State when a single user's details are loaded
class UserDetailsLoaded extends UsersState {
  final User user;

  const UserDetailsLoaded(this.user);

  @override
  List<Object?> get props => [user];
}

/// State when an error occurs
class UsersError extends UsersState {
  final String message;
  final bool retainPreviousData;

  const UsersError(
    this.message, {
    this.retainPreviousData = false,
  });

  @override
  List<Object?> get props => [message, retainPreviousData];
}

/// State when a user action is in progress
class UserActionInProgress extends UsersState {
  final String action;
  final String userId;

  const UserActionInProgress({
    required this.action,
    required this.userId,
  });

  @override
  List<Object?> get props => [action, userId];
}

/// State when a user action succeeds
class UserActionSuccess extends UsersState {
  final String message;
  final String action;

  const UserActionSuccess({
    required this.message,
    required this.action,
  });

  @override
  List<Object?> get props => [message, action];
}
