package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.NotificationMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationMessageRepository extends MongoRepository<NotificationMessage, String> {
    List<NotificationMessage> findByUserIdAndIsDeletedFalseOrderByTimestampDesc(String userId);
    
    Page<NotificationMessage> findByUserIdAndIsDeletedFalseAndIsArchived(
            String userId, boolean isArchived, Pageable pageable);

    Page<NotificationMessage> findByUserIdAndIsDeletedFalseAndIsRead(
            String userId, boolean isRead, Pageable pageable);
            
    Page<NotificationMessage> findByUserIdAndIsDeletedFalseAndIsPinned(
            String userId, boolean isPinned, Pageable pageable);

    List<NotificationMessage> findByStatusAndScheduledTimeBefore(String status, LocalDateTime time);
    
    List<NotificationMessage> findByStatus(String status);
    
    long countByUserIdAndIsReadFalseAndIsDeletedFalse(String userId);

    List<NotificationMessage> findByStatusAndTimestampAfter(String status, LocalDateTime timestamp);
}
