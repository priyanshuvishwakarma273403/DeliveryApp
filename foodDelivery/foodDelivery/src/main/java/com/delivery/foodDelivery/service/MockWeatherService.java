package com.delivery.foodDelivery.service;

import org.springframework.stereotype.Service;

@Service
public class MockWeatherService implements WeatherService {

    @Override
    public String getCurrentWeather(String city) {
        return "CLEAR";
    }

    @Override
    public double getWeatherDelayMultiplier(String city) {
        return 1.0; // No delay
    }
}
