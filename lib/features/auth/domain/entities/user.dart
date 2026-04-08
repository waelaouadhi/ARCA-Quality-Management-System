import 'package:equatable/equatable.dart';

/// User roles in the QMS system
enum UserRole {
  admin('ADMIN'),
  manager('MANAGER'),
  user('USER');

  const UserRole(this.value);
  final String value;

  static UserRole fromString(String value) {
    return UserRole.values.firstWhere(
      (role) => role.value == value.toUpperCase(),
      orElse: () => UserRole.user,
    );
  }

  /// Check if this role has higher or equal privileges than another role
  bool hasPrivileges(UserRole other) {
    const hierarchy = {
      UserRole.admin: 3,
      UserRole.manager: 2,
      UserRole.user: 1,
    };
    return (hierarchy[this] ?? 0) >= (hierarchy[other] ?? 0);
  }

  /// Check if this role can access admin features
  bool get canAccessAdmin => this == UserRole.admin;

  /// Check if this role can manage users
  bool get canManageUsers => hasPrivileges(UserRole.manager);

  /// Check if this role can view reports
  bool get canViewReports => hasPrivileges(UserRole.manager);

  /// Get display name for the role
  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Administrator';
      case UserRole.manager:
        return 'Manager';
      case UserRole.user:
        return 'User';
    }
  }
}

/// User entity representing a QMS user
class User extends Equatable {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final UserRole role;
  final DateTime createdAt;
  final DateTime updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Get the user's full name
  String get fullName => '$firstName $lastName';

  /// Get the user's initials
  String get initials {
    final first = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final last = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$first$last';
  }

  /// Check if user has specific role
  bool hasRole(UserRole role) => this.role == role;

  /// Check if user has minimum required role
  bool hasMinimumRole(UserRole minimumRole) => role.hasPrivileges(minimumRole);

  /// Check if user is admin
  bool get isAdmin => role == UserRole.admin;

  /// Check if user is manager or above
  bool get isManagerOrAbove => role.hasPrivileges(UserRole.manager);

  /// Create a copy with updated fields
  User copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    UserRole? role,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        firstName,
        lastName,
        role,
        createdAt,
        updatedAt,
      ];

  @override
  String toString() {
    return 'User(id: $id, email: $email, fullName: $fullName, role: ${role.displayName})';
  }
}