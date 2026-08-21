package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.KitchenStation;
import com.delivery.foodDelivery.repository.jpa.KitchenStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenLoadEngine {

    private final KitchenStationRepository stationRepository;

    /**
     * Calculates the overall restaurant load based on station capacities and active tasks.
     */
    public double calculateOverallLoad(String restaurantId) {
        List<KitchenStation> stations = stationRepository.findByRestaurantId(restaurantId);
        if (stations.isEmpty()) {
            return 0.0;
        }

        double totalCapacity = 0;
        double totalLoad = 0;

        for (KitchenStation station : stations) {
            totalCapacity += station.getCapacity();
            // Load is active tasks. If status is offline, capacity is effectively 0 but we count it as overloaded.
            if ("OFFLINE".equalsIgnoreCase(station.getStatus())) {
                totalLoad += station.getCapacity(); // Count offline as 100% busy/unusable
            } else {
                double activeCount = station.getCurrentLoad() != null ? station.getCurrentLoad() * station.getCapacity() : 0.0;
                totalLoad += activeCount;
            }
        }

        return totalCapacity == 0 ? 0.0 : Math.min(1.0, totalLoad / totalCapacity);
    }

    /**
     * Recalculates utilization for a specific station.
     */
    public void updateStationMetrics(KitchenStation station, int activeTasksCount, int queueLength) {
        station.setQueueLength(queueLength);
        double utilization = (double) activeTasksCount / station.getCapacity();
        station.setCurrentLoad(Math.min(1.0, utilization));
        
        // Calculate average prep time dynamically or retain existing
        if (station.getAveragePrepTime() == null) {
            station.setAveragePrepTime(10.0);
        }
        
        stationRepository.save(station);
    }
}
