package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.exception.BusinessException;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.service.DigitalTwinService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/restaurants")
@RequiredArgsConstructor
@Slf4j
public class RestaurantDigitalTwinController {

    private final UserRepository userRepository;
    private final RestaurantDigitalTwinStateRepository twinStateRepository;
    private final RestaurantForecastRepository forecastRepository;
    private final RestaurantKitchenMetricRepository kitchenMetricRepository;
    private final RestaurantInventoryMetricRepository inventoryMetricRepository;
    private final RestaurantRiskEventRepository riskEventRepository;
    private final DigitalTwinService digitalTwinService;

    @Data
    public static class SimulationRequest {
        private Double orderIncrease; // e.g. 0.30
        private Integer staffChange;   // e.g. -1 or 1
        private Double discountApplied; // e.g. 0.20
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessException("Unauthorized");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new BusinessException("User not found"));
    }

    private void validateRestaurantAccess(User user, String restaurantId) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getRole() == Role.PARTNER || user.getRole() == Role.USER) {
            // Authorized partners / managers
            return;
        }
        throw new BusinessException("Unauthorized access to this restaurant's operational data.");
    }

    @GetMapping("/{restaurantId}/digital-twin")
    public ResponseEntity<RestaurantDigitalTwinState> getDigitalTwin(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        // Ensure the digital twin state exists and is calculated
        digitalTwinService.updateAndBroadcastTwinState(restaurantId);

        RestaurantDigitalTwinState state = twinStateRepository.findByRestaurantId(restaurantId)
                .orElseThrow(() -> new BusinessException("Digital twin state not found."));
        return ResponseEntity.ok(state);
    }

    @GetMapping("/{restaurantId}/forecast")
    public ResponseEntity<List<RestaurantForecast>> getForecast(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        List<RestaurantForecast> forecasts = forecastRepository.findByRestaurantId(restaurantId);
        return ResponseEntity.ok(forecasts);
    }

    @GetMapping("/{restaurantId}/demand")
    public ResponseEntity<Map<String, Long>> getDemand(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        Map<String, Long> demand = digitalTwinService.calculateSlidingDemand(restaurantId);
        return ResponseEntity.ok(demand);
    }

    @GetMapping("/{restaurantId}/health")
    public ResponseEntity<Map<String, Object>> getHealth(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        RestaurantDigitalTwinState state = twinStateRepository.findByRestaurantId(restaurantId)
                .orElseThrow(() -> new BusinessException("Digital twin state not found."));

        Map<String, Object> healthInfo = new HashMap<>();
        healthInfo.put("restaurantId", restaurantId);
        healthInfo.put("healthScore", state.getHealthScore());
        healthInfo.put("kitchenUtilization", state.getKitchenUtilization());
        healthInfo.put("staffUtilization", state.getStaffUtilization());
        healthInfo.put("inventoryRisk", state.getInventoryRisk());
        healthInfo.put("slaRisk", state.getSlaRisk());

        return ResponseEntity.ok(healthInfo);
    }

    @GetMapping("/{restaurantId}/risks")
    public ResponseEntity<List<RestaurantRiskEvent>> getRisks(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        List<RestaurantRiskEvent> risks = riskEventRepository.findByRestaurantIdAndStatus(restaurantId, "ACTIVE");
        return ResponseEntity.ok(risks);
    }

    @GetMapping("/{restaurantId}/inventory-risk")
    public ResponseEntity<List<RestaurantInventoryMetric>> getInventoryRisk(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        List<RestaurantInventoryMetric> inventory = inventoryMetricRepository.findByRestaurantId(restaurantId);
        return ResponseEntity.ok(inventory);
    }

    @GetMapping("/{restaurantId}/kitchen")
    public ResponseEntity<List<RestaurantKitchenMetric>> getKitchenState(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        List<RestaurantKitchenMetric> kitchen = kitchenMetricRepository.findByRestaurantId(restaurantId);
        return ResponseEntity.ok(kitchen);
    }

    @PostMapping("/{restaurantId}/simulate")
    public ResponseEntity<RestaurantSimulation> simulateScenario(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String restaurantId,
            @RequestBody SimulationRequest request) {
        User user = resolveUser(userDetails);
        validateRestaurantAccess(user, restaurantId);

        RestaurantSimulation sim = digitalTwinService.runSimulation(
                restaurantId, 
                request.getOrderIncrease() != null ? request.getOrderIncrease() : 0.0, 
                request.getStaffChange() != null ? request.getStaffChange() : 0, 
                request.getDiscountApplied() != null ? request.getDiscountApplied() : 0.0
        );
        return ResponseEntity.ok(sim);
    }
}
