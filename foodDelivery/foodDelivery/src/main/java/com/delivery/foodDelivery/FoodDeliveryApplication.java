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

import java.io.File;
import java.io.FileOutputStream;
import java.security.KeyStore;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import javax.net.ssl.*;

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
		
		// Setup Kafka truststore dynamically to resolve SSL errors
		setupKafkaTruststore();
		
		SpringApplication.run(FoodDeliveryApplication.class, args);
	}

	private static void setupKafkaTruststore() {
		String bootstrap = System.getenv("KAFKA_BOOTSTRAP_SERVERS");
		if (bootstrap == null || !bootstrap.contains(":")) {
			return;
		}
		try {
			// Extract host and port
			String cleanBootstrap = bootstrap.trim()
					.replace("\\n", "")
					.replace("\\r", "")
					.replace("\n", "")
					.replace("\r", "");
			if (cleanBootstrap.startsWith("\"") && cleanBootstrap.endsWith("\"")) {
				cleanBootstrap = cleanBootstrap.substring(1, cleanBootstrap.length() - 1).trim();
			}
			String[] parts = cleanBootstrap.split(",");
			String firstServer = parts[0].trim();
			String[] hostPort = firstServer.split(":");
			String host = hostPort[0].trim().replace("\"", "");
			int port = Integer.parseInt(hostPort[1].trim().replace("\"", ""));

			System.out.println("DEBUG: Dynamically creating truststore for Kafka at " + host + ":" + port);

			TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
			tmf.init((KeyStore) null);
			X509TrustManager defaultTm = null;
			for (TrustManager tm : tmf.getTrustManagers()) {
				if (tm instanceof X509TrustManager) {
					defaultTm = (X509TrustManager) tm;
					break;
				}
			}

			final X509TrustManager finalDefaultTm = defaultTm;
			class SavingTrustManager implements X509TrustManager {
				private X509Certificate[] chain;
				public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
				public void checkClientTrusted(X509Certificate[] chain, String authType) {}
				public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
					this.chain = chain;
					if (finalDefaultTm != null) {
						try {
							finalDefaultTm.checkServerTrusted(chain, authType);
						} catch (CertificateException e) {
							// Capture cert even if untrusted by default trust manager
						}
					}
				}
			}

			SavingTrustManager tm = new SavingTrustManager();
			SSLContext context = SSLContext.getInstance("TLS");
			context.init(null, new TrustManager[]{tm}, null);
			SSLSocketFactory factory = context.getSocketFactory();

			try (SSLSocket socket = (SSLSocket) factory.createSocket(host, port)) {
				socket.setSoTimeout(10000);
				socket.startHandshake();
			} catch (Exception e) {
				// Handshake fails when untrusted, but we still capture the chain
			}

			if (tm.chain == null || tm.chain.length == 0) {
				System.err.println("DEBUG: Could not retrieve certificate chain from " + host);
				return;
			}

			KeyStore ks = KeyStore.getInstance("JKS");
			ks.load(null, null);
			for (int i = 0; i < tm.chain.length; i++) {
				ks.setCertificateEntry("kafka-cert-" + i, tm.chain[i]);
			}

			File trustStoreFile = File.createTempFile("kafka-truststore", ".jks");
			trustStoreFile.deleteOnExit();
			String password = "changeit";
			try (FileOutputStream fos = new FileOutputStream(trustStoreFile)) {
				ks.store(fos, password.toCharArray());
			}

			System.setProperty("spring.kafka.properties.ssl.truststore.location", trustStoreFile.getAbsolutePath());
			System.setProperty("spring.kafka.properties.ssl.truststore.password", password);
			System.out.println("DEBUG: Dynamically configured Kafka TrustStore at " + trustStoreFile.getAbsolutePath());

		} catch (Exception e) {
			System.err.println("DEBUG: Failed to dynamically create Kafka truststore: " + e.getMessage());
			e.printStackTrace();
		}
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
