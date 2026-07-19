package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.dto.response.SearchResultItem;
import com.delivery.foodDelivery.dto.response.SearchSuggestion;
import com.delivery.foodDelivery.entity.*;
import com.delivery.foodDelivery.repository.jpa.*;
import com.delivery.foodDelivery.repository.mongo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UniversalSearchService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final ReviewRepository reviewRepository;
    private final BlogRepository blogRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final SearchAuditLogRepository searchAuditLogRepository;

    // Synonym Mapping
    private static final Map<String, List<String>> SYNONYMS = new HashMap<>();
    static {
        SYNONYMS.put("burger", Arrays.asList("hamburger", "sliders", "cheeseburger", "patty"));
        SYNONYMS.put("pizza", Arrays.asList("pie", "slice", "cheesy pizza", "pepperoni"));
        SYNONYMS.put("veg", Arrays.asList("vegetarian", "green", "jain", "vegan", "pure veg"));
        SYNONYMS.put("drink", Arrays.asList("beverage", "soda", "coke", "juice", "shake", "smoothie"));
        SYNONYMS.put("chicken", Arrays.asList("non-veg", "poultry", "tandoori chicken", "wings"));
    }

    // Levenshtein Similarity calculation for Typo Tolerance
    public static double getSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        s1 = s1.toLowerCase().trim();
        s2 = s2.toLowerCase().trim();
        if (s1.equals(s2)) return 1.0;
        if (s1.contains(s2) || s2.contains(s1)) return 0.8;

        int len1 = s1.length();
        int len2 = s2.length();
        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) dp[i][0] = i;
        for (int j = 0; j <= len2; j++) dp[0][j] = j;

        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }

        int maxLen = Math.max(len1, len2);
        if (maxLen == 0) return 1.0;
        return 1.0 - ((double) dp[len1][len2] / maxLen);
    }

    // Natural Language Search Parser
    private Map<String, Object> parseNaturalLanguage(String query) {
        Map<String, Object> params = new HashMap<>();
        String queryLower = query.toLowerCase();

        // Check vegetarian
        if (queryLower.contains("veg ") || queryLower.contains("vegetarian") || queryLower.contains("pure veg")) {
            params.put("vegOnly", true);
        }
        // Check rating threshold
        if (queryLower.contains("top rated") || queryLower.contains("best") || queryLower.contains("highly rated")) {
            params.put("minRating", 4.3);
        } else if (queryLower.contains("star") || queryLower.contains(">")) {
            if (queryLower.contains("4")) params.put("minRating", 4.0);
            if (queryLower.contains("3")) params.put("minRating", 3.0);
        }

        // Check speed/delivery
        if (queryLower.contains("fast") || queryLower.contains("quick") || queryLower.contains("express")) {
            params.put("fastDelivery", true);
        }

        // Check budget/pricing
        if (queryLower.contains("cheap") || queryLower.contains("budget") || queryLower.contains("under 300")) {
            params.put("budgetOnly", true);
        }

        // Check combos
        if (queryLower.contains("combo") || queryLower.contains("deal") || queryLower.contains("feast")) {
            params.put("combosOnly", true);
        }

        return params;
    }

    // Mask sensitive data based on role
    private String maskString(String str, int visiblePrefix, int visibleSuffix) {
        if (str == null || str.length() <= (visiblePrefix + visibleSuffix)) return "***";
        StringBuilder sb = new StringBuilder();
        sb.append(str, 0, visiblePrefix);
        for (int i = 0; i < str.length() - visiblePrefix - visibleSuffix; i++) {
            sb.append("*");
        }
        sb.append(str.substring(str.length() - visibleSuffix));
        return sb.toString();
    }

    // Main Universal Search
    @Cacheable(value = "universal_search", key = "#query + '_' + #userId + '_' + #role + '_' + #sortBy")
    public List<SearchResultItem> search(String query, String userId, String role, List<String> typeFilters, String sortBy, double userLat, double userLon) {
        long startTime = System.currentTimeMillis();
        String cleanQuery = query == null ? "" : query.trim();

        // 1. Synonym Expansion
        List<String> queryTokens = Arrays.stream(cleanQuery.toLowerCase().split("\\s+"))
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toList());
        List<String> searchTerms = new ArrayList<>(queryTokens);
        for (String token : queryTokens) {
            if (SYNONYMS.containsKey(token)) {
                searchTerms.addAll(SYNONYMS.get(token));
            }
        }

        // 2. Parse natural language parameters
        Map<String, Object> nlParams = parseNaturalLanguage(cleanQuery);
        log.info("Parsed NL Parameters: {}", nlParams);

        List<SearchResultItem> allMatches = new ArrayList<>();

        // Fetching Database Entities & Simulating missing ones
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role) || "SUPER_ADMIN".equalsIgnoreCase(role);
        boolean isCustomer = "CUSTOMER".equalsIgnoreCase(role);
        boolean isDelivery = "DELIVERY_PARTNER".equalsIgnoreCase(role);

        // -- Module 1: Restaurants (Mongo) --
        if (shouldSearchType("RESTAURANT", typeFilters)) {
            List<Restaurant> list = restaurantRepository.findAll();
            for (Restaurant res : list) {
                double matchScore = calculateMatchScore(res.getName() + " " + res.getCuisineType() + " " + res.getCity(), searchTerms);
                if (matchScore > 0.1) {
                    // Check NL Filters
                    if (nlParams.containsKey("minRating") && res.getRating() < (double) nlParams.get("minRating")) continue;
                    if (nlParams.containsKey("fastDelivery") && res.getAvgDeliveryTime() > 30) continue;
                    if (nlParams.containsKey("budgetOnly") && res.getMinOrderAmount() > 300) continue;

                    Map<String, Object> meta = new HashMap<>();
                    meta.put("cuisine", res.getCuisineType());
                    meta.put("city", res.getCity());
                    meta.put("rating", res.getRating());
                    meta.put("avgDeliveryTime", res.getAvgDeliveryTime());
                    meta.put("minOrderAmount", res.getMinOrderAmount());
                    meta.put("openNow", res.isOpen());
                    meta.put("address", res.getAddress());
                    
                    // Distance calculation (dynamic simulation)
                    double distance = 1.2 + (new Random(res.getId().hashCode()).nextDouble() * 5.0);
                    meta.put("distance", Math.round(distance * 10.0) / 10.0);

                    allMatches.add(SearchResultItem.builder()
                            .id(res.getId())
                            .type("RESTAURANT")
                            .title(res.getName())
                            .subtitle(res.getCuisineType() + " | " + res.getCity())
                            .imageUrl(res.getImageUrl())
                            .rating(res.getRating())
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 2: Branches --
        if (shouldSearchType("BRANCH", typeFilters)) {
            // Simulated branches of restaurants
            List<Restaurant> list = restaurantRepository.findAll();
            for (int i = 0; i < Math.min(list.size(), 20); i++) {
                Restaurant r = list.get(i);
                String branchName = r.getName() + " - " + r.getCity() + " West Branch";
                double matchScore = calculateMatchScore(branchName, searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("restaurantId", r.getId());
                    meta.put("city", r.getCity());
                    meta.put("seatingCapacity", 80 + (i * 5));
                    meta.put("manager", "Manager " + (i + 1));

                    allMatches.add(SearchResultItem.builder()
                            .id("branch_" + r.getId() + "_" + i)
                            .type("BRANCH")
                            .title(branchName)
                            .subtitle("Active FoodIQ Kitchen | Capacity: " + meta.get("seatingCapacity"))
                            .imageUrl(r.getImageUrl())
                            .rating(r.getRating() - 0.1)
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 3: Food Items (Mongo: MenuItem) --
        if (shouldSearchType("FOOD_ITEM", typeFilters)) {
            List<MenuItem> items = menuItemRepository.findAll();
            for (MenuItem item : items) {
                double matchScore = calculateMatchScore(item.getName() + " " + item.getDescription() + " " + item.getCategory(), searchTerms);
                if (matchScore > 0.1) {
                    // Check NL Filters
                    if (nlParams.containsKey("vegOnly") && !item.isVegetarian()) continue;
                    if (nlParams.containsKey("budgetOnly") && item.getPrice() > 300) continue;

                    Map<String, Object> meta = new HashMap<>();
                    meta.put("price", item.getPrice());
                    meta.put("category", item.getCategory());
                    meta.put("vegetarian", item.isVegetarian());
                    meta.put("restaurantId", item.getRestaurantId());
                    meta.put("available", item.isAvailable());
                    meta.put("spicyLevel", new Random(item.getId().hashCode()).nextInt(3) + 1);

                    allMatches.add(SearchResultItem.builder()
                            .id(item.getId())
                            .type("FOOD_ITEM")
                            .title(item.getName())
                            .subtitle(item.getCategory() + " - ₹" + item.getPrice() + (item.isVegetarian() ? " [VEG]" : " [NON-VEG]"))
                            .imageUrl(item.getImageUrl())
                            .rating(4.0 + (new Random(item.getId().hashCode()).nextDouble() * 0.9))
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 4: Categories --
        if (shouldSearchType("CATEGORY", typeFilters)) {
            String[] categories = {"VEG", "NON_VEG", "DESSERT", "BEVERAGES", "SIDES", "CHINESE", "INDIAN", "ITALIAN", "HEALTHY"};
            for (String cat : categories) {
                double matchScore = calculateMatchScore(cat, searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("itemCount", 50 + cat.hashCode() % 100);

                    allMatches.add(SearchResultItem.builder()
                            .id("category_" + cat.toLowerCase())
                            .type("CATEGORY")
                            .title(cat)
                            .subtitle("Food category with " + meta.get("itemCount") + " dishes live")
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 5: Combos --
        if (shouldSearchType("COMBO", typeFilters)) {
            String[][] combos = {
                    {"Double Burger Feast", "2 Cheeseburgers + Fries + 2 Cokes", "180"},
                    {"Pizza Double Deal", "2 Medium Pizzas + Stuffed Garlic Bread + Coke", "450"},
                    {"Biryani Family Pack", "2 Chicken Biryani + Chicken 65 + 1L Beverage", "599"},
                    {"Jain Special Thali Combo", "Paneer Veg + Dal + Roti + Rice + Sweet", "220"},
                    {"Healthy Breakfast Combo", "Fruit Salad + Oats + Fresh Orange Juice", "160"}
            };
            for (String[] cb : combos) {
                double matchScore = calculateMatchScore(cb[0] + " " + cb[1], searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("price", Double.parseDouble(cb[2]));
                    meta.put("itemsCount", 4);
                    meta.put("savings", "Save up to 25%");

                    allMatches.add(SearchResultItem.builder()
                            .id("combo_" + cb[0].toLowerCase().replace(" ", "_"))
                            .type("COMBO")
                            .title(cb[0])
                            .subtitle(cb[1] + " | ₹" + cb[2])
                            .rating(4.6)
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 6: Ingredients --
        if (shouldSearchType("INGREDIENT", typeFilters)) {
            String[] ingredients = {"Cheese", "Paneer", "Chicken Patty", "Tofu", "Garlic", "Mushrooms", "Tomato Sauce", "Olive Oil"};
            for (String ing : ingredients) {
                double matchScore = calculateMatchScore(ing, searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("allergenFree", !ing.equals("Cheese"));
                    meta.put("caloriesPer100g", 100 + (ing.hashCode() % 300));

                    allMatches.add(SearchResultItem.builder()
                            .id("ingredient_" + ing.toLowerCase())
                            .type("INGREDIENT")
                            .title(ing)
                            .subtitle("Common kitchen ingredient | " + meta.get("caloriesPer100g") + " kcal/100g")
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 7: Cuisines --
        if (shouldSearchType("CUISINE", typeFilters)) {
            String[] cuisines = {"Indian", "Chinese", "Italian", "American", "Mexican", "Japanese", "Continental", "Thai"};
            for (String cuis : cuisines) {
                double matchScore = calculateMatchScore(cuis, searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("popularityRank", (cuis.hashCode() % 8) + 1);

                    allMatches.add(SearchResultItem.builder()
                            .id("cuisine_" + cuis.toLowerCase())
                            .type("CUISINE")
                            .title(cuis)
                            .subtitle("#" + meta.get("popularityRank") + " Top Trending Cuisine on FoodIQ")
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 8: Customers (MySQL: User with ROLE CUSTOMER) --
        if (shouldSearchType("CUSTOMER", typeFilters) && isAdmin) {
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getRole() == com.delivery.foodDelivery.enums.Role.CUSTOMER) {
                    double matchScore = calculateMatchScore(u.getName() + " " + u.getEmail() + " " + u.getPhone(), searchTerms);
                    if (matchScore > 0.1) {
                        Map<String, Object> meta = new HashMap<>();
                        meta.put("email", u.getEmail());
                        meta.put("phone", u.getPhone());
                        meta.put("address", u.getAddress());
                        meta.put("active", u.isActive());

                        allMatches.add(SearchResultItem.builder()
                                .id(String.valueOf(u.getId()))
                                .type("CUSTOMER")
                                .title(u.getName())
                                .subtitle("Customer ID: " + u.getId() + " | " + u.getEmail())
                                .score(matchScore)
                                .metadata(meta)
                                .build());
                    }
                }
            }
        } else if (shouldSearchType("CUSTOMER", typeFilters) && !isAdmin && isCustomer && userId != null) {
            // Customer searching but can only see self
            User u = userRepository.findById(Long.parseLong(userId)).orElse(null);
            if (u != null) {
                double matchScore = calculateMatchScore(u.getName() + " " + u.getEmail(), searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("email", u.getEmail()); // no masking for self
                    meta.put("phone", u.getPhone());

                    allMatches.add(SearchResultItem.builder()
                            .id(String.valueOf(u.getId()))
                            .type("CUSTOMER")
                            .title(u.getName() + " (You)")
                            .subtitle("Registered Profile: " + u.getEmail())
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 9: Orders (MySQL: Order) --
        if (shouldSearchType("ORDER", typeFilters)) {
            List<Order> orders = orderRepository.findAll();
            for (Order o : orders) {
                boolean hasAccess = isAdmin || (isCustomer && o.getCustomer() != null && String.valueOf(o.getCustomer().getId()).equals(userId));
                if (hasAccess) {
                    String matchString = "Order " + o.getId() + " " + o.getStatus() + " " + o.getDeliveryAddress();
                    double matchScore = calculateMatchScore(matchString, searchTerms);
                    if (matchScore > 0.1) {
                        Map<String, Object> meta = new HashMap<>();
                        meta.put("status", o.getStatus().name());
                        meta.put("totalAmount", o.getTotalAmount());
                        meta.put("finalAmount", o.getFinalAmount());
                        meta.put("paymentStatus", o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "UNKNOWN");
                        meta.put("deliveryAddress", o.getDeliveryAddress());

                        allMatches.add(SearchResultItem.builder()
                                .id(String.valueOf(o.getId()))
                                .type("ORDER")
                                .title("Order #" + o.getId())
                                .subtitle("Status: " + o.getStatus() + " | Final Amount: ₹" + o.getFinalAmount())
                                .score(matchScore)
                                .metadata(meta)
                                .build());
                    }
                }
            }
        }

        // -- Module 10: Delivery Partners (MySQL: DeliveryPartner) --
        if (shouldSearchType("DELIVERY_PARTNER", typeFilters) && isAdmin) {
            List<DeliveryPartner> dpList = deliveryPartnerRepository.findAll();
            for (DeliveryPartner dp : dpList) {
                double matchScore = calculateMatchScore(dp.getVehicleNumber() + " " + dp.getStatus(), searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("status", dp.getStatus());
                    meta.put("vehicle", dp.getVehicleNumber());
                    meta.put("available", dp.isAvailable());

                    allMatches.add(SearchResultItem.builder()
                            .id(String.valueOf(dp.getId()))
                            .type("DELIVERY_PARTNER")
                            .title("Driver Partner #" + dp.getId())
                            .subtitle("Status: " + dp.getStatus() + " | Vehicle: " + dp.getVehicleNumber())
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 11: Coupons (Simulated) --
        if (shouldSearchType("COUPON", typeFilters)) {
            String[][] coupons = {
                    {"WELCOME50", "Flat 50% Off for new customers", "0.5"},
                    {"FOODIQGOLD", "15% discount for Gold members", "0.15"},
                    {"WEEKEND30", "Get 30% discount on orders above 400", "0.3"},
                    {"FREEDEL", "Free delivery coupon", "0.0"}
            };
            for (String[] cp : coupons) {
                double matchScore = calculateMatchScore(cp[0] + " " + cp[1], searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("discountPct", Double.parseDouble(cp[2]));
                    meta.put("maxDiscount", 150.0);

                    allMatches.add(SearchResultItem.builder()
                            .id("coupon_" + cp[0])
                            .type("COUPON")
                            .title("Promo: " + cp[0])
                            .subtitle(cp[1])
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 12: Offers (Simulated) --
        if (shouldSearchType("OFFER", typeFilters)) {
            String[][] offers = {
                    {"Buy 1 Get 1 Free", "Applicable on Burger Palace & Pizza Point special menu items", "BOGO"},
                    {"Flat 100 Cash Back", "Complete transaction using FoodIQ Wallet to redeem", "CASHBACK"},
                    {"Free Garlic Bread", "Add-on on any Large Pizza order today", "FREEBIE"}
            };
            for (String[] of : offers) {
                double matchScore = calculateMatchScore(of[0] + " " + of[1], searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("offerType", of[2]);

                    allMatches.add(SearchResultItem.builder()
                            .id("offer_" + of[2].toLowerCase())
                            .type("OFFER")
                            .title(of[0])
                            .subtitle(of[1])
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 13: Reviews (Mongo: Review) --
        if (shouldSearchType("REVIEW", typeFilters)) {
            List<Review> reviews = reviewRepository.findAll();
            for (Review rev : reviews) {
                double matchScore = calculateMatchScore(rev.getComment(), searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("rating", rev.getRating());
                    meta.put("restaurantId", rev.getRestaurantId());

                    allMatches.add(SearchResultItem.builder()
                            .id(rev.getId())
                            .type("REVIEW")
                            .title(rev.getRating() + "★ FoodIQ Review")
                            .subtitle(rev.getComment())
                            .rating(rev.getRating())
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 14: Support Tickets (Simulated) --
        if (shouldSearchType("SUPPORT_TICKET", typeFilters)) {
            boolean hasAccess = isAdmin || isCustomer;
            if (hasAccess) {
                String[][] tickets = {
                        {"TKT-1002", "Refund pending for order #14", "OPEN", "1"},
                        {"TKT-1005", "Delivered wrong meal items", "RESOLVED", "1"},
                        {"TKT-1009", "Late delivery refund request", "RESOLVED", "2"},
                        {"TKT-2023", "Wallet money not added after bank deduction", "IN_PROGRESS", "1"}
                };
                for (String[] tk : tickets) {
                    boolean isOwn = isAdmin || (userId != null && tk[3].equals(userId));
                    if (isOwn) {
                        double matchScore = calculateMatchScore(tk[0] + " " + tk[1] + " " + tk[2], searchTerms);
                        if (matchScore > 0.1) {
                            Map<String, Object> meta = new HashMap<>();
                            meta.put("ticketId", tk[0]);
                            meta.put("status", tk[2]);
                            meta.put("ownerId", tk[3]);

                            allMatches.add(SearchResultItem.builder()
                                    .id("ticket_" + tk[0])
                                    .type("SUPPORT_TICKET")
                                    .title("Ticket " + tk[0])
                                    .subtitle(tk[1] + " | Status: " + tk[2])
                                    .score(matchScore)
                                    .metadata(meta)
                                    .build());
                        }
                    }
                }
            }
        }

        // -- Module 15: Invoices (Simulated) --
        if (shouldSearchType("INVOICE", typeFilters)) {
            boolean hasAccess = isAdmin || isCustomer;
            if (hasAccess) {
                // Return structured invoices connected to Orders
                List<Order> orders = orderRepository.findAll();
                for (Order o : orders) {
                    boolean isOwn = isAdmin || (isCustomer && o.getCustomer() != null && String.valueOf(o.getCustomer().getId()).equals(userId));
                    if (isOwn) {
                        String invId = "INV-2026-" + String.format("%04d", o.getId());
                        double matchScore = calculateMatchScore(invId + " order " + o.getId(), searchTerms);
                        if (matchScore > 0.1) {
                            Map<String, Object> meta = new HashMap<>();
                            meta.put("invoiceId", invId);
                            meta.put("orderId", o.getId());
                            meta.put("amount", o.getFinalAmount());
                            meta.put("date", o.getCreatedDate().toString());

                            allMatches.add(SearchResultItem.builder()
                                    .id("invoice_" + o.getId())
                                    .type("INVOICE")
                                    .title("Invoice " + invId)
                                    .subtitle("Connected Order: #" + o.getId() + " | Paid Amount: ₹" + o.getFinalAmount())
                                    .score(matchScore)
                                    .metadata(meta)
                                    .build());
                        }
                    }
                }
            }
        }

        // -- Module 16: Transactions (Simulated) --
        if (shouldSearchType("TRANSACTION", typeFilters)) {
            boolean hasAccess = isAdmin || isCustomer;
            if (hasAccess) {
                List<Order> orders = orderRepository.findAll();
                for (Order o : orders) {
                    boolean isOwn = isAdmin || (isCustomer && o.getCustomer() != null && String.valueOf(o.getCustomer().getId()).equals(userId));
                    if (isOwn) {
                        String txnId = o.getPaymentId() != null ? o.getPaymentId() : "TXN-" + (100000000 + o.getId());
                        String cleanTxnId = isAdmin ? txnId : maskString(txnId, 4, 4); // Mask txn hash for customers

                        double matchScore = calculateMatchScore(txnId + " order " + o.getId(), searchTerms);
                        if (matchScore > 0.1) {
                            Map<String, Object> meta = new HashMap<>();
                            meta.put("transactionId", txnId);
                            meta.put("paymentMethod", o.getPaymentMethod());
                            meta.put("amount", o.getFinalAmount());

                            allMatches.add(SearchResultItem.builder()
                                    .id("txn_" + o.getId())
                                    .type("TRANSACTION")
                                    .title("Transaction ID: " + cleanTxnId)
                                    .subtitle("Order Ref: #" + o.getId() + " | Method: " + o.getPaymentMethod() + " | Amount: ₹" + o.getFinalAmount())
                                    .score(matchScore)
                                    .metadata(meta)
                                    .build());
                        }
                    }
                }
            }
        }

        // -- Module 17: Suppliers (Simulated) --
        if (shouldSearchType("SUPPLIER", typeFilters) && isAdmin) {
            String[][] suppliers = {
                    {"Fresh Farms Vegetables", "Ghaziabad Hub", "Vegetables & Herbs", "9876543210"},
                    {"Metro Meat Suppliers", "Delhi Okhla", "Chicken, Mutton, Seafood", "8765432109"},
                    {"Bakery Needs Wholesale", "Noida Sec 62", "Flour, Dairy, Eggs", "7654321098"},
                    {"Eco Packaging Ltd", "Gurgaon Industrial Area", "Biodegradable boxes & cutlery", "9998887776"}
            };
            for (String[] sp : suppliers) {
                double matchScore = calculateMatchScore(sp[0] + " " + sp[1] + " " + sp[2], searchTerms);
                if (matchScore > 0.1) {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("location", sp[1]);
                    meta.put("category", sp[2]);
                    meta.put("contactPhone", sp[3]);

                    allMatches.add(SearchResultItem.builder()
                            .id("supplier_" + sp[0].toLowerCase().replace(" ", "_"))
                            .type("SUPPLIER")
                            .title(sp[0])
                            .subtitle("Supplying: " + sp[2] + " | Location: " + sp[1])
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 18: Inventory Items (Simulated) --
        if (shouldSearchType("INVENTORY_ITEM", typeFilters) && isAdmin) {
            String[][] inventory = {
                    {"All-Purpose Flour 50kg", "Bakery", "45", "10"},
                    {"Tomato Ketchup 10L", "Sauces", "20", "5"},
                    {"Mozzarella Cheese 5kg", "Dairy", "15", "8"},
                    {"Cooking Canola Oil 20L", "Oils", "8", "12"},
                    {"Chicken Patty 100pc Pack", "Frozen Foods", "30", "15"}
            };
            for (String[] inv : inventory) {
                double matchScore = calculateMatchScore(inv[0] + " " + inv[1], searchTerms);
                if (matchScore > 0.1) {
                    int stock = Integer.parseInt(inv[2]);
                    int reorder = Integer.parseInt(inv[3]);

                    Map<String, Object> meta = new HashMap<>();
                    meta.put("stockCategory", inv[1]);
                    meta.put("quantityInStock", stock);
                    meta.put("reorderLevel", reorder);
                    meta.put("lowStockAlert", stock < reorder);

                    allMatches.add(SearchResultItem.builder()
                            .id("inventory_" + inv[0].toLowerCase().replace(" ", "_"))
                            .type("INVENTORY_ITEM")
                            .title(inv[0])
                            .subtitle("Category: " + inv[1] + " | Stock: " + stock + " packs " + (stock < reorder ? "[LOW STOCK]" : ""))
                            .score(matchScore)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // -- Module 19: Employees (MySQL: User with ROLE ADMIN, USER, PARTNER) --
        if (shouldSearchType("EMPLOYEE", typeFilters) && isAdmin) {
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getRole() != com.delivery.foodDelivery.enums.Role.CUSTOMER) {
                    double matchScore = calculateMatchScore(u.getName() + " " + u.getEmail() + " " + u.getRole(), searchTerms);
                    if (matchScore > 0.1) {
                        Map<String, Object> meta = new HashMap<>();
                        meta.put("email", u.getEmail());
                        meta.put("role", u.getRole().name());
                        meta.put("active", u.isActive());

                        allMatches.add(SearchResultItem.builder()
                                .id("emp_" + u.getId())
                                .type("EMPLOYEE")
                                .title(u.getName())
                                .subtitle("Designation: " + u.getRole().name() + " | Email: " + u.getEmail())
                                .score(matchScore)
                                .metadata(meta)
                                .build());
                    }
                }
            }
        }

        // 3. Compute Composite Smart Scoring
        for (SearchResultItem item : allMatches) {
            double finalScore = item.getScore(); // base similarity score

            // Popularity score boosting (rating based)
            if (item.getRating() != null) {
                finalScore += (item.getRating() / 5.0) * 0.2; // up to 0.2 boost
            }

            // Distance boost (closer items ranked higher)
            if (item.getMetadata() != null && item.getMetadata().containsKey("distance")) {
                double distance = (double) item.getMetadata().get("distance");
                // Distance penalty: items further away get less boost
                double distanceBoost = Math.max(0, 0.2 * (1.0 - (distance / 15.0)));
                finalScore += distanceBoost;
            }

            // Availability boost
            if (item.getMetadata() != null && Boolean.TRUE.equals(item.getMetadata().get("openNow"))) {
                finalScore += 0.1;
            }

            item.setScore(Math.round(finalScore * 100.0) / 100.0);
        }

        // 4. Sort Results
        if ("rating".equalsIgnoreCase(sortBy)) {
            allMatches.sort((a, b) -> Double.compare(b.getRating() != null ? b.getRating() : 0.0, a.getRating() != null ? a.getRating() : 0.0));
        } else if ("cost_low".equalsIgnoreCase(sortBy)) {
            allMatches.sort((a, b) -> Double.compare(getPrice(a), getPrice(b)));
        } else if ("cost_high".equalsIgnoreCase(sortBy)) {
            allMatches.sort((a, b) -> Double.compare(getPrice(b), getPrice(a)));
        } else if ("time".equalsIgnoreCase(sortBy)) {
            allMatches.sort((a, b) -> Integer.compare(getDeliveryTime(a), getDeliveryTime(b)));
        } else if ("distance".equalsIgnoreCase(sortBy)) {
            allMatches.sort((a, b) -> Double.compare(getDistance(a), getDistance(b)));
        } else {
            // Default: relevance score
            allMatches.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        }

        // 5. Audit Log (async save simulated)
        long latencyMs = System.currentTimeMillis() - startTime;
        saveAuditLog(userId, role, query, latencyMs, allMatches.size());

        // 6. Save query to User history (only for authenticated users)
        if (userId != null && !cleanQuery.isEmpty()) {
            saveSearchHistory(userId, cleanQuery);
        }

        return allMatches;
    }

    private double calculateMatchScore(String text, List<String> searchTerms) {
        if (text == null || searchTerms == null || searchTerms.isEmpty()) return 0.0;
        String textLower = text.toLowerCase();
        double bestSimilarity = 0.0;

        for (String term : searchTerms) {
            if (textLower.contains(term)) {
                bestSimilarity = Math.max(bestSimilarity, 0.8);
            }
            // Fuzzy comparison for each word
            for (String word : textLower.split("\\s+")) {
                double sim = getSimilarity(word, term);
                if (sim > 0.5) {
                    bestSimilarity = Math.max(bestSimilarity, sim);
                }
            }
        }
        return bestSimilarity;
    }

    private boolean shouldSearchType(String type, List<String> filters) {
        return filters == null || filters.isEmpty() || filters.stream().anyMatch(f -> f.equalsIgnoreCase(type));
    }

    private double getPrice(SearchResultItem item) {
        if (item.getMetadata() == null) return 9999.0;
        Object p = item.getMetadata().get("price");
        if (p == null) p = item.getMetadata().get("minOrderAmount");
        return p != null ? ((Number) p).doubleValue() : 9999.0;
    }

    private int getDeliveryTime(SearchResultItem item) {
        if (item.getMetadata() == null) return 999;
        Object t = item.getMetadata().get("avgDeliveryTime");
        return t != null ? ((Number) t).intValue() : 999;
    }

    private double getDistance(SearchResultItem item) {
        if (item.getMetadata() == null) return 99.0;
        Object d = item.getMetadata().get("distance");
        return d != null ? ((Number) d).doubleValue() : 99.0;
    }

    private void saveAuditLog(String userId, String role, String query, long latencyMs, int resultsSize) {
        try {
            SearchAuditLog logRecord = SearchAuditLog.builder()
                    .userId(userId != null ? userId : "ANONYMOUS")
                    .userRole(role != null ? role : "GUEST")
                    .query(query)
                    .timestamp(LocalDateTime.now())
                    .executionTimeMs(latencyMs)
                    .resultCount(resultsSize)
                    .ipAddress("127.0.0.1")
                    .clientType("UniversalSearchEngine")
                    .build();
            searchAuditLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to save search audit log: {}", e.getMessage());
        }
    }

    private void saveSearchHistory(String userId, String query) {
        try {
            Optional<SearchHistoryItem> existing = searchHistoryRepository.findByUserIdAndQueryIgnoreCase(userId, query);
            if (existing.isPresent()) {
                SearchHistoryItem item = existing.get();
                item.setCount(item.getCount() + 1);
                item.setTimestamp(LocalDateTime.now());
                searchHistoryRepository.save(item);
            } else {
                SearchHistoryItem item = SearchHistoryItem.builder()
                        .userId(userId)
                        .query(query)
                        .timestamp(LocalDateTime.now())
                        .count(1)
                        .favorite(false)
                        .build();
                searchHistoryRepository.save(item);
            }
        } catch (Exception e) {
            log.error("Failed to save search history: {}", e.getMessage());
        }
    }

    // Dynamic Autocomplete suggestions
    public List<SearchSuggestion> autocomplete(String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String pLower = prefix.toLowerCase().trim();
        List<SearchSuggestion> suggestions = new ArrayList<>();

        // Fetch matched restaurants
        List<Restaurant> restaurants = restaurantRepository.findAll();
        for (Restaurant r : restaurants) {
            if (r.getName().toLowerCase().contains(pLower)) {
                suggestions.add(new SearchSuggestion(r.getName(), "RESTAURANT", r.getCuisineType() + " | " + r.getCity()));
            }
        }

        // Fetch matched dishes
        List<MenuItem> items = menuItemRepository.findAll();
        for (MenuItem item : items) {
            if (item.getName().toLowerCase().contains(pLower)) {
                suggestions.add(new SearchSuggestion(item.getName(), "FOOD_ITEM", item.getCategory() + " - ₹" + item.getPrice()));
            }
        }

        // Add popular categories/cuisines matches
        String[] populars = {"Pizza", "Burger", "Biryani", "Paneer", "Dessert", "Beverages", "Chinese", "Italian", "Vegan"};
        for (String pop : populars) {
            if (pop.toLowerCase().startsWith(pLower)) {
                suggestions.add(new SearchSuggestion(pop, "CATEGORY", "Popular search category"));
            }
        }

        // Limit results to top 8 suggestions for fast responses
        return suggestions.stream()
                .distinct()
                .limit(8)
                .collect(Collectors.toList());
    }

    // Fetch user history
    public List<SearchHistoryItem> getHistory(String userId) {
        if (userId == null) return Collections.emptyList();
        return searchHistoryRepository.findByUserIdOrderByTimestampDesc(userId).stream()
                .limit(10)
                .collect(Collectors.toList());
    }

    // Delete item from history
    public void deleteFromHistory(String userId, String query) {
        if (userId == null || query == null) return;
        searchHistoryRepository.deleteByUserIdAndQueryIgnoreCase(userId, query);
    }

    // Clear all history
    public void clearHistory(String userId) {
        if (userId == null) return;
        searchHistoryRepository.deleteByUserId(userId);
    }

    // Get Trending searches
    public List<Map<String, Object>> getTrending() {
        // Generates weekly, daily, and popular trending tags
        List<Map<String, Object>> trending = new ArrayList<>();
        
        String[] keywords = {"Biryani", "Cheese Pizza", "Tandoori Paneer", "Cold Coffee", "Veg Combo", "Diet Salad"};
        for (int i = 0; i < keywords.length; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("keyword", keywords[i]);
            item.put("searchesToday", 1500 - (i * 200));
            item.put("weeklyGrowthPct", 20.5 + (i * 5.2));
            item.put("tag", i == 0 ? "FESTIVAL SPECIAL" : i == 1 ? "FAST GROWING" : "POPULAR");
            trending.add(item);
        }
        return trending;
    }

    // Fetch Analytics (ADMIN ONLY)
    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        List<SearchAuditLog> logs = searchAuditLogRepository.findAll();

        long total = logs.size();
        long successful = logs.stream().filter(l -> l.getResultCount() > 0).count();
        long failed = total - successful;
        double avgTime = logs.stream().mapToLong(SearchAuditLog::getExecutionTimeMs).average().orElse(0.0);

        analytics.put("totalSearches", total);
        analytics.put("successfulSearches", successful);
        analytics.put("failedSearches", failed);
        analytics.put("averageSearchTimeMs", Math.round(avgTime * 100.0) / 100.0);
        analytics.put("conversionRatePct", total > 0 ? Math.round(((double) successful / total) * 10000.0) / 100.0 : 0.0);

        // Group keywords
        Map<String, Long> keywords = logs.stream()
                .filter(l -> l.getQuery() != null && !l.getQuery().isEmpty())
                .collect(Collectors.groupingBy(SearchAuditLog::getQuery, Collectors.counting()));
        
        List<Map<String, Object>> topKeywords = keywords.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .limit(10)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("keyword", e.getKey());
                    map.put("count", e.getValue());
                    return map;
                })
                .collect(Collectors.toList());

        analytics.put("topKeywords", topKeywords);

        // No result queries
        List<String> noResults = logs.stream()
                .filter(l -> l.getResultCount() == 0 && l.getQuery() != null && !l.getQuery().isEmpty())
                .map(SearchAuditLog::getQuery)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
        analytics.put("noResultQueries", noResults);

        return analytics;
    }
}
