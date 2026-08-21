package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.config.TasteDnaConfig;
import com.delivery.foodDelivery.dto.UserBehaviorEventDto;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.mongo.RestaurantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TasteSignalProcessorTest {

    @Autowired
    private TasteSignalProcessor tasteSignalProcessor;

    @MockBean
    private UserTasteProfileRepository tasteProfileRepository;

    @MockBean
    private UserTasteDimensionRepository tasteDimensionRepository;

    @MockBean
    private UserBehaviorEventRepository behaviorEventRepository;

    @MockBean
    private UserPreferenceOverrideRepository preferenceOverrideRepository;

    @MockBean
    private UserTasteHistoryRepository tasteHistoryRepository;

    @MockBean
    private MenuItemRepository menuItemRepository;

    @MockBean
    private RestaurantRepository restaurantRepository;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @MockBean
    private com.delivery.foodDelivery.config.DataInitializer dataInitializer;

    private UserTasteProfile mockProfile;

    @BeforeEach
    public void setup() {
        mockProfile = UserTasteProfile.builder()
                .userId("user-456")
                .preferredCuisines(new ArrayList<>())
                .preferredCategories(new ArrayList<>())
                .frequentItems(new HashMap<>())
                .frequentRestaurants(new HashMap<>())
                .dietaryPreferences(new ArrayList<>())
                .budgetTier("MEDIUM")
                .explorationScore(0.5)
                .version(1L)
                .lastUpdated(LocalDateTime.now())
                .build();

        Mockito.when(tasteProfileRepository.findByUserId("user-456")).thenReturn(Optional.of(mockProfile));
        Mockito.when(tasteProfileRepository.save(Mockito.any())).thenReturn(mockProfile);
    }

    @Test
    public void testProcessEventOrderCompleted() {
        UserBehaviorEventDto eventDto = new UserBehaviorEventDto();
        eventDto.setEventId("event-111");
        eventDto.setUserId("user-456");
        eventDto.setEventType("ORDER_COMPLETED");
        eventDto.setTimestamp(LocalDateTime.now().toString());

        Map<String, Object> payload = new HashMap<>();
        payload.put("restaurantId", "rest-1");
        payload.put("dishIds", List.of("dish-1"));
        payload.put("amount", "350.0");
        payload.put("timeOfDay", "DINNER");
        payload.put("weather", "RAINY");
        eventDto.setPayload(payload);

        // Mock Restaurant
        Restaurant rest = Restaurant.builder()
                .id("rest-1")
                .name("Spicy Bite")
                .cuisineType("INDIAN")
                .build();
        Mockito.when(restaurantRepository.findById("rest-1")).thenReturn(Optional.of(rest));

        // Mock MenuItem
        MenuItem item = MenuItem.builder()
                .id("dish-1")
                .name("Paneer Tikka Spicy")
                .category("STARTER")
                .price(250.0)
                .vegetarian(true)
                .build();
        Mockito.when(menuItemRepository.findById("dish-1")).thenReturn(Optional.of(item));

        // Mock Dimension find
        Mockito.when(tasteDimensionRepository.findByUserIdAndDimensionTypeAndDimensionKey(
                Mockito.eq(456L), Mockito.anyString(), Mockito.anyString()
        )).thenReturn(Optional.empty());

        tasteSignalProcessor.processEvent(eventDto);

        // Verify raw event persist
        Mockito.verify(behaviorEventRepository, Mockito.times(1)).save(Mockito.any(UserBehaviorEvent.class));

        // Verify dimension updates occurred
        Mockito.verify(tasteDimensionRepository, Mockito.atLeastOnce()).save(Mockito.any(UserTasteDimension.class));

        // Verify WS update broadcast
        Mockito.verify(messagingTemplate, Mockito.times(1)).convertAndSend(
                Mockito.eq("/topic/taste/user-456"), Mockito.any(Map.class)
        );
    }

    @Test
    public void testProcessEventNegativeFeedbackDislike() {
        UserBehaviorEventDto eventDto = new UserBehaviorEventDto();
        eventDto.setEventId("event-222");
        eventDto.setUserId("user-456");
        eventDto.setEventType("USER_DISLIKED");
        eventDto.setTimestamp(LocalDateTime.now().toString());

        Map<String, Object> payload = new HashMap<>();
        payload.put("dishId", "dish-2");
        eventDto.setPayload(payload);

        // Mock MenuItem containing Mushroom (triggers exclusion)
        MenuItem item = MenuItem.builder()
                .id("dish-2")
                .name("Mushroom Delight")
                .category("MAIN_COURSE")
                .price(300.0)
                .vegetarian(true)
                .build();
        Mockito.when(menuItemRepository.findById("dish-2")).thenReturn(Optional.of(item));

        tasteSignalProcessor.processEvent(eventDto);

        // Verify that preference override was saved to exclude MUSHROOM
        Mockito.verify(preferenceOverrideRepository, Mockito.times(1)).save(Mockito.argThat(override ->
                "EXCLUDED_INGREDIENT".equals(override.getPreferenceKey()) &&
                "MUSHROOM".equals(override.getPreferenceValue())
        ));
    }
}
