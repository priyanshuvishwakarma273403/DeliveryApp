package com.delivery.foodDelivery.config;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.Header;
import org.apache.http.HttpRequest;
import org.apache.http.HttpRequestInterceptor;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.HttpResponseInterceptor;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.lang.NonNull;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URI;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

/**
 * Elasticsearch configuration that only activates when the configured OpenSearch cluster is reachable.
 * Supports basic authentication and SSL/HTTPS natively for Aiven OpenSearch.
 * Uses trust-all SSL to prevent certificate path issues.
 */
@Configuration
@Conditional(ElasticsearchConnectionCondition.class)
@EnableElasticsearchRepositories(
    basePackages = "com.delivery.foodDelivery.repository.elasticsearch"
)
public class ElasticsearchConfig extends ElasticsearchConfiguration {

    @Autowired
    private Environment env;

    private SSLContext getTrustAllSslContext() {
        try {
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            }, new SecureRandom());
            return sslContext;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create trust-all SSL context", e);
        }
    }

    @Override
    @NonNull
    public ClientConfiguration clientConfiguration() {
        String uriStr = env.getProperty("spring.elasticsearch.uris", "http://localhost:9200");

        System.out.println("DEBUG: ElasticsearchConfig - Resolving connection to: " + uriStr);

        if (uriStr.contains(",")) {
            uriStr = uriStr.split(",")[0];
        }
        uriStr = uriStr.trim();
        if (!uriStr.startsWith("http")) {
            uriStr = "http://" + uriStr;
        }

        URI uri = URI.create(uriStr);
        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 9200 : uri.getPort();

        ClientConfiguration.MaybeSecureClientConfigurationBuilder builder = ClientConfiguration.builder()
                .connectedTo(host + ":" + port);

        ClientConfiguration.TerminalClientConfigurationBuilder terminalBuilder;
        if ("https".equalsIgnoreCase(uri.getScheme())) {
            terminalBuilder = builder.usingSsl(getTrustAllSslContext(), (hostname, session) -> true);
        } else {
            terminalBuilder = builder;
        }

        String userInfo = uri.getUserInfo();
        if (userInfo != null && userInfo.contains(":")) {
            String[] credentials = userInfo.split(":", 2);
            terminalBuilder = terminalBuilder.withBasicAuth(credentials[0], credentials[1]);
        } else {
            String username = env.getProperty("spring.elasticsearch.username");
            String password = env.getProperty("spring.elasticsearch.password");
            if (username != null && !username.isEmpty()) {
                terminalBuilder = terminalBuilder.withBasicAuth(username, password);
            }
        }

        return terminalBuilder.build();
    }

    @Override
    @NonNull
    @Bean(name = "elasticsearchRestClient")
    public RestClient elasticsearchRestClient(@NonNull ClientConfiguration clientConfiguration) {
        String uriStr = env.getProperty("spring.elasticsearch.uris", "http://localhost:9200");

        if (uriStr.contains(",")) {
            uriStr = uriStr.split(",")[0];
        }
        uriStr = uriStr.trim();
        if (!uriStr.startsWith("http")) {
            uriStr = "http://" + uriStr;
        }

        URI uri = URI.create(uriStr);
        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 9200 : uri.getPort();

        RestClientBuilder builder = RestClient.builder(new HttpHost(host, port, uri.getScheme()));

        String userInfo = uri.getUserInfo();
        String username = null;
        String password = null;

        if (userInfo != null && userInfo.contains(":")) {
            String[] credentials = userInfo.split(":", 2);
            username = credentials[0];
            password = credentials[1];
        } else {
            username = env.getProperty("spring.elasticsearch.username");
            password = env.getProperty("spring.elasticsearch.password");
        }

        final String finalUsername = username;
        final String finalPassword = password;

        builder.setHttpClientConfigCallback(httpClientBuilder -> {
            if ("https".equalsIgnoreCase(uri.getScheme())) {
                httpClientBuilder.setSSLContext(getTrustAllSslContext());
                httpClientBuilder.setSSLHostnameVerifier((hostname, session) -> true);
            }
            if (finalUsername != null && !finalUsername.isEmpty()) {
                final CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
                credentialsProvider.setCredentials(AuthScope.ANY,
                        new UsernamePasswordCredentials(finalUsername, finalPassword));
                httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider);
            }
            // Add custom request interceptor to rewrite Content-Type and Accept headers for OpenSearch compatibility
            httpClientBuilder.addInterceptorLast((HttpRequestInterceptor) (request, context) -> {
                if (request.containsHeader("Content-Type")) {
                    Header[] headers = request.getHeaders("Content-Type");
                    for (Header header : headers) {
                        if (header.getValue().contains("application/vnd.elasticsearch+json")) {
                            request.setHeader("Content-Type", "application/json");
                        }
                    }
                }
                if (request.containsHeader("Accept")) {
                    Header[] headers = request.getHeaders("Accept");
                    for (Header header : headers) {
                        if (header.getValue().contains("application/vnd.elasticsearch+json")) {
                            request.setHeader("Accept", "application/json");
                        }
                    }
                }
            });
            // Add custom response interceptor to inject X-Elastic-Product header for OpenSearch compatibility
            httpClientBuilder.addInterceptorLast((HttpResponseInterceptor) (response, context) -> {
                response.addHeader("X-Elastic-Product", "Elasticsearch");
            });
            return httpClientBuilder;
        });

        return builder.build();
    }
}
