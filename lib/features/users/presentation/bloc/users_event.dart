import 'package:equatable/equatable.dart';

/// Base event for UsersBloc
abstract class UsersEvent extends Equatable {
  const UsersEvent();

  @override
  List<Object?> get props => [];
}

/// Event to load users list with pagination
class UsersLoadRequested extends UsersEvent {
  final int page;
  final String? search;
  final String? roleFilter;

  const UsersLoadRequested({
    this.page = 1,
    this.search,
    this.roleFilter,
  });

  @override
  List<Object?> get props => [page, search, roleFilter];
}

/// Event to load more users (for infinite scroll)
class UsersLoadMoreRequested extends UsersEvent {
  const UsersLoadMoreRequested();
}

/// Event to load a single user's details
class UserDetailsLoadRequested extends UsersEvent {
  final String userId;

  const UserDetailsLoadRequested(this.userId);

  @override
  List<Object?> get props => [userId];
}

/// Event to update a user
class UserUpdateRequested extends UsersEvent {
  final String userId;
  final String? email;
  final String? firstName;
  final String? lastName;

  const UserUpdateRequested({
    required this.userId,
    this.email,
    this.firstName,
    this.lastName,
  });

  @override
  List<Object?> get props => [userId, email, firstName, lastName];
}

/// Event to delete a user
class UserDeleteRequested extends UsersEvent {
  final String userId;

  const UserDeleteRequested(this.userId);

  @override
  List<Object?> get props => [userId];
}

/// Event to refresh the users list
class UsersRefreshRequested extends UsersEvent {
  const UsersRefreshRequested();
}

/// Event to update search query
class UsersSearchChanged extends UsersEvent {
  final String search;

  const UsersSearchChanged(this.search);

  @override
  List<Object?> get props => [search];
}

/// Event to update role filter
class UsersRoleFilterChanged extends UsersEvent {
  final String? roleFilter;

  const UsersRoleFilterChanged(this.roleFilter);

  @override
  List<Object?> get props => [roleFilter];
}
