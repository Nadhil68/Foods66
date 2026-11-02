import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/formatters.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/quantity_selector.dart';
import '../../widgets/empty_state.dart';
import '../checkout/checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Cart'),
        actions: [
          if (!cartProvider.isEmpty)
            TextButton(
              onPressed: () {
                cartProvider.clear();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cart cleared')),
                );
              },
              child: const Text('Clear',
                  style: TextStyle(color: AppColors.error)),
            ),
        ],
      ),
      body: cartProvider.isEmpty
          ? const EmptyState(
              icon: Icons.shopping_bag_outlined,
              title: 'Your cart is empty',
              subtitle: 'Add some delicious food to get started',
            )
          : Column(
              children: [
                // Cart items
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: cartProvider.itemList.length,
                    itemBuilder: (context, index) {
                      final item = cartProvider.itemList[index];
                      final imageUrl = item.image.startsWith('http')
                          ? item.image
                          : '${ApiConstants.imageBaseUrl}${item.image}';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: const [
                            BoxShadow(
                                color: AppColors.shadow, blurRadius: 6)
                          ],
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: CachedNetworkImage(
                                imageUrl: imageUrl,
                                width: 72,
                                height: 72,
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => Container(
                                  width: 72,
                                  height: 72,
                                  color: AppColors.surfaceVariant,
                                  child: const Icon(Icons.fastfood,
                                      color: AppColors.textHint),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.name,
                                      style: AppTextStyles.labelMedium,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 4),
                                  Text(Formatters.price(item.lineTotal),
                                      style: AppTextStyles.priceSmall),
                                  const SizedBox(height: 8),
                                  QuantitySelector(
                                    quantity: item.quantity,
                                    onIncrement: () =>
                                        cartProvider.incrementQuantity(
                                            item.foodId),
                                    onDecrement: () =>
                                        cartProvider.decrementQuantity(
                                            item.foodId),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline,
                                  color: AppColors.error, size: 22),
                              onPressed: () =>
                                  cartProvider.removeItem(item.foodId),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Summary
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.vertical(
                        top: Radius.circular(24)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.shadow,
                        blurRadius: 12,
                        offset: Offset(0, -4),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _summaryRow('Subtotal', Formatters.price(cartProvider.subtotal)),
                        const SizedBox(height: 6),
                        _summaryRow('Delivery Fee', Formatters.price(cartProvider.deliveryFee)),
                        const SizedBox(height: 6),
                        _summaryRow('Tax (5%)', Formatters.price(cartProvider.tax)),
                        if (cartProvider.discountAmount > 0) ...[
                          const SizedBox(height: 6),
                          _summaryRow('Discount', '-${Formatters.price(cartProvider.discountAmount)}',
                              valueColor: AppColors.success),
                        ],
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total', style: AppTextStyles.h4),
                            Text(Formatters.price(cartProvider.totalAmount),
                                style: AppTextStyles.price.copyWith(fontSize: 22)),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          height: 54,
                          child: ElevatedButton(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) => const CheckoutScreen()),
                            ),
                            child: Text(
                                'Proceed to Checkout  •  ${Formatters.price(cartProvider.totalAmount)}'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _summaryRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.bodyMedium
            .copyWith(color: AppColors.textSecondary)),
        Text(value,
            style: AppTextStyles.labelMedium
                .copyWith(color: valueColor ?? AppColors.textPrimary)),
      ],
    );
  }
}
