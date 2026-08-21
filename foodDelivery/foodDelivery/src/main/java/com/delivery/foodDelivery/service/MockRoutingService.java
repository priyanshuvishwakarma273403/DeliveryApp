package com.delivery.foodDelivery.service;

import org.springframework.stereotype.Service;

@Service
public class MockRoutingService implements RoutingService {

    @Override
    public double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        // Haversine formula for straight line distance
        double earthRadius = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    @Override
    public int calculateDurationMinutes(double lat1, double lng1, double lat2, double lng2, String mode) {
        double dist = calculateDistanceKm(lat1, lng1, lat2, lng2);
        // Assume average speed is 30 km/h (0.5 km per minute)
        double speedKmPerMin = 0.5;
        if ("walking".equalsIgnoreCase(mode)) {
            speedKmPerMin = 0.08; // 5 km/h
        }
        return (int) Math.ceil(dist / speedKmPerMin);
    }
}
