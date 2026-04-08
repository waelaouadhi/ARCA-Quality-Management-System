import 'package:equatable/equatable.dart';

/// Pagination metadata from backend
/// Matches backend PaginationInfo type
class PaginationMeta extends Equatable {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasNext;
  final bool hasPrev;

  const PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrev,
  });

  /// Default empty pagination
  const PaginationMeta.empty()
      : page = 1,
        limit = 10,
        total = 0,
        totalPages = 0,
        hasNext = false,
        hasPrev = false;

  /// First page with default limit
  const PaginationMeta.firstPage({this.limit = 10})
      : page = 1,
        total = 0,
        totalPages = 0,
        hasNext = false,
        hasPrev = false;

  /// Create from JSON map
  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 10,
      total: json['total'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 0,
      hasNext: json['hasNext'] as bool? ?? false,
      hasPrev: json['hasPrev'] as bool? ?? false,
    );
  }

  /// Convert to JSON map
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

  /// Copy with modifications
  PaginationMeta copyWith({
    int? page,
    int? limit,
    int? total,
    int? totalPages,
    bool? hasNext,
    bool? hasPrev,
  }) {
    return PaginationMeta(
      page: page ?? this.page,
      limit: limit ?? this.limit,
      total: total ?? this.total,
      totalPages: totalPages ?? this.totalPages,
      hasNext: hasNext ?? this.hasNext,
      hasPrev: hasPrev ?? this.hasPrev,
    );
  }

  /// Get next page number
  int get nextPage => hasNext ? page + 1 : page;

  /// Get previous page number
  int get prevPage => hasPrev ? page - 1 : page;

  /// Check if this is the first page
  bool get isFirstPage => page == 1;

  /// Check if this is the last page
  bool get isLastPage => !hasNext;

  /// Check if there are any items
  bool get isEmpty => total == 0;

  /// Check if there are items
  bool get isNotEmpty => total > 0;

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
class PaginationParams extends Equatable {
  final int page;
  final int limit;

  const PaginationParams({
    this.page = 1,
    this.limit = 10,
  });

  /// Default first page
  const PaginationParams.first({this.limit = 10}) : page = 1;

  /// Convert to JSON map for GraphQL variables
  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
    };
  }

  /// Get params for next page
  PaginationParams nextPage() {
    return PaginationParams(
      page: page + 1,
      limit: limit,
    );
  }

  /// Get params for previous page
  PaginationParams prevPage() {
    return PaginationParams(
      page: page > 1 ? page - 1 : 1,
      limit: limit,
    );
  }

  /// Copy with modifications
  PaginationParams copyWith({
    int? page,
    int? limit,
  }) {
    return PaginationParams(
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }

  @override
  List<Object?> get props => [page, limit];
}

/// Generic paginated list wrapper
class PaginatedList<T> extends Equatable {
  final List<T> data;
  final PaginationMeta pagination;

  const PaginatedList({
    required this.data,
    required this.pagination,
  });

  /// Create empty paginated list
  const PaginatedList.empty()
      : data = const [],
        pagination = const PaginationMeta.empty();

  /// Create from JSON with item parser
  factory PaginatedList.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    final dataList = json['data'] as List<dynamic>? ?? [];
    final paginationJson =
        json['pagination'] as Map<String, dynamic>? ?? const {};

    return PaginatedList(
      data: dataList
          .map((item) => fromJsonT(item as Map<String, dynamic>))
          .toList(),
      pagination: PaginationMeta.fromJson(paginationJson),
    );
  }

  /// Check if list is empty
  bool get isEmpty => data.isEmpty;

  /// Check if list has items
  bool get isNotEmpty => data.isNotEmpty;

  /// Get item count
  int get length => data.length;

  /// Check if there are more pages
  bool get hasMore => pagination.hasNext;

  /// Get item at index
  T operator [](int index) => data[index];

  /// Append more items (for infinite scroll)
  PaginatedList<T> append(PaginatedList<T> other) {
    return PaginatedList(
      data: [...data, ...other.data],
      pagination: other.pagination,
    );
  }

  /// Map data to different type
  PaginatedList<R> map<R>(R Function(T) mapper) {
    return PaginatedList(
      data: data.map(mapper).toList(),
      pagination: pagination,
    );
  }

  @override
  List<Object?> get props => [data, pagination];
}
