import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/formatters.dart';
import '../../models/food_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/favorites_provider.dart';

class FoodDetailScreen extends StatefulWidget {
  final FoodModel food;

  const FoodDetailScreen({super.key, required this.food});

  @override
  State<FoodDetailScreen> createState() => _FoodDetailScreenState();
}

class _FoodDetailScreenState extends State<FoodDetailScreen> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final favProvider = Provider.of<FavoritesProvider>(context);
    final imageUrl = widget.food.image.startsWith('http')
        ? widget.food.image
        : '${ApiConstants.imageBaseUrl}${widget.food.image}';

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withAlpha(80),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_ios_new,
                    color: Colors.white, size: 18),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withAlpha(80),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    favProvider.isFavorited(widget.food.id)
                        ? Icons.favorite
                        : Icons.favorite_border,
                    color: favProvider.isFavorited(widget.food.id)
                        ? AppColors.primary
                        : Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: () => favProvider.toggleFavorite(widget.food),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'food_${widget.food.id}',
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                  errorWidget: (_, __, ___) => Container(
                    color: AppColors.surfaceVariant,
                    child: const Icon(Icons.fastfood, size: 64,
                        color: AppColors.textHint),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category chip
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(25),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(widget.food.category,
                        style: AppTextStyles.labelSmall
                            .copyWith(color: AppColors.primary)),
                  ),
                  const SizedBox(height: 12),

                  // Name & Price
                  Text(widget.food.name, style: AppTextStyles.h2),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(Formatters.price(widget.food.price),
                          style: AppTextStyles.price.copyWith(fontSize: 24)),
                      if (widget.food.hasDiscount) ...[
                        const SizedBox(width: 10),
                        Text(Formatters.price(widget.food.originalPrice!),
                            style: AppTextStyles.priceStrike
                                .copyWith(fontSize: 16)),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  if (!widget.food.available)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.error.withAlpha(25),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('Currently Unavailable',
                          style: AppTextStyles.labelSmall
                              .copyWith(color: AppColors.error)),
                    )
                  else
                    Text(
                      widget.food.stock > 0
                          ? '${widget.food.stock} left in stock'
                          : 'Out of stock',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: widget.food.stock > 10
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ),
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 16),

                  // Description
                  Text('Description', style: AppTextStyles.h4),
                  const SizedBox(height: 8),
                  Text(widget.food.description,
                      style: AppTextStyles.bodyMedium
                          .copyWith(color: AppColors.textSecondary, height: 1.6)),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: widget.food.available
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadow,
                    blurRadius: 12,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    // Quantity selector
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove, size: 20),
                            onPressed: _quantity > 1
                                ? () => setState(() => _quantity--)
                                : null,
                          ),
                          Text('$_quantity',
                              style: AppTextStyles.labelLarge),
                          IconButton(
                            icon: const Icon(Icons.add, size: 20),
                            onPressed: () => setState(() => _quantity++),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            for (int i = 0; i < _quantity; i++) {
                              cartProvider.addItem(widget.food);
                            }
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    '$_quantity × ${widget.food.name} added to cart'),
                                duration: const Duration(seconds: 1),
                              ),
                            );
                            Navigator.pop(context);
                          },
                          child: Text(
                            'Add to Cart  •  ${Formatters.price(widget.food.price * _quantity)}',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
