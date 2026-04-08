import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/pagination.dart';
import 'app_icons.dart';

/// Reusable pagination widget for lists
class PaginationWidget extends StatelessWidget {
  final PaginationInfo paginationInfo;
  final VoidCallback? onPreviousPage;
  final VoidCallback? onNextPage;
  final ValueChanged<int>? onPageChanged;
  final bool isLoading;

  const PaginationWidget({
    super.key,
    required this.paginationInfo,
    this.onPreviousPage,
    this.onNextPage,
    this.onPageChanged,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (paginationInfo.isEmpty) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: theme.dividerColor,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Items range display
          Text(
            paginationInfo.displayRange,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          
          const Spacer(),
          
          // Page navigation
          if (paginationInfo.totalPages > 1) ...[
            // Previous page button
            IconButton(
              onPressed: isLoading || !paginationInfo.hasPreviousPage
                  ? null
                  : onPreviousPage,
              icon: ThemedIcons.icon(
                context,
                AppIcons.chevronLeft,
                size: IconSizes.sm,
              ),
              tooltip: 'Previous page',
            ),
            
            // Page input/display
            _buildPageSelector(context),
            
            // Next page button
            IconButton(
              onPressed: isLoading || !paginationInfo.hasNextPage
                  ? null
                  : onNextPage,
              icon: ThemedIcons.icon(
                context,
                AppIcons.chevronRight,
                size: IconSizes.sm,
              ),
              tooltip: 'Next page',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPageSelector(BuildContext context) {
    final theme = Theme.of(context);

    if (paginationInfo.totalPages <= 5) {
      // Show page numbers for small page counts
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (int i = 1; i <= paginationInfo.totalPages; i++)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2.0),
              child: _buildPageButton(context, i),
            ),
        ],
      );
    }

    // Show current page with input for large page counts
    return Container(
      constraints: const BoxConstraints(minWidth: 80),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Page',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 60,
            child: TextFormField(
              initialValue: paginationInfo.currentPage.toString(),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall,
              decoration: InputDecoration(
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              onFieldSubmitted: (value) {
                final page = int.tryParse(value);
                if (page != null && 
                    page >= 1 && 
                    page <= paginationInfo.totalPages &&
                    page != paginationInfo.currentPage) {
                  onPageChanged?.call(page);
                }
              },
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'of ${paginationInfo.totalPages}',
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _buildPageButton(BuildContext context, int pageNumber) {
    final theme = Theme.of(context);
    final isCurrentPage = pageNumber == paginationInfo.currentPage;

    return Material(
      color: isCurrentPage 
          ? theme.colorScheme.primary
          : Colors.transparent,
      borderRadius: BorderRadius.circular(4),
      child: InkWell(
        onTap: isCurrentPage || isLoading
            ? null
            : () => onPageChanged?.call(pageNumber),
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 8,
          ),
          child: Text(
            pageNumber.toString(),
            style: theme.textTheme.bodySmall?.copyWith(
              color: isCurrentPage
                  ? theme.colorScheme.onPrimary
                  : theme.colorScheme.onSurface,
              fontWeight: isCurrentPage
                  ? FontWeight.bold
                  : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}