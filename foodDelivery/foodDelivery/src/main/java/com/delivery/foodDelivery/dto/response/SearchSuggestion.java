package com.delivery.foodDelivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchSuggestion {
    private String text;
    private String type; // e.g. RESTAURANT, DISH, CUISINE, CATEGORY
    private String description;
}
