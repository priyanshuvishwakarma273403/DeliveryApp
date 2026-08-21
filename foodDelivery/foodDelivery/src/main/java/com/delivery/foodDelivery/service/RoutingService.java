package com.delivery.foodDelivery.service;

public interface RoutingService {
    double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2);
    int calculateDurationMinutes(double lat1, double lng1, double lat2, double lng2, String mode);
}
