package com.delivery.foodDelivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultItem {
    private String id;
    private String type; // RESTAURANT, BRANCH, FOOD_ITEM, CATEGORY, COMBO, INGREDIENT, CUISINE, CUSTOMER, ORDER, DELIVERY_PARTNER, COUPON, OFFER, REVIEW, SUPPORT_TICKET, INVOICE, TRANSACTION, SUPPLIER, INVENTORY_ITEM, EMPLOYEE
    private String title;
    private String subtitle;
    private String imageUrl;
    private Double rating;
    private double score; // Search ranking score
    private Map<String, Object> metadata; // Dynamic properties for sorting/filtering
}
