import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../providers/order_provider.dart';
import '../../widgets/order_status_badge.dart';
import '../../widgets/empty_state.dart';
import 'order_detail_screen.dart';

class OrderListScreen extends StatefulWidget {
  const OrderListScreen({super.key});

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OrderProvider>(context, listen: false).fetchOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = Provider.of<OrderProvider>(context);

    return Column(
      children: [
        TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: 'Active (${orderProvider.activeOrders.length})'),
            Tab(text: 'Past (${orderProvider.pastOrders.length})'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildOrderList(orderProvider, orderProvider.activeOrders, true),
              _buildOrderList(orderProvider, orderProvider.pastOrders, false),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOrderList(OrderProvider provider,
      List orders, bool isActive) {
    if (provider.isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (provider.error != null) {
      return ErrorState(
        message: provider.error!,
        onRetry: provider.fetchOrders,
      );
    }

    if (orders.isEmpty) {
      return EmptyState(
        icon: isActive ? Icons.receipt_long : Icons.history,
        title: isActive ? 'No active orders' : 'No past orders',
        subtitle: isActive
            ? 'Your current orders will appear here'
            : 'Your completed orders will appear here',
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: provider.fetchOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return GestureDetector(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => OrderDetailScreen(orderId: order.id),
              ),
            ),
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(color: AppColors.shadow, blurRadius: 6)
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Order #${order.id.substring(order.id.length - 6).toUpperCase()}',
                          style: AppTextStyles.labelLarge,
                        ),
                      ),
                      OrderStatusBadge(status: order.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    order.items
                        .map((i) => '${i.quantity}× ${i.name}')
                        .join(', '),
                    style: AppTextStyles.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(Formatters.timeAgo(order.createdAt),
                          style: AppTextStyles.bodySmall),
                      Text(Formatters.price(order.totalPrice),
                          style: AppTextStyles.priceSmall),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
