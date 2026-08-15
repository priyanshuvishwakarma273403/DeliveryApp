package com.delivery.foodDelivery.elasticsearch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "chat_memory")
public class ChatMemoryDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword, name = "userId")
    private String userId;

    @Field(type = FieldType.Keyword, name = "role")
    private String role; // "user" or "bot"

    @Field(type = FieldType.Text, name = "content", analyzer = "standard")
    private String content;

    @Field(type = FieldType.Long, name = "timestamp")
    private Long timestamp;
}
