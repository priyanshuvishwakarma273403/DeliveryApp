package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.OrderOperationalTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderOperationalTimelineRepository extends JpaRepository<OrderOperationalTimeline, Long> {
    List<OrderOperationalTimeline> findByOrderIdOrderByTimestampAsc(Long orderId);
    List<OrderOperationalTimeline> findByOrderIdAndCustomerVisibleOrderByTimestampAsc(Long orderId, boolean customerVisible);
}
