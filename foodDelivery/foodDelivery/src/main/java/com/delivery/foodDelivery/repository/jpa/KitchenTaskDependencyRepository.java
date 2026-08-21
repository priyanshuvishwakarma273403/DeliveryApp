package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.KitchenTaskDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenTaskDependencyRepository extends JpaRepository<KitchenTaskDependency, Long> {
    List<KitchenTaskDependency> findByTaskId(String taskId);
    List<KitchenTaskDependency> findByDependsOnTaskId(String dependsOnTaskId);
}
