/// QMS Application Constants
/// Centralized configuration values for the application
class AppConstants {
  AppConstants._();

  // ============ App Information ============
  static const String appName = 'QMS';
  static const String appFullName = 'Quality Management System';
  static const String appVersion = '1.0.0';

  // ============ API Configuration ============
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration uploadTimeout = Duration(minutes: 5);
  static const int maxRetries = 3;

  // ============ Pagination ============
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // ============ Animation Durations ============
  static const Duration animationFast = Duration(milliseconds: 150);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);
  static const Duration splashDuration = Duration(seconds: 2);

  // ============ Debounce & Throttle ============
  static const Duration debounceDuration = Duration(milliseconds: 500);
  static const Duration throttleDuration = Duration(milliseconds: 1000);

  // ============ Cache ============
  static const Duration cacheExpiration = Duration(hours: 24);
  static const int maxCacheSize = 100;

  // ============ Validation Rules ============
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int minUsernameLength = 3;
  static const int maxUsernameLength = 50;
  static const int maxEmailLength = 254;
  static const int maxFileNameLength = 255;

  // ============ File Upload ============
  static const int maxFileSize = 10 * 1024 * 1024; // 10 MB
  static const int maxImageSize = 5 * 1024 * 1024; // 5 MB
  static const List<String> allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  static const List<String> allowedDocumentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

  // ============ Date & Time Formats ============
  static const String dateFormat = 'yyyy-MM-dd';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm';
  static const String displayDateFormat = 'MMM dd, yyyy';
  static const String displayDateTimeFormat = 'MMM dd, yyyy HH:mm';

  // ============ Storage Keys ============
  static const String authTokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';
  static const String onboardingKey = 'onboarding_completed';

  // ============ Error Messages ============
  static const String genericError = 'Something went wrong. Please try again.';
  static const String networkError = 'No internet connection. Please check your network.';
  static const String timeoutError = 'Request timed out. Please try again.';
  static const String serverError = 'Server error. Please try again later.';
  static const String authError = 'Authentication failed. Please login again.';

  // ============ Success Messages ============
  static const String loginSuccess = 'Welcome back!';
  static const String logoutSuccess = 'You have been logged out.';
  static const String saveSuccess = 'Changes saved successfully.';
  static const String deleteSuccess = 'Item deleted successfully.';
  static const String updateSuccess = 'Item updated successfully.';

  // ============ Regex Patterns ============
  static final RegExp emailPattern = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );
  static final RegExp phonePattern = RegExp(
    r'^\+?[\d\s\-\(\)]{10,}$',
  );
  static final RegExp passwordPattern = RegExp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
  );
}

/// Asset paths
class AppAssets {
  AppAssets._();

  // ============ Images ============
  static const String imagesPath = 'assets/images';
  static const String logo = '$imagesPath/logo.png';
  static const String logoLight = '$imagesPath/logo_light.png';
  static const String logoDark = '$imagesPath/logo_dark.png';
  static const String placeholder = '$imagesPath/placeholder.png';
  static const String emptyState = '$imagesPath/empty_state.png';
  static const String errorState = '$imagesPath/error_state.png';
  static const String onboarding1 = '$imagesPath/onboarding_1.png';
  static const String onboarding2 = '$imagesPath/onboarding_2.png';
  static const String onboarding3 = '$imagesPath/onboarding_3.png';

  // ============ Icons ============
  static const String iconsPath = 'assets/icons';
  static const String iconDashboard = '$iconsPath/dashboard.svg';
  static const String iconDocuments = '$iconsPath/documents.svg';
  static const String iconAudits = '$iconsPath/audits.svg';
  static const String iconActions = '$iconsPath/actions.svg';
  static const String iconReports = '$iconsPath/reports.svg';
  static const String iconSettings = '$iconsPath/settings.svg';
  static const String iconUser = '$iconsPath/user.svg';
  static const String iconNotification = '$iconsPath/notification.svg';
  static const String iconSearch = '$iconsPath/search.svg';
  static const String iconFilter = '$iconsPath/filter.svg';

  // ============ Fonts ============
  static const String fontsPath = 'assets/fonts';
}
