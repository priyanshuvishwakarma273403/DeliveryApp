package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.UserTasteDimension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTasteDimensionRepository extends JpaRepository<UserTasteDimension, Long> {
    List<UserTasteDimension> findByUserId(Long userId);
    List<UserTasteDimension> findByUserIdAndDimensionType(Long userId, String dimensionType);
    Optional<UserTasteDimension> findByUserIdAndDimensionTypeAndDimensionKey(Long userId, String dimensionType, String dimensionKey);
}
