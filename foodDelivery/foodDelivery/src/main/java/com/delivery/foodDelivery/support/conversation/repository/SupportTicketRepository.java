package com.delivery.foodDelivery.support.conversation.repository;

import com.delivery.foodDelivery.support.conversation.model.SupportTicket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends MongoRepository<SupportTicket, String> {
    List<SupportTicket> findByCustomerId(String customerId);
    List<SupportTicket> findByStatus(String status);
}
