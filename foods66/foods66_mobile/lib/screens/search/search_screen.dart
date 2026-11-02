import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../models/food_model.dart';
import '../../providers/food_provider.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/food_card.dart';
import '../../widgets/empty_state.dart';
import '../food/food_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  List<FoodModel> _results = [];
  bool _isSearching = false;
  bool _hasSearched = false;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _results = [];
        _hasSearched = false;
      });
      return;
    }

    setState(() => _isSearching = true);
    final foodProvider = Provider.of<FoodProvider>(context, listen: false);
    final results = await foodProvider.searchFoods(query.trim());
    if (mounted) {
      setState(() {
        _results = results;
        _isSearching = false;
        _hasSearched = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);

    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
          child: TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search for food, category...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 20),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _results = [];
                          _hasSearched = false;
                        });
                      },
                    )
                  : null,
            ),
            textInputAction: TextInputAction.search,
            onSubmitted: _performSearch,
          ),
        ),

        // Results
        Expanded(
          child: _isSearching
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.primary))
              : !_hasSearched
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.search,
                              size: 64, color: AppColors.textHint),
                          const SizedBox(height: 16),
                          Text('Search for your favorite food',
                              style: AppTextStyles.bodyMedium
                                  .copyWith(color: AppColors.textSecondary)),
                        ],
                      ),
                    )
                  : _results.isEmpty
                      ? const EmptyState(
                          icon: Icons.search_off,
                          title: 'No results found',
                          subtitle: 'Try different keywords',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: _results.length,
                          itemBuilder: (context, index) {
                            final food = _results[index];
                            return FoodCard(
                              food: food,
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      FoodDetailScreen(food: food),
                                ),
                              ),
                              onAddToCart: food.available
                                  ? () {
                                      cartProvider.addItem(food);
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                          content: Text(
                                              '${food.name} added to cart'),
                                          duration: const Duration(seconds: 1),
                                        ),
                                      );
                                    }
                                  : null,
                            );
                          },
                        ),
        ),
      ],
    );
  }
}
