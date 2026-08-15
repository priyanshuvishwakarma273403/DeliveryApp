package com.delivery.foodDelivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FestivalGreetingDTO implements Serializable {
    private String greetingId;
    private String title;
    private String message;
    private String festivalName;
}
