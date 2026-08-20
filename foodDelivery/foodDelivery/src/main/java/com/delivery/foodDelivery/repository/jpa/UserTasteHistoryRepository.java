package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.UserTasteHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTasteHistoryRepository extends JpaRepository<UserTasteHistory, Long> {
    List<UserTasteHistory> findByUserId(Long userId);
    List<UserTasteHistory> findByUserIdOrderByVersionDesc(Long userId);
}
