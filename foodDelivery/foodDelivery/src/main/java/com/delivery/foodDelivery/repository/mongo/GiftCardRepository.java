package com.delivery.foodDelivery.repository.mongo;

import com.delivery.foodDelivery.entity.GiftCard;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GiftCardRepository extends MongoRepository<GiftCard, String> {
    Optional<GiftCard> findByCode(String code);
    List<GiftCard> findByPurchaserId(String purchaserId);
    List<GiftCard> findByReceiverId(String receiverId);
}
