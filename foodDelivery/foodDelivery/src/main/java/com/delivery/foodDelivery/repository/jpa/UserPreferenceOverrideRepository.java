package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.UserPreferenceOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserPreferenceOverrideRepository extends JpaRepository<UserPreferenceOverride, Long> {
    List<UserPreferenceOverride> findByUserId(Long userId);
    List<UserPreferenceOverride> findByUserIdAndPreferenceKey(Long userId, String preferenceKey);
    void deleteByUserIdAndPreferenceKeyAndPreferenceValue(Long userId, String preferenceKey, String preferenceValue);
    void deleteByUserId(Long userId);
}
