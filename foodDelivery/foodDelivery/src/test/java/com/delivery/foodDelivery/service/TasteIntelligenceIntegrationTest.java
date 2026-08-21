package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TasteIntelligenceIntegrationTest {

    @Autowired
    private TasteIntelligenceService tasteIntelligenceService;

    @MockBean
    private UserTasteProfileRepository tasteProfileRepository;

    @MockBean
    private UserPreferenceOverrideRepository preferenceOverrideRepository;

    @MockBean
    private MenuItemRepository menuItemRepository;

    @MockBean
    private RestaurantRepository restaurantRepository;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private RecommendationFeedbackRepository feedbackRepository;

    @MockBean
    private RecommendationRequestRepository requestRepository;

    @MockBean
    private RecommendationResultRepository resultRepository;

    @MockBean
    private RestaurantDigitalTwinStateRepository digitalTwinStateRepository;

    @MockBean
    private UserTasteHistoryRepository tasteHistoryRepository;

    @MockBean
    private com.delivery.foodDelivery.config.DataInitializer dataInitializer;

    private Restaurant mockOpenRestaurant;
    private Restaurant mockClosedRestaurant;
    private MenuItem mockPizza;
    private MenuItem mockBurger;
    private MenuItem mockDrink;

    @BeforeEach
    public void setup() {
        // Setup mock open restaurant
        mockOpenRestaurant = Restaurant.builder()
                .id("rest-open")
                .name("Pizza Palace")
                .cuisineType("ITALIAN")
                .rating(4.5)
                .avgDeliveryTime(25)
                .city("Delhi")
                .open(true)
                .build();

        // Setup mock closed restaurant (open = true in document, but closed in digital twin status)
        mockClosedRestaurant = Restaurant.builder()
                .id("rest-closed")
                .name("Burger Stop")
                .cuisineType("AMERICAN")
                .rating(4.0)
                .avgDeliveryTime(35)
                .city("Delhi")
                .open(true)
                .build();

        // Mock items
        mockPizza = MenuItem.builder()
                .id("dish-pizza")
                .name("Spicy Cheese Pizza")
                .description("Tasty pizza with chili flakes and jalapeños")
                .category("PIZZA")
                .price(299.0)
                .vegetarian(true)
                .restaurantId("rest-open")
                .available(true)
                .build();

        mockBurger = MenuItem.builder()
                .id("dish-burger")
                .name("Double Ham Burger")
                .description("Beef burger with mushroom sauce")
                .category("BURGER")
                .price(350.0)
                .vegetarian(false)
                .restaurantId("rest-closed")
                .available(true)
                .build();

        mockDrink = MenuItem.builder()
                .id("dish-drink")
                .name("Chilled Lemon Cola")
                .description("Cold sweet carbonated drink")
                .category("BEVERAGES")
                .price(50.0)
                .vegetarian(true)
                .restaurantId("rest-open")
                .available(true)
                .build();

        // Mock repository lists
        Mockito.when(restaurantRepository.findAll()).thenReturn(List.of(mockOpenRestaurant, mockClosedRestaurant));
        Mockito.when(menuItemRepository.findAll()).thenReturn(List.of(mockPizza, mockBurger, mockDrink));

        // Mock digital twin state to report CLOSED for burger stop
        Mockito.when(digitalTwinStateRepository.findByRestaurantId("rest-closed"))
                .thenReturn(Optional.of(RestaurantDigitalTwinState.builder().restaurantId("rest-closed").status("CLOSED").build()));
        Mockito.when(digitalTwinStateRepository.findByRestaurantId("rest-open"))
                .thenReturn(Optional.of(RestaurantDigitalTwinState.builder().restaurantId("rest-open").status("OPEN").build()));
    }

    @Test
    public void testRecommendationsSafetyFilteringAndCuisineBoost() {
        // Mock user explicit preference: vegetarian only, peanut allergy, Italian favorite
        UserPreferenceOverride pref1 = UserPreferenceOverride.builder()
                .userId(123L)
                .preferenceKey("DIETARY_PREF")
                .preferenceValue("VEGETARIAN")
                .build();
        UserPreferenceOverride pref2 = UserPreferenceOverride.builder()
                .userId(123L)
                .preferenceKey("FAVORITE_CUISINES")
                .preferenceValue("ITALIAN")
                .build();
        UserPreferenceOverride pref3 = UserPreferenceOverride.builder()
                .userId(123L)
                .preferenceKey("SPICE_LEVEL")
                .preferenceValue("HIGH")
                .build();

        Mockito.when(preferenceOverrideRepository.findByUserId(123L)).thenReturn(List.of(pref1, pref2, pref3));

        List<TasteIntelligenceService.TasteRecommendationDto> recommendations = 
                tasteIntelligenceService.getRecommendations(123L, "RAINY", "DINNER", "Delhi", null);

        // Assertions
        assertNotNull(recommendations);
        // Pizza should be in recommendations, burger should be filtered out because restaurant is CLOSED in digital twin & it is non-vegetarian.
        assertFalse(recommendations.stream().anyMatch(r -> "dish-burger".equals(r.getId())), "Non-veg closed burger should be filtered out");
        assertTrue(recommendations.stream().anyMatch(r -> "dish-pizza".equals(r.getId())), "Veg open pizza should be included");

        TasteIntelligenceService.TasteRecommendationDto pizzaRec = recommendations.stream()
                .filter(r -> "dish-pizza".equals(r.getId())).findFirst().get();

        // Check reason codes matching
        assertTrue(pizzaRec.getReasonCodes().contains("CUISINE_MATCH"), "Cuisine boosting should match");
        assertTrue(pizzaRec.getReasonCodes().contains("SPICE_MATCH"), "Spice preferences should match description");
    }

    @Test
    public void testSmartReorderPrediction() {
        // Mock order history of customer 123L
        Order mockOrder = Order.builder()
                .id(1L)
                .customer(User.builder().id(123L).build())
                .restaurantId("rest-open")
                .build();
        mockOrder.setCreatedDate(LocalDateTime.now()); // ordered today
        OrderItem mockItem = OrderItem.builder()
                .menuItemId("dish-pizza")
                .quantity(1)
                .priceAtOrderTime(299.0)
                .order(mockOrder)
                .build();
        mockOrder.setOrderItems(List.of(mockItem));

        Mockito.when(orderRepository.findByCustomerIdOrderByCreatedDateDesc(123L)).thenReturn(List.of(mockOrder, mockOrder)); // ordered twice

        List<TasteIntelligenceService.TasteRecommendationDto> reorders = 
                tasteIntelligenceService.getReorderRecommendations(123L);

        assertNotNull(reorders);
        assertFalse(reorders.isEmpty());
        TasteIntelligenceService.TasteRecommendationDto firstReorder = reorders.get(0);
        assertEquals("dish-pizza", firstReorder.getId());
        assertTrue(firstReorder.getReasonCodes().contains("REORDER_PREDICTION"), "Reorder prediction should boost item");
    }

    @Test
    public void testBudgetMealBuilderCombos() {
        // Try getting combos under 400
        List<TasteIntelligenceService.TasteRecommendationDto> combos = 
                tasteIntelligenceService.getMealBuilderRecommendations(123L, 400.0);

        assertNotNull(combos);
        assertFalse(combos.isEmpty());
        
        // Check that combos represent pairs from rest-open (Pizza Palace)
        TasteIntelligenceService.TasteRecommendationDto firstCombo = combos.get(0);
        List<?> comboItems = (List<?>) firstCombo.getData();
        assertEquals(2, comboItems.size());
        
        MenuItem main = (MenuItem) comboItems.get(0);
        MenuItem side = (MenuItem) comboItems.get(1);
        
        assertEquals("rest-open", main.getRestaurantId());
        assertEquals("rest-open", side.getRestaurantId());
        assertTrue(main.getPrice() + side.getPrice() <= 400.0);
    }

    @Test
    public void testNaturalLanguageQueryParser() {
        // Test parsing query
        String query = "I want a sweet dessert or beverage under 100 without milk";
        Map<String, Object> response = tasteIntelligenceService.parseNaturalLanguageQuery(query, 123L);
        
        assertNotNull(response);
        TasteIntelligenceService.ParsedIntentDto intent = 
                (TasteIntelligenceService.ParsedIntentDto) response.get("parsedIntent");
        
        assertNotNull(intent);
        assertEquals(100.0, intent.getBudgetMax());
        assertEquals("LOW", intent.getSpiceLevel());
        assertTrue(intent.getExcludedIngredients().contains("milk"));
        
        List<?> results = (List<?>) response.get("results");
        assertNotNull(results);
        assertFalse(results.isEmpty());
    }
}
