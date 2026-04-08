import 'package:equatable/equatable.dart';

/// Request model for user registration
class RegisterRequestModel extends Equatable {
  final String email;
  final String password;
  final String firstName;
  final String lastName;

  const RegisterRequestModel({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
  });

  /// Convert to JSON for GraphQL mutation
  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
    };
  }

  /// Convert to GraphQL input format
  Map<String, dynamic> toGraphQLInput() {
    return {
      'input': toJson(),
    };
  }

  @override
  List<Object?> get props => [email, password, firstName, lastName];
}

/// Request model for user login
class LoginRequestModel extends Equatable {
  final String email;
  final String password;

  const LoginRequestModel({
    required this.email,
    required this.password,
  });

  /// Convert to JSON for GraphQL mutation
  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }

  /// Convert to GraphQL input format
  Map<String, dynamic> toGraphQLInput() {
    return {
      'input': toJson(),
    };
  }

  @override
  List<Object?> get props => [email, password];
}