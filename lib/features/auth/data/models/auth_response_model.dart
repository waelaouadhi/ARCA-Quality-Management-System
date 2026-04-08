import '../../domain/entities/auth_response.dart';
import 'user_model.dart';

/// Data model for AuthResponse entity with JSON serialization
class AuthResponseModel extends AuthResponse {
  const AuthResponseModel({
    required super.accessToken,
    required super.user,
    super.refreshToken,
    super.tokenExpiry,
  });

  /// Create AuthResponseModel from JSON
  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      accessToken: json['accessToken'] as String? ?? json['token'] as String,
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      refreshToken: json['refreshToken'] as String?,
      tokenExpiry: json['tokenExpiry'] != null
          ? DateTime.parse(json['tokenExpiry'] as String)
          : null,
    );
  }

  /// Convert AuthResponseModel to JSON
  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'user': (user as UserModel).toJson(),
      if (refreshToken != null) 'refreshToken': refreshToken,
      if (tokenExpiry != null) 'tokenExpiry': tokenExpiry!.toIso8601String(),
    };
  }

  /// Create AuthResponseModel from AuthResponse entity
  factory AuthResponseModel.fromEntity(AuthResponse authResponse) {
    return AuthResponseModel(
      accessToken: authResponse.accessToken,
      user: authResponse.user,
      refreshToken: authResponse.refreshToken,
      tokenExpiry: authResponse.tokenExpiry,
    );
  }

  /// Convert to AuthResponse entity
  AuthResponse toEntity() {
    return AuthResponse(
      accessToken: accessToken,
      user: user,
      refreshToken: refreshToken,
      tokenExpiry: tokenExpiry,
    );
  }
}
