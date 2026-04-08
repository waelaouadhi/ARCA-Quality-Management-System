/// User roles matching backend enum
enum UserRole {
  admin('ADMIN'),
  manager('MANAGER'),
  user('USER');

  final String value;
  const UserRole(this.value);

  static UserRole fromString(String value) {
    return UserRole.values.firstWhere(
      (role) => role.value == value.toUpperCase(),
      orElse: () => UserRole.user,
    );
  }

  bool get isAdmin => this == UserRole.admin;
  bool get isManager => this == UserRole.manager;
  bool get isUser => this == UserRole.user;

  /// Check if this role has at least the privileges of another role
  bool hasAtLeast(UserRole other) {
    const hierarchy = [UserRole.user, UserRole.manager, UserRole.admin];
    return hierarchy.indexOf(this) >= hierarchy.indexOf(other);
  }
}

/// Document status matching backend DocStatus enum
enum DocumentStatus {
  draft('DRAFT'),
  review('REVIEW'),
  approved('APPROVED'),
  archived('ARCHIVED');

  final String value;
  const DocumentStatus(this.value);

  static DocumentStatus fromString(String value) {
    return DocumentStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => DocumentStatus.draft,
    );
  }
}

/// Non-Conformance severity matching backend Severity enum
enum Severity {
  low('LOW'),
  medium('MEDIUM'),
  high('HIGH'),
  critical('CRITICAL');

  final String value;
  const Severity(this.value);

  static Severity fromString(String value) {
    return Severity.values.firstWhere(
      (severity) => severity.value == value.toUpperCase(),
      orElse: () => Severity.medium,
    );
  }

  /// Get color hint for UI (actual colors in theme)
  String get colorHint {
    return switch (this) {
      Severity.low => 'info',
      Severity.medium => 'warning',
      Severity.high => 'error',
      Severity.critical => 'critical',
    };
  }
}

/// Non-Conformance status matching backend NCStatus enum
enum NCStatus {
  open('OPEN'),
  inProgress('IN_PROGRESS'),
  resolved('RESOLVED'),
  closed('CLOSED');

  final String value;
  const NCStatus(this.value);

  static NCStatus fromString(String value) {
    return NCStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => NCStatus.open,
    );
  }

  bool get isActive => this == NCStatus.open || this == NCStatus.inProgress;
  bool get isClosed => this == NCStatus.closed;
}

/// Corrective Action status matching backend ActionStatus enum
enum ActionStatus {
  pending('PENDING'),
  inProgress('IN_PROGRESS'),
  done('DONE');

  final String value;
  const ActionStatus(this.value);

  static ActionStatus fromString(String value) {
    return ActionStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => ActionStatus.pending,
    );
  }

  bool get isComplete => this == ActionStatus.done;
  bool get isActive => this != ActionStatus.done;
}

/// Escalation level matching backend EscalationLevel enum
enum EscalationLevel {
  none('NONE'),
  level1('LEVEL_1'),
  level2('LEVEL_2'),
  level3('LEVEL_3');

  final String value;
  const EscalationLevel(this.value);

  static EscalationLevel fromString(String value) {
    return EscalationLevel.values.firstWhere(
      (level) => level.value == value.toUpperCase(),
      orElse: () => EscalationLevel.none,
    );
  }

  int get levelNumber {
    return switch (this) {
      EscalationLevel.none => 0,
      EscalationLevel.level1 => 1,
      EscalationLevel.level2 => 2,
      EscalationLevel.level3 => 3,
    };
  }
}

/// Escalation status matching backend EscalationStatus enum
enum EscalationStatus {
  none('NONE'),
  active('ACTIVE'),
  resolved('RESOLVED'),
  paused('PAUSED');

  final String value;
  const EscalationStatus(this.value);

  static EscalationStatus fromString(String value) {
    return EscalationStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => EscalationStatus.none,
    );
  }
}

/// Notification channel matching backend NotificationChannel enum
enum NotificationChannel {
  email('EMAIL'),
  inApp('IN_APP'),
  websocket('WEBSOCKET'),
  sms('SMS'),
  slack('SLACK');

  final String value;
  const NotificationChannel(this.value);

  static NotificationChannel fromString(String value) {
    return NotificationChannel.values.firstWhere(
      (channel) => channel.value == value.toUpperCase(),
      orElse: () => NotificationChannel.inApp,
    );
  }
}
