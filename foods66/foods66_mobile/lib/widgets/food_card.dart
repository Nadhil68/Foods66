import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text_styles.dart';
import '../core/constants/api_constants.dart';
import '../core/utils/formatters.dart';
import '../models/food_model.dart';

class FoodCard extends StatelessWidget {
  final FoodModel food;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final Widget? trailing;

  const FoodCard({
    super.key,
    required this.food,
    this.onTap,
    this.onAddToCart,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = food.image.startsWith('http')
        ? food.image
        : '${ApiConstants.imageBaseUrl}${food.image}';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: AppColors.shadow,
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Hero(
              tag: 'food_${food.id}',
              child: ClipRRect(
                borderRadius: const BorderRadius.horizontal(
                    left: Radius.circular(16)),
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  width: 110,
                  height: 110,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    width: 110,
                    height: 110,
                    color: AppColors.shimmerBase,
                    child: const Icon(Icons.fastfood, color: AppColors.textHint, size: 32),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    width: 110,
                    height: 110,
                    color: AppColors.surfaceVariant,
                    child: const Icon(Icons.fastfood, color: AppColors.textHint, size: 32),
                  ),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(food.name, style: AppTextStyles.labelLarge,
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text(food.description,
                        style: AppTextStyles.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(Formatters.price(food.price),
                            style: AppTextStyles.price),
                        if (food.hasDiscount) ...[
                          const SizedBox(width: 6),
                          Text(Formatters.price(food.originalPrice!),
                              style: AppTextStyles.priceStrike),
                        ],
                        const Spacer(),
                        if (!food.available)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.error.withAlpha(25),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text('Unavailable',
                                style: AppTextStyles.bodySmall
                                    .copyWith(color: AppColors.error)),
                          )
                        else if (trailing != null)
                          trailing!
                        else if (onAddToCart != null)
                          Material(
                            color: AppColors.primary.withAlpha(25),
                            borderRadius: BorderRadius.circular(10),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(10),
                              onTap: onAddToCart,
                              child: const Padding(
                                padding: EdgeInsets.all(8),
                                child: Icon(Icons.add,
                                    color: AppColors.primary, size: 22),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
