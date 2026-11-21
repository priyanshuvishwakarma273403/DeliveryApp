import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:foodiq_mobile/app/theme/app_colors.dart';
import 'package:foodiq_mobile/app/theme/app_typography.dart';

class HeroCarousel extends StatefulWidget {
  final VoidCallback onSearchTap;

  const HeroCarousel({super.key, required this.onSearchTap});

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<HeroThemeSlide> _slides = const [
    HeroThemeSlide(
      title: 'Craving Sizzling Biryani?',
      subtitle: 'Dum cooked to perfection with aromatic spices.',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      tag: 'HOT & FRESH',
      tagColor: AppColors.primary,
    ),
    HeroThemeSlide(
      title: 'Cheesy Artisanal Pizza',
      subtitle: 'Wood-fired crust loaded with fresh gourmet toppings.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
      tag: '50% OFF',
      tagColor: AppColors.secondary,
    ),
    HeroThemeSlide(
      title: 'Healthy Green Bowls',
      subtitle: 'Nutrient-packed superfoods for pure vitality.',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
      tag: 'HEALTHY CHOICE',
      tagColor: AppColors.success,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 190,
          child: PageView.builder(
            controller: _pageController,
            itemCount: _slides.length,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemBuilder: (context, index) {
              final slide = _slides[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: Stack(
                    children: [
                      // Image
                      CachedNetworkImage(
                        imageUrl: slide.image,
                        width: double.infinity,
                        height: double.infinity,
                        fit: BoxFit.cover,
                      ),
                      // Gradient Overlay
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.black.withOpacity(0.85),
                              Colors.black.withOpacity(0.3),
                              Colors.transparent,
                            ],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                        ),
                      ),
                      // Text content
                      Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: slide.tagColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                slide.tag,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            SizedBox(
                              width: 220,
                              child: Text(
                                slide.title,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  height: 1.1,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            SizedBox(
                              width: 220,
                              child: Text(
                                slide.subtitle,
                                maxLines: 2,
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _slides.length,
            (i) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentPage == i ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentPage == i ? AppColors.primary : AppColors.borderLight,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class HeroThemeSlide {
  final String title;
  final String subtitle;
  final String image;
  final String tag;
  final Color tagColor;

  const HeroThemeSlide({
    required this.title,
    required this.subtitle,
    required this.image,
    required this.tag,
    required this.tagColor,
  });
}
