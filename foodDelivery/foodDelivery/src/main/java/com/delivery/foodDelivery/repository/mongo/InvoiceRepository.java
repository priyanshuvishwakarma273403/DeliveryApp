package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByOrderId(String orderId);
    List<Invoice> findByCustomerId(String customerId);
    List<Invoice> findByRestaurantId(String restaurantId);
}
