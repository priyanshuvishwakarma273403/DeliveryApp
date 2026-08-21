package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_recovery_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerRecoveryPreference extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false, unique = true)
    private Long customerId;

    @Column(name = "auto_update_eta")
    private boolean autoUpdateEta;

    @Column(name = "auto_substitute_same_price")
    private boolean autoSubstituteSamePrice;

    @Column(name = "auto_remove_item")
    private boolean autoRemoveItem;

    @Column(name = "ask_every_time")
    private boolean askEveryTime;
}
