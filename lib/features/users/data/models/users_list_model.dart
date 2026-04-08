import '../../../auth/data/models/user_model.dart';
import '../../domain/entities/users_list.dart';
import '../../../../shared/models/pagination.dart';

/// Data model for UsersList with JSON serialization
class UsersListModel extends UsersList {
  const UsersListModel({
    required super.users,
    required super.pagination,
  });

  /// Create UsersListModel from JSON
  factory UsersListModel.fromJson(Map<String, dynamic> json) {
    return UsersListModel(
      users: (json['data'] as List<dynamic>)
          .map((item) => UserModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      pagination: PaginationInfo.fromJson(json['pagination'] as Map<String, dynamic>),
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'data': users.map((user) => (user as UserModel).toJson()).toList(),
      'pagination': pagination.toJson(),
    };
  }
}