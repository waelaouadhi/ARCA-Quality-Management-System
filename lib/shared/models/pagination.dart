import 'package:equatable/equatable.dart';

/// Pagination information from backend
class PaginationInfo extends Equatable {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasNext;
  final bool hasPrev;

  const PaginationInfo({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrev,
  });

  /// Create PaginationInfo from JSON (matches backend GraphQL response)
  factory PaginationInfo.fromJson(Map<String, dynamic> json) {
    return PaginationInfo(
      page: json['page'] as int,
      limit: json['limit'] as int,
      total: json['total'] as int,
      totalPages: json['totalPages'] as int,
      hasNext: json['hasNext'] as bool,
      hasPrev: json['hasPrev'] as bool,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
      'total': total,
      'totalPages': totalPages,
      'hasNext': hasNext,
      'hasPrev': hasPrev,
    };
  }

  /// Check if there are no items
  bool get isEmpty => total == 0;

  /// Check if there are items
  bool get isNotEmpty => total > 0;

  /// Get current page (backend uses 1-based)
  int get currentPage => page;

  /// Check if there's a next page
  bool get hasNextPage => hasNext;

  /// Check if there's a previous page
  bool get hasPreviousPage => hasPrev;

  /// Get page size
  int get pageSize => limit;

  /// Get total count
  int get totalCount => total;

  /// Get range of items being displayed
  String get displayRange {
    if (isEmpty) return '0-0 of 0';
    
    final start = (page - 1) * limit + 1;
    final end = (page * limit).clamp(1, total);
    
    return '$start-$end of $total';
  }

  @override
  List<Object?> get props => [
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      ];
}

/// Pagination request parameters
class PaginationInput extends Equatable {
  final int page;
  final int limit;

  const PaginationInput({
    this.page = 1,
    this.limit = 20,
  });

  /// Convert to GraphQL variables
  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
    };
  }

  /// Create next page request
  PaginationInput nextPage() {
    return PaginationInput(
      page: page + 1,
      limit: limit,
    );
  }

  /// Create previous page request
  PaginationInput previousPage() {
    return PaginationInput(
      page: (page - 1).clamp(1, double.infinity).toInt(),
      limit: limit,
    );
  }

  /// Create first page request
  PaginationInput firstPage() {
    return PaginationInput(
      page: 1,
      limit: limit,
    );
  }

  /// Jump to specific page
  PaginationInput toPage(int pageNumber) {
    return PaginationInput(
      page: pageNumber.clamp(1, double.infinity).toInt(),
      limit: limit,
    );
  }

  @override
  List<Object?> get props => [page, limit];
}