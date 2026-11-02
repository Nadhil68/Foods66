import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/favorites_provider.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/food_card.dart';
import '../../widgets/empty_state.dart';
import '../food/food_detail_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<FavoritesProvider>(context, listen: false).fetchFavorites();
    });
  }

  @override
  Widget build(BuildContext context) {
    final favProvider = Provider.of<FavoritesProvider>(context);
    final cartProvider = Provider.of<CartProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: favProvider.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : favProvider.favorites.isEmpty
              ? const EmptyState(
                  icon: Icons.favorite_outline,
                  title: 'No favorites yet',
                  subtitle: 'Tap the heart icon on any food to save it here',
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: favProvider.fetchFavorites,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: favProvider.favorites.length,
                    itemBuilder: (context, index) {
                      final food = favProvider.favorites[index];
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
                                    content:
                                        Text('${food.name} added to cart'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              }
                            : null,
                        trailing: IconButton(
                          icon: const Icon(Icons.favorite,
                              color: AppColors.primary),
                          onPressed: () => favProvider.toggleFavorite(food),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
