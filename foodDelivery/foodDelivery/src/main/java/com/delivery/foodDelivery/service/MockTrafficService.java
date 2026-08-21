package com.delivery.foodDelivery.service;

import org.springframework.stereotype.Service;

@Service
public class MockTrafficService implements TrafficService {

    @Override
    public double getTrafficDelayMultiplier(double lat, double lng) {
        return 1.1; // 10% traffic overhead on average
    }
}
