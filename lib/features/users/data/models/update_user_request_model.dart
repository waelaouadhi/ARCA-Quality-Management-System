import 'package:equatable/equatable.dart';

/// Request model for updating user information
class UpdateUserRequestModel extends Equatable {
  final String? firstName;
  final String? lastName;
  final String? email;

  const UpdateUserRequestModel({
    this.firstName,
    this.lastName,
    this.email,
  });

  /// Convert to JSON for GraphQL mutation
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {};
    
    if (firstName != null) data['firstName'] = firstName;
    if (lastName != null) data['lastName'] = lastName;
    if (email != null) data['email'] = email;
    
    return data;
  }

  /// Convert to GraphQL input format
  Map<String, dynamic> toGraphQLInput(String id) {
    return {
      'id': id,
      'input': toJson(),
    };
  }

  @override
  List<Object?> get props => [firstName, lastName, email];
}