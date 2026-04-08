import 'package:intl/intl.dart';

class AppFormatters {
  AppFormatters._();

  static final DateFormat _dateTimeFormat = DateFormat('MMM d, y, h:mm a');
  static final DateFormat _dateFormat = DateFormat('MMM d, y');

  static String formatDateTime(DateTime dateTime) {
    return _dateTimeFormat.format(dateTime.toLocal());
  }

  static String formatDate(DateTime dateTime) {
    return _dateFormat.format(dateTime.toLocal());
  }

  static String formatUserFacingId(String id, {String prefix = 'ID'}) {
    final compact = id.replaceAll('-', '');
    final short = compact.length > 8 ? compact.substring(0, 8) : compact;
    return '$prefix-${short.toUpperCase()}';
  }

  static bool isValidId(String id) {
    return id.trim().isNotEmpty && id.length >= 6;
  }
}

