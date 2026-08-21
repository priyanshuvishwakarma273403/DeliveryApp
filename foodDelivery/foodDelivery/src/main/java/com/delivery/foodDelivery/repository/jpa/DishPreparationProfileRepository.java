package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.DishPreparationProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DishPreparationProfileRepository extends JpaRepository<DishPreparationProfile, Long> {
    Optional<DishPreparationProfile> findByDishId(String dishId);
}
