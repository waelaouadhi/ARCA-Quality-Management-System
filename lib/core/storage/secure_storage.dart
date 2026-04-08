import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

/// Storage keys for secure storage
class StorageKeys {
  StorageKeys._();

  static const String accessToken = 'qms_access_token';
  static const String refreshToken = 'qms_refresh_token';
  static const String currentUser = 'qms_current_user';
  static const String tokenExpiry = 'qms_token_expiry';
}

/// Secure storage service for sensitive data like JWT tokens
/// Uses platform-specific secure storage (Keychain on iOS, EncryptedSharedPreferences on Android)
class SecureStorage {
  final FlutterSecureStorage _storage;

  SecureStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
              ),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
              webOptions: WebOptions(
                dbName: 'qms_secure_storage',
                publicKey: 'qms_public_key',
              ),
            );

  // ============================================================================
  // Token Management
  // ============================================================================

  /// Save JWT access token
  Future<void> saveToken(String token) async {
    await _storage.write(key: StorageKeys.accessToken, value: token);

    // Extract and store expiry time
    try {
      final decodedToken = JwtDecoder.decode(token);
      final exp = decodedToken['exp'] as int?;
      if (exp != null) {
        await _storage.write(
          key: StorageKeys.tokenExpiry,
          value: exp.toString(),
        );
      }
    } catch (_) {
      // Token parsing failed, ignore expiry storage
    }
  }

  /// Get JWT access token
  Future<String?> getToken() async {
    return await _storage.read(key: StorageKeys.accessToken);
  }

  /// Delete JWT access token
  Future<void> deleteToken() async {
    await _storage.delete(key: StorageKeys.accessToken);
    await _storage.delete(key: StorageKeys.tokenExpiry);
  }

  /// Save refresh token (if backend supports it)
  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: StorageKeys.refreshToken, value: token);
  }

  /// Get refresh token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: StorageKeys.refreshToken);
  }

  /// Delete refresh token
  Future<void> deleteRefreshToken() async {
    await _storage.delete(key: StorageKeys.refreshToken);
  }

  // ============================================================================
  // Authentication State
  // ============================================================================

  /// Check if user is authenticated (has valid token)
  Future<bool> isAuthenticated() async {
    final token = await getToken();
    if (token == null || token.isEmpty) {
      return false;
    }

    // Check if token is expired
    return !await isTokenExpired();
  }

  /// Check if token is expired
  Future<bool> isTokenExpired() async {
    final token = await getToken();
    if (token == null) {
      return true;
    }

    try {
      return JwtDecoder.isExpired(token);
    } catch (_) {
      // If we can't decode, assume expired for safety
      return true;
    }
  }

  /// Get token expiry time
  Future<DateTime?> getTokenExpiry() async {
    final token = await getToken();
    if (token == null) {
      return null;
    }

    try {
      return JwtDecoder.getExpirationDate(token);
    } catch (_) {
      return null;
    }
  }

  /// Get time remaining until token expires
  Future<Duration?> getTokenTimeRemaining() async {
    final expiry = await getTokenExpiry();
    if (expiry == null) {
      return null;
    }

    final now = DateTime.now();
    if (expiry.isBefore(now)) {
      return Duration.zero;
    }

    return expiry.difference(now);
  }

  // ============================================================================
  // User Data
  // ============================================================================

  /// Save current user data as JSON
  Future<void> saveUser(Map<String, dynamic> userData) async {
    final jsonString = jsonEncode(userData);
    await _storage.write(key: StorageKeys.currentUser, value: jsonString);
  }

  /// Get current user data
  Future<Map<String, dynamic>?> getUser() async {
    final jsonString = await _storage.read(key: StorageKeys.currentUser);
    if (jsonString == null || jsonString.isEmpty) {
      return null;
    }

    try {
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Delete current user data
  Future<void> deleteUser() async {
    await _storage.delete(key: StorageKeys.currentUser);
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /// Clear all stored authentication data (logout)
  Future<void> clearAll() async {
    await Future.wait([
      deleteToken(),
      deleteRefreshToken(),
      deleteUser(),
    ]);
  }

  /// Check if storage has any authentication data
  Future<bool> hasAuthData() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // ============================================================================
  // Token Decoding
  // ============================================================================

  /// Get user ID from token
  Future<String?> getUserIdFromToken() async {
    final token = await getToken();
    if (token == null) return null;

    try {
      final decoded = JwtDecoder.decode(token);
      return decoded['sub'] as String? ?? decoded['userId'] as String?;
    } catch (_) {
      return null;
    }
  }

  /// Get user role from token
  Future<String?> getUserRoleFromToken() async {
    final token = await getToken();
    if (token == null) return null;

    try {
      final decoded = JwtDecoder.decode(token);
      return decoded['role'] as String?;
    } catch (_) {
      return null;
    }
  }

  /// Get all claims from token
  Future<Map<String, dynamic>?> getTokenClaims() async {
    final token = await getToken();
    if (token == null) return null;

    try {
      return JwtDecoder.decode(token);
    } catch (_) {
      return null;
    }
  }

  // ============================================================================
  // Generic Storage Methods
  // ============================================================================

  /// Store a value securely
  Future<void> write(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  /// Read a value from secure storage
  Future<String?> read(String key) async {
    return await _storage.read(key: key);
  }

  /// Delete a value from secure storage
  Future<void> delete(String key) async {
    await _storage.delete(key: key);
  }

  /// Check if a key exists
  Future<bool> containsKey(String key) async {
    return await _storage.containsKey(key: key);
  }
}
