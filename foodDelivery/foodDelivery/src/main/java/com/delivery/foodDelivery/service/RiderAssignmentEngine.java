package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.DeliveryPartner;
import com.delivery.foodDelivery.entity.Order;
import com.delivery.foodDelivery.repository.jpa.DeliveryPartnerRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiderAssignmentEngine {

    private final DeliveryPartnerRepository partnerRepository;
    private final RoutingService routingService;
    private final TrafficService trafficService;

    @Data
    @Builder
    public static class RiderScore {
        private DeliveryPartner partner;
        private double score;
        private double distanceKm;
        private int estimatedArrivalMinutes;
        private String breakdown;
    }

    public List<RiderScore> findAndRankRiders(Order order, int prepTimeMinutes, boolean isSlaCritical) {
        log.info("Finding and ranking candidate riders for order={}, prepTime={}min, slaCritical={}", 
                order.getId(), prepTimeMinutes, isSlaCritical);

        List<DeliveryPartner> availableRiders = partnerRepository.findByAvailableTrue();
        if (availableRiders.isEmpty()) {
            log.warn("No available riders found in database!");
            return new ArrayList<>();
        }

        // Restaurant coordinates (assume fixed or fetch from restaurant address)
        double restaurantLat = 12.9720;
        double restaurantLng = 77.5950;

        List<RiderScore> scoredRiders = availableRiders.stream().map(rider -> {
            double riderLat = rider.getCurrentLatitude() != null ? rider.getCurrentLatitude() : 12.9716;
            double riderLng = rider.getCurrentLongitude() != null ? rider.getCurrentLongitude() : 77.5946;

            // 1. Distance & duration calculation
            double distanceKm = routingService.calculateDistanceKm(riderLat, riderLng, restaurantLat, restaurantLng);
            int arrivalMinutes = routingService.calculateDurationMinutes(riderLat, riderLng, restaurantLat, restaurantLng, "driving");

            // Heuristic Scoring Component Weights (total max score ~ 100)
            // A. Distance Score (max 50 points)
            double distanceScore = Math.max(0, 50.0 - (distanceKm * 12.0));

            // B. Food Ready Alignment (max 20 points)
            // Ideally, rider arrival matches food preparation completion
            double alignmentScore = Math.max(0, 20.0 - Math.abs(arrivalMinutes - prepTimeMinutes) * 2.5);

            // C. SLA Contribution (max 15 points)
            // Motorbikes get a boost over slower vehicles (like bicycle) if SLA is critical
            double slaContribution = 0.0;
            if (isSlaCritical) {
                if ("Motorcycle".equalsIgnoreCase(rider.getVehicleType()) || "Bike".equalsIgnoreCase(rider.getVehicleType())) {
                    slaContribution = 15.0;
                } else {
                    slaContribution = 5.0;
                }
            }

            // D. Current Workload / Experience factor (max 10 points)
            // Favour riders with fewer deliveries today to balance workload, or experienced riders
            int deliveries = rider.getTotalDeliveries() != null ? rider.getTotalDeliveries() : 0;
            double workloadScore = Math.max(0, 10.0 - (deliveries * 0.5));

            // E. Traffic score (max 5 points)
            double trafficMult = trafficService.getTrafficDelayMultiplier(riderLat, riderLng);
            double trafficScore = Math.max(0, 5.0 - (trafficMult - 1.0) * 10.0);

            double totalScore = distanceScore + alignmentScore + slaContribution + workloadScore + trafficScore;

            String breakdown = String.format("dist=%.1f, align=%.1f, sla=%.1f, work=%.1f, traffic=%.1f", 
                    distanceScore, alignmentScore, slaContribution, workloadScore, trafficScore);

            return RiderScore.builder()
                    .partner(rider)
                    .score(totalScore)
                    .distanceKm(distanceKm)
                    .estimatedArrivalMinutes(arrivalMinutes)
                    .breakdown(breakdown)
                    .build();
        })
        .sorted(Comparator.comparingDouble(RiderScore::getScore).reversed())
        .collect(Collectors.toList());

        log.info("Found {} candidate riders. Top candidate: riderId={}, score={}", 
                scoredRiders.size(), 
                scoredRiders.isEmpty() ? "none" : scoredRiders.get(0).getPartner().getId(),
                scoredRiders.isEmpty() ? 0.0 : scoredRiders.get(0).getScore());

        return scoredRiders;
    }
}
