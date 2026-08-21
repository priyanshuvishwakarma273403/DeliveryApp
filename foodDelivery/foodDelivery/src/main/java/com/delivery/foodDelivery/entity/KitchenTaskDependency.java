package com.delivery.foodDelivery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kitchen_task_dependencies", indexes = {
    @Index(name = "idx_dependency_task_id", columnList = "task_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenTaskDependency extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private String taskId;

    @Column(name = "depends_on_task_id", nullable = false)
    private String dependsOnTaskId;
}
