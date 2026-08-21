package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.FestivalGreetingDTO;
import com.delivery.foodDelivery.dto.SaleEventDTO;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.observability.metrics.KafkaMetrics;
import com.delivery.foodDelivery.repository.jpa.OrderRepository;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

public class KafkaConsumerServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private KafkaMetrics kafkaMetrics;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private TasteSignalProcessor tasteSignalProcessor;

    @Mock
    private DigitalTwinService digitalTwinService;

    @Mock
    private ObjectProvider<OrderOrchestrator> orderOrchestratorProvider;

    @InjectMocks
    private KafkaConsumerService kafkaConsumerService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testConsumeSaleEventSuccess() throws Exception {
        String rawMessage = "{\"saleId\":\"sale-1\",\"title\":\"Summer Flash Sale\",\"discountPercentage\":15.0,\"promoCode\":\"SUMMER15\",\"message\":\"Sale starts now!\"}";
        SaleEventDTO saleEvent = SaleEventDTO.builder()
                .saleId("sale-1")
                .title("Summer Flash Sale")
                .discountPercentage(15.0)
                .promoCode("SUMMER15")
                .message("Sale starts now!")
                .build();

        Mockito.when(objectMapper.readValue(eq(rawMessage), eq(SaleEventDTO.class))).thenReturn(saleEvent);

        User mockUser = User.builder().id(1L).email("user@foodiq.com").name("John Doe").role(Role.CUSTOMER).build();
        Page<User> userPage = new PageImpl<>(List.of(mockUser));
        Mockito.when(userRepository.findByActiveTrue(any(Pageable.class))).thenReturn(userPage);

        kafkaConsumerService.consumeSaleEvent(rawMessage);

        Mockito.verify(emailService, Mockito.times(1))
                .sendSaleNotificationEmail(eq("user@foodiq.com"), eq("John Doe"), eq(saleEvent));
    }

    @Test
    public void testConsumeFestivalGreetingSuccess() throws Exception {
        String rawMessage = "{\"festivalName\":\"Diwali\",\"title\":\"Happy Diwali\",\"message\":\"Greetings\"}";
        FestivalGreetingDTO greeting = FestivalGreetingDTO.builder()
                .festivalName("Diwali")
                .title("Happy Diwali")
                .message("Greetings")
                .build();

        Mockito.when(objectMapper.readValue(eq(rawMessage), eq(FestivalGreetingDTO.class))).thenReturn(greeting);

        User mockUser = User.builder().id(2L).email("customer@foodiq.com").name("Jane Doe").role(Role.CUSTOMER).build();
        Page<User> userPage = new PageImpl<>(List.of(mockUser));
        Mockito.when(userRepository.findByActiveTrue(any(Pageable.class))).thenReturn(userPage);

        kafkaConsumerService.consumeFestivalGreeting(rawMessage);

        Mockito.verify(emailService, Mockito.times(1))
                .sendFestivalGreetingEmail(eq("customer@foodiq.com"), eq("Jane Doe"), eq("Happy Diwali"), eq("Greetings"), eq("Diwali"));
    }
}
