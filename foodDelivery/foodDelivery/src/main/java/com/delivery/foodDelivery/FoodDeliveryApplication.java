package com.delivery.foodDelivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.delivery.foodDelivery.repository.jpa")
@EnableMongoRepositories(basePackages = "com.delivery.foodDelivery.repository.mongo")
@EnableRedisRepositories(basePackages = "com.delivery.foodDelivery.repository.redis")
public class FoodDeliveryApplication {

	public static void main(String[] args) {
		// 1. Database Configuration
		String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
		if (dbUrl == null) {
			dbUrl = System.getenv("MYSQL_URL");
		}
		if (dbUrl != null) {
			String cleanUrl = dbUrl.trim()
					.replace("\\n", "")
					.replace("\\r", "")
					.replace("\n", "")
					.replace("\r", "");
			if (cleanUrl.startsWith("\"") && cleanUrl.endsWith("\"")) {
				cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1).trim();
			}
			if (cleanUrl.startsWith("\"") && cleanUrl.endsWith("\"")) {
				cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1).trim();
			}
			if (cleanUrl.startsWith("mysql://")) {
				cleanUrl = "jdbc:" + cleanUrl;
			}
			if (cleanUrl.contains("ssl-mode=")) {
				cleanUrl = cleanUrl.replace("ssl-mode=", "sslMode=");
			}
			System.setProperty("spring.datasource.url", cleanUrl);
			System.out.println("DEBUG: Cleaned SPRING_DATASOURCE_URL -> [" + cleanUrl + "]");
		}
		cleanAndSetProperty("SPRING_DATASOURCE_USERNAME", "spring.datasource.username");
		cleanAndSetProperty("SPRING_DATASOURCE_PASSWORD", "spring.datasource.password");

		// 2. MongoDB Configuration
		cleanAndSetProperty("MONGODB_URI", "spring.data.mongodb.uri");

		// 3. Valkey Configuration
		cleanAndSetProperty("VALKEY_URL", "spring.data.redis.url");

		// 4. OpenSearch Configuration
		String opensearchUrl = System.getenv("OPENSEARCH_URL");
		if (opensearchUrl != null && !opensearchUrl.trim().isEmpty()) {
			String cleanUrl = opensearchUrl.trim()
					.replace("\\n", "")
					.replace("\\r", "")
					.replace("\n", "")
					.replace("\r", "");
			if (cleanUrl.startsWith("\"") && cleanUrl.endsWith("\"")) {
				cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1).trim();
			}
			System.setProperty("spring.elasticsearch.uris", cleanUrl);
			System.setProperty("elasticsearch.enabled", "true");
			System.out.println("DEBUG: Cleaned OPENSEARCH_URL -> [" + cleanUrl + "] (OpenSearch Enabled)");
		}

		// 5. Kafka Configuration
		cleanAndSetProperty("KAFKA_BOOTSTRAP_SERVERS", "spring.kafka.bootstrap-servers");
		String kafkaUser = System.getenv("KAFKA_USER");
		String kafkaPassword = System.getenv("KAFKA_PASSWORD");
		if (kafkaUser != null && kafkaPassword != null) {
			String cleanUser = kafkaUser.trim().replace("\"", "");
			String cleanPassword = kafkaPassword.trim().replace("\"", "");
			String jaasConfig = String.format(
					"org.apache.kafka.common.security.scram.ScramLoginModule required username=\"%s\" password=\"%s\";",
					cleanUser, cleanPassword
			);
			System.setProperty("spring.kafka.properties.sasl.jaas.config", jaasConfig);
			System.setProperty("spring.kafka.properties.sasl.mechanism", "SCRAM-SHA-256");
			System.setProperty("spring.kafka.security.protocol", "SASL_SSL");
			System.out.println("DEBUG: Configured Kafka SASL_SSL with SCRAM-SHA-256 for user " + cleanUser);
		}
		
		// If KAFKA_ENABLED is explicitly false, disable Kafka auto-startup
		String kafkaEnabled = System.getenv("KAFKA_ENABLED");
		if ("false".equalsIgnoreCase(kafkaEnabled)) {
			System.setProperty("spring.kafka.listener.auto-startup", "false");
			System.setProperty("spring.kafka.admin.auto-create", "false");
		}
		
		SpringApplication.run(FoodDeliveryApplication.class, args);
	}

	private static void cleanAndSetProperty(String envVar, String systemProp) {
		String value = System.getenv(envVar);
		if (value != null) {
			// Remove literal "\n", "\r", and quotes
			String cleanValue = value.trim()
                .replace("\\n", "")
                .replace("\\r", "")
                .replace("\n", "")
                .replace("\r", "");
			
			if (cleanValue.startsWith("\"") && cleanValue.endsWith("\"")) {
				cleanValue = cleanValue.substring(1, cleanValue.length() - 1).trim();
			}
            // Double check for quotes if nested
            if (cleanValue.startsWith("\"") && cleanValue.endsWith("\"")) {
				cleanValue = cleanValue.substring(1, cleanValue.length() - 1).trim();
			}

			System.setProperty(systemProp, cleanValue);
			System.out.println("DEBUG: Cleaned " + envVar + " -> [" + cleanValue + "]");
		}
	}
}
