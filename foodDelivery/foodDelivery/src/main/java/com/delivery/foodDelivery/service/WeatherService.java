package com.delivery.foodDelivery.service;

public interface WeatherService {
    String getCurrentWeather(String city);
    double getWeatherDelayMultiplier(String city);
}
