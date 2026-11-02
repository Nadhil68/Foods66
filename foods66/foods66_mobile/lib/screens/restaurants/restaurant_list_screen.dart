import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/restaurant_provider.dart';
import '../../widgets/restaurant_card.dart';
import '../../widgets/empty_state.dart';
import 'restaurant_detail_screen.dart';

class RestaurantListScreen extends StatefulWidget {
  const RestaurantListScreen({super.key});

  @override
  State<RestaurantListScreen> createState() => _RestaurantListScreenState();
}

class _RestaurantListScreenState extends State<RestaurantListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<RestaurantProvider>(context, listen: false).fetchRestaurants();
    });
  }

  @override
  Widget build(BuildContext context) {
    final restaurantProvider = Provider.of<RestaurantProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Restaurants')),
      body: restaurantProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : restaurantProvider.error != null
              ? ErrorState(
                  message: restaurantProvider.error!,
                  onRetry: restaurantProvider.fetchRestaurants,
                )
              : restaurantProvider.restaurants.isEmpty
                  ? const EmptyState(
                      icon: Icons.store_mall_directory_outlined,
                      title: 'No restaurants',
                      subtitle: 'Check back later for new places',
                    )
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: restaurantProvider.fetchRestaurants,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(20),
                        itemCount: restaurantProvider.restaurants.length,
                        itemBuilder: (context, index) {
                          final restaurant = restaurantProvider.restaurants[index];
                          return RestaurantCard(
                            restaurant: restaurant,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => RestaurantDetailScreen(
                                    restaurant: restaurant),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
