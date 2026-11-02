import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text_styles.dart';
import '../core/utils/formatters.dart';
import '../models/order_model.dart';

class OrderStatusBadge extends StatelessWidget {
  final String status;

  const OrderStatusBadge({super.key, required this.status});

  Color get _color {
    switch (status) {
      case 'PLACED':
      case 'PAYMENT_PENDING':
        return AppColors.statusPlaced;
      case 'PAID':
      case 'PAYMENT_CONFIRMED':
      case 'RESTAURANT_CONFIRMED':
        return AppColors.statusConfirmed;
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        return AppColors.statusPreparing;
      case 'ASSIGNED':
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return AppColors.statusOnTheWay;
      case 'DELIVERED':
        return AppColors.statusDelivered;
      case 'CANCELLED':
      case 'REFUNDED':
        return AppColors.statusCancelled;
      default:
        return AppColors.statusPlaced;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: _color.withAlpha(25),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _color.withAlpha(100)),
      ),
      child: Text(
        Formatters.orderStatus(status),
        style: AppTextStyles.labelSmall.copyWith(
          color: _color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class OrderTimeline extends StatelessWidget {
  final List<OrderTimelineEntry> timeline;

  const OrderTimeline({super.key, required this.timeline});

  @override
  Widget build(BuildContext context) {
    if (timeline.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < timeline.length; i++)
          _buildTimelineEntry(timeline[i], i == timeline.length - 1),
      ],
    );
  }

  Widget _buildTimelineEntry(OrderTimelineEntry entry, bool isLast) {
    final color = _getStatusColor(entry.status);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: AppColors.divider,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    Formatters.orderStatus(entry.status),
                    style: AppTextStyles.labelMedium,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    Formatters.dateTime(entry.timestamp),
                    style: AppTextStyles.bodySmall,
                  ),
                  if (entry.note != null && entry.note!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(entry.note!,
                        style: AppTextStyles.bodySmall
                            .copyWith(color: AppColors.textHint)),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'DELIVERED':
        return AppColors.statusDelivered;
      case 'CANCELLED':
      case 'REFUNDED':
        return AppColors.statusCancelled;
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
      case 'ASSIGNED':
        return AppColors.statusOnTheWay;
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        return AppColors.statusPreparing;
      default:
        return AppColors.statusConfirmed;
    }
  }
}
