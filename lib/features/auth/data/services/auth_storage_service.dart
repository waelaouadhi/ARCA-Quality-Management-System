import '../../../../core/storage/secure_storage.dart';
import '../../domain/entities/auth_response.dart';
import '../../domain/entities/user.dart';
import '../models/user_model.dart';

/// Authentication-specific storage service
class AuthStorageService {
  final SecureStorage _secureStorage;

  AuthStorageService({SecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? SecureStorage();

  // ============================================================================
  // Authentication Data Management
  // ============================================================================

  /// Save complete authentication response
  Future<void> saveAuthResponse(AuthResponse authResponse) async {
    await Future.wait([
      _secureStorage.saveToken(authResponse.accessToken),
      _saveUser(authResponse.user),
      if (authResponse.refreshToken != null)
        _secureStorage.saveRefreshToken(authResponse.refreshToken!),
    ]);
  }

  /// Get complete authentication data if available
  Future<AuthResponse?> getAuthResponse() async {
    final token = await _secureStorage.getToken();
    final user = await getUser();
    
    if (token == null || user == null) {
      return null;
    }

    final refreshToken = await _secureStorage.getRefreshToken();
    final tokenExpiry = await _secureStorage.getTokenExpiry();

    return AuthResponse(
      accessToken: token,
      user: user,
      refreshToken: refreshToken,
      tokenExpiry: tokenExpiry,
    );
  }

  /// Clear all authentication data
  Future<void> clearAuthData() async {
    await _secureStorage.clearAll();
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /// Save authentication token
  Future<void> saveToken(String token) async {
    await _secureStorage.saveToken(token);
  }

  /// Get authentication token
  Future<String?> getToken() async {
    return await _secureStorage.getToken();
  }

  /// Delete authentication token
  Future<void> deleteToken() async {
    await _secureStorage.deleteToken();
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    return await _secureStorage.isAuthenticated();
  }

  /// Check if token is expired
  Future<bool> isTokenExpired() async {
    return await _secureStorage.isTokenExpired();
  }

  /// Get token expiry time
  Future<DateTime?> getTokenExpiry() async {
    return await _secureStorage.getTokenExpiry();
  }

  /// Get time remaining until token expires
  Future<Duration?> getTokenTimeRemaining() async {
    return await _secureStorage.getTokenTimeRemaining();
  }

  // ============================================================================
  // User Data Management
  // ============================================================================

  /// Save user data
  Future<void> saveUser(User user) async {
    await _saveUser(user);
  }

  /// Get user data
  Future<User?> getUser() async {
    final userData = await _secureStorage.getUser();
    if (userData == null) return null;

    try {
      return UserModel.fromJson(userData);
    } catch (e) {
      // If user data is corrupted, delete it
      await _secureStorage.deleteUser();
      return null;
    }
  }

  /// Delete user data
  Future<void> deleteUser() async {
    await _secureStorage.deleteUser();
  }

  // ============================================================================
  // Token Claims & User Info
  // ============================================================================

  /// Get user ID from stored token
  Future<String?> getUserIdFromToken() async {
    return await _secureStorage.getUserIdFromToken();
  }

  /// Get user role from stored token
  Future<String?> getUserRoleFromToken() async {
    return await _secureStorage.getUserRoleFromToken();
  }

  /// Get all token claims
  Future<Map<String, dynamic>?> getTokenClaims() async {
    return await _secureStorage.getTokenClaims();
  }

  // ============================================================================
  // Session Validation
  // ============================================================================

  /// Validate current session
  Future<bool> isSessionValid() async {
    // Check if authenticated and token is not expired
    final isAuth = await isAuthenticated();
    if (!isAuth) return false;

    final isExpired = await isTokenExpired();
    return !isExpired;
  }

  /// Check if session will expire soon
  Future<bool> willSessionExpireSoon({Duration threshold = const Duration(minutes: 5)}) async {
    final timeRemaining = await getTokenTimeRemaining();
    if (timeRemaining == null) return false;

    return timeRemaining <= threshold;
  }

  /// Get session status information
  Future<SessionStatus> getSessionStatus() async {
    final isAuth = await isAuthenticated();
    if (!isAuth) {
      return const SessionStatus(
        isValid: false,
        isExpired: true,
        timeRemaining: null,
        willExpireSoon: false,
      );
    }

    final isExpired = await isTokenExpired();
    final timeRemaining = await getTokenTimeRemaining();
    final willExpireSoon = await willSessionExpireSoon();

    return SessionStatus(
      isValid: !isExpired,
      isExpired: isExpired,
      timeRemaining: timeRemaining,
      willExpireSoon: willExpireSoon,
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /// Save user data as UserModel
  Future<void> _saveUser(User user) async {
    final userModel = UserModel.fromEntity(user);
    await _secureStorage.saveUser(userModel.toJson());
  }
}

/// Session status information
class SessionStatus {
  final bool isValid;
  final bool isExpired;
  final Duration? timeRemaining;
  final bool willExpireSoon;

  const SessionStatus({
    required this.isValid,
    required this.isExpired,
    required this.timeRemaining,
    required this.willExpireSoon,
  });

  @override
  String toString() {
    return 'SessionStatus(isValid: $isValid, isExpired: $isExpired, timeRemaining: $timeRemaining, willExpireSoon: $willExpireSoon)';
  }
}
