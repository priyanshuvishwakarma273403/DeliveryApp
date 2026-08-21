package com.delivery.foodDelivery.repository.jpa;

import com.delivery.foodDelivery.entity.EtaPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EtaPredictionRepository extends JpaRepository<EtaPrediction, Long> {
    List<EtaPrediction> findByOrderId(Long orderId);
    List<EtaPrediction> findByOrderIdOrderByCreatedDateDesc(Long orderId);
}
