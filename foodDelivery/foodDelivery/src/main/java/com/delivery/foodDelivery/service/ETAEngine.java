package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.EtaPrediction;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.entity.RestaurantDigitalTwinState;
import com.delivery.foodDelivery.entity.DeliveryPartner;
import com.delivery.foodDelivery.repository.jpa.EtaPredictionRepository;
import com.delivery.foodDelivery.repository.jpa.RestaurantDigitalTwinStateRepository;
import com.delivery.foodDelivery.repository.jpa.DeliveryPartnerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ETAEngine {

    private final EtaPredictionRepository etaPredictionRepository;
    private final RestaurantDigitalTwinStateRepository twinStateRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final RoutingService routingService;
    private final WeatherService weatherService;
    private final TrafficService trafficService;
    private final ObjectMapper objectMapper;

    @Data
    @Builder
    public static class ETAResult {
        private int estimatedDeliveryTimeMinutes;
        private double confidence;
        private Map<String, Integer> breakdown;
        private String modelVersion;
        private String featureVersion;
    }

    @Transactional
    public ETAResult calculateAndRecordETA(Order order, DeliveryPartner rider, String source) {
        log.info("Calculating dynamic ETA for order={}", order.getId());

        // 1. Preparation Time (from Restaurant Digital Twin or default 15 minutes)
        int prepTimeMinutes = 15;
        Optional<RestaurantDigitalTwinState> twinStateOpt = twinStateRepository.findByRestaurantId(order.getRestaurantId());
        if (twinStateOpt.isPresent() && twinStateOpt.get().getAveragePreparationTime() != null) {
            prepTimeMinutes = (int) Math.round(twinStateOpt.get().getAveragePreparationTime());
        }

        // Restaurant backlog scaling factor
        int activeOrders = twinStateOpt.map(state -> state.getActiveOrders() != null ? state.getActiveOrders() : 0).orElse(0);
        double backlogMultiplier = 1.0 + (activeOrders * 0.05); // +5% prep time per active order queue
        prepTimeMinutes = (int) Math.round(prepTimeMinutes * backlogMultiplier);

        // 2. Rider Arrival duration (if rider is assigned)
        int riderArrivalMinutes = 0;
        double riderLat = 0.0;
        double riderLng = 0.0;
        if (rider != null) {
            riderLat = rider.getCurrentLatitude() != null ? rider.getCurrentLatitude() : 12.9716; // default coords if null
            riderLng = rider.getCurrentLongitude() != null ? rider.getCurrentLongitude() : 77.5946;
            
            // Assume restaurant location is seeded or fetched. 
            // In FoodIQ, restaurants have lat/lng or default to a central coordinate.
            // Let's assume restaurant location is 12.9720, 77.5950 if not specified.
            double restaurantLat = 12.9720;
            double restaurantLng = 77.5950;
            
            riderArrivalMinutes = routingService.calculateDurationMinutes(riderLat, riderLng, restaurantLat, restaurantLng, "driving");
        } else {
            riderArrivalMinutes = 6; // Default search/dispatch estimate
        }

        // 3. Pickup Delay (checking details, parking, handoff)
        int pickupDelayMinutes = 3;

        // 4. Travel Time from restaurant to customer destination
        double restaurantLat = 12.9720;
        double restaurantLng = 77.5950;
        // In FoodIQ, customer delivery addresses can be geocoded or use standard coordinates.
        // Let's calculate a mock destination or use a default travel time (e.g. 10 minutes) + distance base
        double destinationLat = 12.9800;
        double destinationLng = 77.6000;
        
        int travelTimeMinutes = routingService.calculateDurationMinutes(restaurantLat, restaurantLng, destinationLat, destinationLng, "driving");

        // Apply external factor adjustments (weather & traffic multipliers)
        double weatherMult = weatherService.getWeatherDelayMultiplier("Bengaluru");
        double trafficMult = trafficService.getTrafficDelayMultiplier(restaurantLat, restaurantLng);
        
        travelTimeMinutes = (int) Math.round(travelTimeMinutes * weatherMult * trafficMult);

        // Sum everything up
        int totalETAMinutes = prepTimeMinutes + riderArrivalMinutes + pickupDelayMinutes + travelTimeMinutes;

        // Confidence estimation
        double confidence = 0.90;
        if (weatherMult > 1.2) confidence -= 0.10;
        if (trafficMult > 1.3) confidence -= 0.05;
        if (activeOrders > 10) confidence -= 0.08;

        Map<String, Integer> breakdown = new HashMap<>();
        breakdown.put("preparation", prepTimeMinutes);
        breakdown.put("riderArrival", riderArrivalMinutes);
        breakdown.put("pickupDelay", pickupDelayMinutes);
        breakdown.put("travelTime", travelTimeMinutes);

        ETAResult result = ETAResult.builder()
                .estimatedDeliveryTimeMinutes(totalETAMinutes)
                .confidence(confidence)
                .breakdown(breakdown)
                .modelVersion("v2.4-cognitive")
                .featureVersion("f1.8-traffic-aware")
                .build();

        // Log to database
        EtaPrediction prediction = EtaPrediction.builder()
                .orderId(order.getId())
                .predictedEtaMinutes(totalETAMinutes)
                .predictedAt(LocalDateTime.now())
                .confidence(confidence)
                .modelVersion(result.getModelVersion())
                .featureVersion(result.getFeatureVersion())
                .status(order.getStatus().name())
                .build();

        etaPredictionRepository.save(prediction);

        return result;
    }
}
