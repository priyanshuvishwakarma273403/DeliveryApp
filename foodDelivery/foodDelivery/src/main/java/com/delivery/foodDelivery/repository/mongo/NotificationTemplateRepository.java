package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.NotificationTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends MongoRepository<NotificationTemplate, String> {
    Optional<NotificationTemplate> findByEventAndLanguage(String event, String language);
    Optional<NotificationTemplate> findByEvent(String event);
    List<NotificationTemplate> findByActiveTrue();
}
