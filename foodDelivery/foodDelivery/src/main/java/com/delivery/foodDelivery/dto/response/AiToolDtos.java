package com.delivery.foodDelivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AiToolDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RestaurantToolDto {
        private String id;
        private String name;
        private String cuisine;
        private Double rating;
        private Integer avgDeliveryTime;
        private String city;
        private Double minOrderAmount;
        private boolean open;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DishToolDto {
        private String id;
        private String name;
        private String description;
        private Double price;
        private String category;
        private boolean available;
        private boolean vegetarian;
        private String restaurantId;
        private String restaurantName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserTasteProfileToolDto {
        private List<String> preferredCuisines;
        private List<String> preferredCategories;
        private List<String> dietaryPreferences;
        private String budgetTier;
        private Map<String, Integer> frequentRestaurants;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemToolDto {
        private String menuItemName;
        private Integer quantity;
        private Double price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderToolDto {
        private Long id;
        private String status;
        private Double totalAmount;
        private Double finalAmount;
        private LocalDateTime createdDate;
        private List<OrderItemToolDto> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfferToolDto {
        private String id;
        private String title;
        private String description;
        private Double discountPercentage;
        private Double minOrderValue;
    }
}
