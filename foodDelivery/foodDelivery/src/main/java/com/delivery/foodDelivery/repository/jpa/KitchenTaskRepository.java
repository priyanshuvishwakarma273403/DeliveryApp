package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.KitchenTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KitchenTaskRepository extends JpaRepository<KitchenTask, Long> {
    List<KitchenTask> findByOrderId(Long orderId);
    List<KitchenTask> findByStationId(String stationId);
    List<KitchenTask> findByStationIdAndStatus(String stationId, String status);
    Optional<KitchenTask> findByTaskId(String taskId);
}
