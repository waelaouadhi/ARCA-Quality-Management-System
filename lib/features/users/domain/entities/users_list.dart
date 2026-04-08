import '../../../auth/domain/entities/user.dart';
import '../../../../shared/models/pagination.dart';

/// Users list response entity
class UsersList {
  final List<User> users;
  final PaginationInfo pagination;

  const UsersList({
    required this.users,
    required this.pagination,
  });
}