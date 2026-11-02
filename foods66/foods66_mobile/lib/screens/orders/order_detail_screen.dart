import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../providers/order_provider.dart';
import '../../widgets/order_status_badge.dart';


class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OrderProvider>(context, listen: false)
          .fetchOrderById(widget.orderId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = Provider.of<OrderProvider>(context);
    final order = orderProvider.currentOrder;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          order != null
              ? 'Order #${order.id.substring(order.id.length - 6).toUpperCase()}'
              : 'Order Details',
        ),
      ),
      body: orderProvider.isLoading || order == null
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () =>
                  orderProvider.fetchOrderById(widget.orderId).then((_) {}),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status
                    Row(
                      children: [
                        OrderStatusBadge(status: order.status),
                        const Spacer(),
                        Text(Formatters.dateTime(order.createdAt),
                            style: AppTextStyles.bodySmall),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Items
                    Text('Items', style: AppTextStyles.h4),
                    const SizedBox(height: 8),
                    ...order.items.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(25),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Center(
                                child: Text('${item.quantity}',
                                    style: AppTextStyles.labelSmall
                                        .copyWith(color: AppColors.primary)),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(item.name,
                                  style: AppTextStyles.bodyMedium),
                            ),
                            Text(Formatters.price(item.lineTotal),
                                style: AppTextStyles.labelMedium),
                          ],
                        ),
                      ),
                    ),
                    const Divider(height: 24),

                    // Price Summary
                    _summaryRow('Subtotal', Formatters.price(order.subtotal)),
                    _summaryRow('Delivery Fee', Formatters.price(order.deliveryFee)),
                    _summaryRow('Tax', Formatters.price(order.tax)),
                    if (order.discountAmount > 0)
                      _summaryRow('Discount',
                          '-${Formatters.price(order.discountAmount)}',
                          valueColor: AppColors.success),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Total', style: AppTextStyles.h4),
                        Text(Formatters.price(order.totalPrice),
                            style: AppTextStyles.price.copyWith(fontSize: 20)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Delivery Address
                    if (order.deliveryAddress != null) ...[
                      Text('Delivery Address', style: AppTextStyles.h4),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.location_on,
                                color: AppColors.primary, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                order.deliveryAddress!.fullAddress,
                                style: AppTextStyles.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Payment Info
                    Text('Payment', style: AppTextStyles.h4),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            order.paymentMethod == 'COD'
                                ? Icons.money
                                : Icons.credit_card,
                            color: AppColors.textSecondary,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            order.paymentMethod == 'COD'
                                ? 'Cash on Delivery'
                                : 'Card Payment',
                            style: AppTextStyles.bodyMedium,
                          ),
                          const Spacer(),
                          Text(
                            Formatters.orderStatus(order.paymentStatus),
                            style: AppTextStyles.labelSmall.copyWith(
                              color: order.paymentStatus == 'PAID'
                                  ? AppColors.success
                                  : AppColors.warning,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Timeline
                    if (order.timeline.isNotEmpty) ...[
                      Text('Order Timeline', style: AppTextStyles.h4),
                      const SizedBox(height: 12),
                      ...List.generate(order.timeline.length, (i) {
                        final entry = order.timeline[i];
                        final isLast = i == order.timeline.length - 1;
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
                                        color: isLast
                                            ? AppColors.primary
                                            : AppColors.textHint,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    if (!isLast)
                                      Expanded(
                                        child: Container(
                                            width: 2,
                                            color: AppColors.divider),
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Padding(
                                  padding:
                                      EdgeInsets.only(bottom: isLast ? 0 : 16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
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
                                      if (entry.note != null &&
                                          entry.note!.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(entry.note!,
                                            style: AppTextStyles.bodySmall
                                                .copyWith(
                                                    color:
                                                        AppColors.textHint)),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                    const SizedBox(height: 24),

                    // Cancel button
                    if (order.canCancel)
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: OutlinedButton(
                          onPressed: () async {
                            final confirmed = await showDialog<bool>(
                              context: context,
                              builder: (_) => AlertDialog(
                                title: const Text('Cancel Order?'),
                                content: const Text(
                                    'Are you sure you want to cancel this order?'),
                                actions: [
                                  TextButton(
                                      onPressed: () =>
                                          Navigator.pop(context, false),
                                      child: const Text('No')),
                                  TextButton(
                                      onPressed: () =>
                                          Navigator.pop(context, true),
                                      child: const Text('Yes, Cancel',
                                          style: TextStyle(
                                              color: AppColors.error))),
                                ],
                              ),
                            );
                            if (confirmed == true && mounted) {
                              await orderProvider.cancelOrder(order.id);
                              if (mounted) {
                                await orderProvider.fetchOrderById(order.id);
                              }
                            }
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.error,
                            side: const BorderSide(color: AppColors.error),
                          ),
                          child: const Text('Cancel Order'),
                        ),
                      ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _summaryRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: AppTextStyles.bodyMedium
                  .copyWith(color: AppColors.textSecondary)),
          Text(value,
              style: AppTextStyles.labelMedium
                  .copyWith(color: valueColor ?? AppColors.textPrimary)),
        ],
      ),
    );
  }
}
