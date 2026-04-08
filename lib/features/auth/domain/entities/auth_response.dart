import 'package:equatable/equatable.dart';

import 'user.dart';

/// Authentication response entity containing user data and token
class AuthResponse extends Equatable {
  final String accessToken;
  final User user;
  final String? refreshToken;
  final DateTime? tokenExpiry;

  const AuthResponse({
    required this.accessToken,
    required this.user,
    this.refreshToken,
    this.tokenExpiry,
  });

  /// Check if the token is still valid
  bool get isTokenValid {
    if (tokenExpiry == null) return true;
    return DateTime.now().isBefore(tokenExpiry!);
  }

  /// Get time remaining until token expires
  Duration? get tokenTimeRemaining {
    if (tokenExpiry == null) return null;
    
    final now = DateTime.now();
    if (tokenExpiry!.isBefore(now)) {
      return Duration.zero;
    }
    
    return tokenExpiry!.difference(now);
  }

  /// Check if token will expire within the given duration
  bool willExpireWithin(Duration duration) {
    if (tokenExpiry == null) return false;
    
    final expiryThreshold = DateTime.now().add(duration);
    return tokenExpiry!.isBefore(expiryThreshold);
  }

  @override
  List<Object?> get props => [
        accessToken,
        user,
        refreshToken,
        tokenExpiry,
      ];

  @override
  String toString() {
    return 'AuthResponse(user: ${user.email}, tokenExpiry: $tokenExpiry)';
  }
}