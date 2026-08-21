package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.MenuItem;
import com.delivery.foodDelivery.entity.UserTasteProfile;
import com.delivery.foodDelivery.repository.jpa.UserTasteProfileRepository;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlternativeRankingEngine {

    private final MenuItemRepository menuItemRepository;
    private final UserTasteProfileRepository tasteProfileRepository;

    public List<MenuItem> getAlternatives(Long customerId, String currentMenuItemId) {
        log.info("Generating alternative recommendations for customerId={} currentMenuItemId={}", customerId, currentMenuItemId);
        
        Optional<MenuItem> currentItemOpt = menuItemRepository.findById(currentMenuItemId);
        if (currentItemOpt.isEmpty()) {
            return new ArrayList<>();
        }
        MenuItem currentItem = currentItemOpt.get();
        String restaurantId = currentItem.getRestaurantId();

        // 1. Fetch all items for the restaurant
        List<MenuItem> allRestaurantItems = menuItemRepository.findByRestaurantId(restaurantId);

        // 2. Fetch User Taste DNA Profile
        Optional<UserTasteProfile> profileOpt = tasteProfileRepository.findByUserId(String.valueOf(customerId));

        // 3. Filter and Score
        return allRestaurantItems.stream()
                .filter(item -> !item.getId().equals(currentMenuItemId)) // Not the same item
                .filter(MenuItem::isAvailable) // Must be available
                .filter(item -> {
                    // Check dietary safety matches
                    if (profileOpt.isPresent()) {
                        UserTasteProfile profile = profileOpt.get();
                        List<String> dietary = profile.getDietaryPreferences();
                        if (dietary != null && !dietary.isEmpty()) {
                            // If vegetarian preference, item must be vegetarian
                            if (dietary.contains("VEGETARIAN") && !item.isVegetarian()) {
                                return false;
                            }
                        }
                    }
                    return true;
                })
                .sorted(Comparator.comparingDouble((MenuItem item) -> {
                    double score = 0.0;
                    
                    // Match category (higher similarity)
                    if (item.getCategory() != null && item.getCategory().equalsIgnoreCase(currentItem.getCategory())) {
                        score += 50.0;
                    }

                    // Price proximity (closer is better)
                    double priceDiff = Math.abs(item.getPrice() - currentItem.getPrice());
                    double priceScore = Math.max(0, 30.0 - priceDiff);
                    score += priceScore;

                    // Taste DNA preference overlap
                    if (profileOpt.isPresent()) {
                        UserTasteProfile profile = profileOpt.get();
                        if (profile.getPreferredCategories() != null && profile.getPreferredCategories().contains(item.getCategory())) {
                            score += 20.0;
                        }
                    }

                    return -score; // Sort descending
                }))
                .limit(5)
                .collect(Collectors.toList());
    }
}
