import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/food_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/food_card.dart';
import '../../widgets/empty_state.dart';
import '../food/food_detail_screen.dart';

class HomeFragment extends StatefulWidget {
  const HomeFragment({super.key});

  @override
  State<HomeFragment> createState() => _HomeFragmentState();
}

class _HomeFragmentState extends State<HomeFragment> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<FoodProvider>(context, listen: false).fetchFoods();
    });
  }

  @override
  Widget build(BuildContext context) {
    final foodProvider = Provider.of<FoodProvider>(context);
    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => foodProvider.fetchFoods(),
      child: CustomScrollView(
        slivers: [
          // Greeting
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hello, ${authProvider.user?.name.split(' ').first ?? 'Foodie'} 👋',
                    style: AppTextStyles.h3,
                  ),
                  const SizedBox(height: 4),
                  Text('What would you like to eat today?',
                      style: AppTextStyles.bodyMedium
                          .copyWith(color: AppColors.textSecondary)),
                ],
              ),
            ),
          ),

          // Categories
          if (foodProvider.categories.length > 1)
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: foodProvider.categories.length,
                  itemBuilder: (context, index) {
                    final category = foodProvider.categories[index];
                    final isSelected =
                        category == foodProvider.selectedCategory;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(category),
                        selected: isSelected,
                        onSelected: (_) {
                          foodProvider.selectCategory(category);
                        },
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.w500,
                        ),
                        showCheckmark: false,
                      ),
                    );
                  },
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 12)),

          // Section title
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                foodProvider.selectedCategory == 'All'
                    ? 'All Items'
                    : foodProvider.selectedCategory,
                style: AppTextStyles.h4,
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // Food list
          if (foodProvider.isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(
                color: AppColors.primary)),
            )
          else if (foodProvider.error != null)
            SliverFillRemaining(
              child: ErrorState(
                message: foodProvider.error!,
                onRetry: () => foodProvider.fetchFoods(),
              ),
            )
          else if (foodProvider.filteredFoods.isEmpty)
            const SliverFillRemaining(
              child: EmptyState(
                icon: Icons.restaurant_menu,
                title: 'No foods found',
                subtitle: 'Try a different category',
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final food = foodProvider.filteredFoods[index];
                    return FoodCard(
                      food: food,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => FoodDetailScreen(food: food),
                        ),
                      ),
                      onAddToCart: food.available
                          ? () {
                              cartProvider.addItem(food);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('${food.name} added to cart'),
                                  duration: const Duration(seconds: 1),
                                ),
                              );
                            }
                          : null,
                    );
                  },
                  childCount: foodProvider.filteredFoods.length,
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),
        ],
      ),
    );
  }
}
