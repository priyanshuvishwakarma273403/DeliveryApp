package com.delivery.foodDelivery.config;

import com.delivery.foodDelivery.entity.Restaurant;
import com.delivery.foodDelivery.entity.MenuItem;
import com.delivery.foodDelivery.entity.User;
import com.delivery.foodDelivery.enums.Role;
import com.delivery.foodDelivery.repository.mongo.RestaurantRepository;
import com.delivery.foodDelivery.repository.mongo.MenuItemRepository;
import com.delivery.foodDelivery.repository.jpa.UserRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    @Override
    public void run(String... args) throws Exception {
        // Seed Admin User
        if (!userRepository.existsByEmail("admin@foodiq.com") && !userRepository.existsByPhone("9988776655")) {
            User admin = User.builder()
                    .name("FoodIQ Admin")
                    .email("admin@foodiq.com")
                    .password(passwordEncoder.encode("admin123"))
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .phone("9988776655")
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Admin user seeded.");
        }

        // Force cleanup and re-seeding of unique, high-quality data
        // We check if the database has less than 24 restaurants, or contains outdated placeholder data
        long count = restaurantRepository.count();
        if (count < 20 || count > 90) { 
            log.info("Cleaning up old placeholder database entries to seed high-quality unique data...");
            restaurantRepository.deleteAll();
            menuItemRepository.deleteAll();
            seedUniquePremiumData();
        }
    }

    private void seedUniquePremiumData() {
        log.info("Starting premium database seeding...");

        List<RestaurantTemplate> templates = getRestaurantTemplates();
        String[] cities = {"Noida", "Delhi", "Gurgaon"};
        String[] locations = {
                "Sector 62", "Sector 18", "Connaught Place", "Saket", 
                "DLF Phase 3", "Cyber Hub", "Indirapuram", "Raj Nagar"
        };

        List<Restaurant> seededRestaurants = new ArrayList<>();
        List<MenuItem> seededMenuItems = new ArrayList<>();

        int idCounter = 1;
        // Generate 24 unique restaurant branches (8 templates x 3 cities)
        for (RestaurantTemplate temp : templates) {
            for (String city : cities) {
                String branchLocation = locations[random.nextInt(locations.length)] + ", " + city;
                String uniqueName = temp.name + " (" + branchLocation.split(",")[0] + ")";
                
                Restaurant restaurant = Restaurant.builder()
                        .name(uniqueName)
                        .address("G-Block, " + branchLocation)
                        .city(city)
                        .cuisineType(temp.cuisine)
                        .phone("987654" + String.format("%04d", idCounter))
                        .imageUrl(temp.imageUrl)
                        .rating(4.0 + (random.nextDouble() * 1.0)) // Premium rating (4.0 - 5.0)
                        .avgDeliveryTime(15 + random.nextInt(25)) // 15 - 40 mins
                        .minOrderAmount(150.0 + (random.nextInt(3) * 50.0))
                        .open(true)
                        .build();

                Restaurant savedRest = restaurantRepository.save(restaurant);
                seededRestaurants.add(savedRest);

                // Add corresponding unique menu items for this branch
                for (MenuItemTemplate itemTemp : temp.menuItems) {
                    double priceVariation = Math.round((itemTemp.basePrice + (random.nextDouble() * 40.0 - 20.0)) * 1.0) / 1.0;
                    
                    MenuItem menuItem = MenuItem.builder()
                            .name(itemTemp.name)
                            .description(itemTemp.description + " - freshly prepared at our " + savedRest.getName() + " branch.")
                            .price(priceVariation)
                            .imageUrl(itemTemp.imageUrl)
                            .category(itemTemp.category)
                            .restaurantId(savedRest.getId())
                            .vegetarian(itemTemp.vegetarian)
                            .available(true)
                            .build();
                    
                    seededMenuItems.add(menuItem);
                }
                idCounter++;
            }
        }

        menuItemRepository.saveAll(seededMenuItems);
        log.info("Successfully seeded {} unique premium restaurants and {} menu items!", 
                seededRestaurants.size(), seededMenuItems.size());
    }

    // Curated high quality templates with unique Unsplash food images
    private List<RestaurantTemplate> getRestaurantTemplates() {
        List<RestaurantTemplate> list = new ArrayList<>();

        // 1. Italian
        List<MenuItemTemplate> italianItems = List.of(
                new MenuItemTemplate("Margherita Pizza", "Classic sourdough pizza with fresh basil, San Marzano tomatoes, and buffalo mozzarella.", 299.0, "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600", "SIDES", true),
                new MenuItemTemplate("Pasta Carbonara", "Penne tossed in creamy egg yolk sauce, parmesan, and roasted garlic mushrooms.", 349.0, "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600", "VEG", true),
                new MenuItemTemplate("Cheesy Garlic Bread", "Baked baguette slices slathered in butter, herbs, and melted mozzarella.", 149.0, "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600", "SIDES", true),
                new MenuItemTemplate("Classic Tiramisu", "Layered Italian dessert made with coffee-dipped ladyfingers and mascarpone cream.", 199.0, "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600", "DESSERT", true)
        );
        list.add(new RestaurantTemplate("La Piazza", "Italian", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", italianItems));

        // 2. American Burgers
        List<MenuItemTemplate> burgerItems = List.of(
                new MenuItemTemplate("Double Cheese Burger", "Juicy grilled vegetable patty, double cheddar slice, caramelized onions, and house sauce.", 249.0, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600", "VEG", true),
                new MenuItemTemplate("Crispy Chicken Burger", "Golden fried chicken breast fillet with iceberg lettuce and spicy mayo.", 289.0, "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600", "NON_VEG", false),
                new MenuItemTemplate("Peri Peri French Fries", "Freshly cut crispy potato fries tossed in tangy peri-peri seasoning.", 119.0, "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600", "SIDES", true),
                new MenuItemTemplate("Salted Caramel Shake", "Rich milkshake blended with dairy ice cream and home-style caramel sauce.", 159.0, "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600", "BEVERAGES", true)
        );
        list.add(new RestaurantTemplate("Burger Bistro", "American", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", burgerItems));

        // 3. Indian
        List<MenuItemTemplate> indianItems = List.of(
                new MenuItemTemplate("Butter Chicken", "Succulent chicken chunks cooked in sweet and rich buttery tomato gravy.", 399.0, "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600", "NON_VEG", false),
                new MenuItemTemplate("Paneer Tikka Masala", "Clay oven grilled paneer blocks cooked in aromatic onion tomato masala.", 329.0, "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600", "VEG", true),
                new MenuItemTemplate("Hyderabadi Biryani", "Aromatic long grain basmati rice layered with spices and slow cooked.", 349.0, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600", "NON_VEG", false),
                new MenuItemTemplate("Butter Garlic Naan", "Traditional leavened flatbread topped with garlic flakes and butter.", 69.0, "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600", "SIDES", true)
        );
        list.add(new RestaurantTemplate("The Curry House", "Indian", "https://images.unsplash.com/photo-1585938338392-50a59220247c?w=800", indianItems));

        // 4. Japanese
        List<MenuItemTemplate> sushiItems = List.of(
                new MenuItemTemplate("Salmon Avocado Roll", "Fresh Norwegian salmon slices, creamy avocado, and seasoned sushi rice.", 499.0, "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600", "NON_VEG", false),
                new MenuItemTemplate("Crispy Veg Tempura", "Assorted seasonal vegetables coated in light tempura batter and deep fried.", 259.0, "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600", "VEG", true),
                new MenuItemTemplate("Shiitake Mushroom Ramen", "Savory miso broth loaded with wheat noodles, scallions, and shiitake mushrooms.", 379.0, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600", "VEG", true)
        );
        list.add(new RestaurantTemplate("Sushi Zen", "Japanese", "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800", sushiItems));

        // 5. Healthy & Salads
        List<MenuItemTemplate> healthyItems = List.of(
                new MenuItemTemplate("Avocado Greek Salad", "Crispy cucumbers, red onions, tomatoes, avocado slices, and feta cheese in olive oil dressing.", 279.0, "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600", "VEG", true),
                new MenuItemTemplate("Protein Quinoa Bowl", "Steamed high-fiber quinoa topped with roasted sprouts, bell peppers, and citrus dressing.", 299.0, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600", "VEG", true),
                new MenuItemTemplate("Berry Detox Acai Bowl", "Frozen acai berry blend topped with crunchy granola, chia seeds, and fresh strawberries.", 249.0, "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600", "DESSERT", true),
                new MenuItemTemplate("Immune Booster Juice", "Fresh cold-pressed carrots, beetroot, and ginger juice with lemon twist.", 139.0, "https://images.unsplash.com/photo-1610970881699-44a5587caaec?w=600", "BEVERAGES", true)
        );
        list.add(new RestaurantTemplate("The Green Bowl", "Healthy", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", healthyItems));

        // 6. Desserts
        List<MenuItemTemplate> dessertItems = List.of(
                new MenuItemTemplate("Red Velvet Slice", "Indulgent red velvet sponge layered with smooth cream cheese frosting.", 189.0, "https://images.unsplash.com/photo-1586985289688-ca9cf4993ec0?w=600", "DESSERT", true),
                new MenuItemTemplate("Blueberry Cheesecake", "Rich baked cheesecake topped with premium wild blueberry compote.", 229.0, "https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600", "DESSERT", true),
                new MenuItemTemplate("Hot Chocolate Brownie", "Fudgy warm chocolate brownie loaded with roasted walnuts.", 149.0, "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600", "DESSERT", true)
        );
        list.add(new RestaurantTemplate("Sweet Tooth", "Desserts", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800", dessertItems));

        // 7. Mexican
        List<MenuItemTemplate> mexicanItems = List.of(
                new MenuItemTemplate("Soft Shell Tacos", "Three flour tortillas filled with seasoned beans, cheese, salsa, and sour cream.", 249.0, "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600", "VEG", true),
                new MenuItemTemplate("Cheese Quesadilla", "Grilled tortilla stuffed with mixed peppers, sweet corn, and liquid mozzarella.", 269.0, "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600", "VEG", true),
                new MenuItemTemplate("Loaded Nachos Platter", "Crisp tortilla chips topped with cheese sauce, jalapenos, and refried beans.", 189.0, "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600", "SIDES", true)
        );
        list.add(new RestaurantTemplate("Taco Fiesta", "Mexican", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800", mexicanItems));

        // 8. Chinese
        List<MenuItemTemplate> chineseItems = List.of(
                new MenuItemTemplate("Steamed Veg Momos", "Traditional dumplings stuffed with seasoned minced vegetables.", 159.0, "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600", "VEG", true),
                new MenuItemTemplate("Veg Hakka Noodles", "Stir-fried noodles tossed with cabbage, bell peppers, and scallions in light soy sauce.", 219.0, "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600", "VEG", true),
                new MenuItemTemplate("Crispy Spring Rolls", "Deep fried rolls filled with spiced carrots, cabbage, and glass noodles.", 149.0, "https://images.unsplash.com/photo-1544025162-d76694265947?w=600", "SIDES", true)
        );
        list.add(new RestaurantTemplate("Dim Sum House", "Chinese", "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800", chineseItems));

        return list;
    }

    @lombok.AllArgsConstructor
    private static class RestaurantTemplate {
        String name;
        String cuisine;
        String imageUrl;
        List<MenuItemTemplate> menuItems;
    }

    @lombok.AllArgsConstructor
    private static class MenuItemTemplate {
        String name;
        String description;
        double basePrice;
        String imageUrl;
        String category;
        boolean vegetarian;
    }
}
