package com.lazaroph.repository;

import com.lazaroph.model.*;
import com.lazaroph.util.PasswordHasher;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class DataStore {
    private static final DataStore INSTANCE = new DataStore();

    public static DataStore getInstance() {
        return INSTANCE;
    }

    private final AtomicInteger userIdSeq = new AtomicInteger(10);
    private final AtomicInteger productIdSeq = new AtomicInteger(20);
    private final AtomicInteger variantIdSeq = new AtomicInteger(100);
    private final AtomicInteger imageIdSeq = new AtomicInteger(50);
    private final AtomicInteger categoryIdSeq = new AtomicInteger(10);
    private final AtomicInteger brandIdSeq = new AtomicInteger(10);
    private final AtomicInteger cartIdSeq = new AtomicInteger(10);
    private final AtomicInteger cartItemIdSeq = new AtomicInteger(50);
    private final AtomicInteger orderIdSeq = new AtomicInteger(10);
    private final AtomicInteger orderItemIdSeq = new AtomicInteger(50);
    private final AtomicInteger customOrderIdSeq = new AtomicInteger(10);

    private final Map<Integer, User> users = new ConcurrentHashMap<>();
    private final Map<Integer, Category> categories = new ConcurrentHashMap<>();
    private final Map<Integer, Brand> brands = new ConcurrentHashMap<>();
    private final Map<Integer, Product> products = new ConcurrentHashMap<>();
    private final Map<Integer, ProductVariant> variants = new ConcurrentHashMap<>();
    private final Map<Integer, ProductImage> images = new ConcurrentHashMap<>();
    private final Map<String, Integer> cartSessions = new ConcurrentHashMap<>(); // sessionId/userId -> cartId
    private final Map<Integer, List<CartItem>> cartItems = new ConcurrentHashMap<>(); // cartId -> items
    private final Map<Integer, Order> orders = new ConcurrentHashMap<>();
    private final Map<Integer, CustomOrder> customOrders = new ConcurrentHashMap<>();
    private final Map<Integer, Set<Integer>> wishlists = new ConcurrentHashMap<>(); // userId -> Set of productIds
    private final Map<String, User> sessionTokens = new ConcurrentHashMap<>();
    private final Map<String, String> storeSettings = new ConcurrentHashMap<>();

    private DataStore() {
        seedInitialData();
    }

    private void seedInitialData() {
        // Users: Admin & Customer
        User admin = new User(1, "LAZAROPH Administrator", "admin@lazaroph.com", PasswordHasher.hashPassword("admin123"), "ADMIN", "282948572", "911 J.P. Rizal Street, Concepcion Uno", "Marikina", "Metro Manila", "1805");
        admin.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        users.put(admin.getId(), admin);

        User customer = new User(2, "Juan Dela Cruz", "customer@example.com", PasswordHasher.hashPassword("customer123"), "CUSTOMER", "09171234567", "32 F. E. Mendoza Street, Malanday", "Marikina", "Metro Manila", "1805");
        customer.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        users.put(customer.getId(), customer);

        // Store Settings
        storeSettings.put("adminPhone", "282948572");
        storeSettings.put("storePhone", "282948572");
        storeSettings.put("storeEmail", "lazarophilippines20@gmail.com");
        storeSettings.put("gcashNumber", "0917-282-9485");
        storeSettings.put("gcashName", "LAZAROPH PHILIPPINES");
        storeSettings.put("gcashQrUrl", "/images/qr-gcash-demo.png");
        storeSettings.put("mayaNumber", "0917-282-9485");
        storeSettings.put("mayaName", "LAZAROPH PHILIPPINES");
        storeSettings.put("mayaQrUrl", "/images/qr-maya-demo.png");
        storeSettings.put("bankQrUrl", "");
        storeSettings.put("bdoAccount", "0012-3456-7890 (Lazaro PH)");
        storeSettings.put("bpiAccount", "9876-5432-10 (Lazaro PH)");
        storeSettings.put("branch1Address", "911 J.P. Rizal Street, Concepcion Uno, Marikina, 1805 Metro Manila");
        storeSettings.put("branch2Address", "32 F. E. Mendoza Street, Malanday, Marikina, 1805 Metro Manila");

        // Categories
        Category catShoes = new Category(1, "Shoes", "shoes", "Men's, women's, and kids' performance, lifestyle, and streetwear sneakers.", "/images/category-shoes.jpg");
        Category catApparel = new Category(2, "Apparel", "apparel", "T-shirts, hoodies, performance shorts, training gear, and sportswear.", "/images/category-apparel.jpg");
        Category catSlides = new Category(3, "Slides", "slides", "Authentic athletic slides, recovery slide sandals, and lifestyle comfort footwear.", "/images/cat-slides.png");
        Category catWatches = new Category(4, "Watches", "watches", "Authentic sports, digital, classic, and chronograph timepieces.", "/images/category-watches.jpg");

        categories.put(1, catShoes);
        categories.put(2, catApparel);
        categories.put(3, catSlides);
        categories.put(4, catWatches);

        // Brands (Nike and Adidas default active brands)
        Brand bNike = new Brand(1, "Nike", "nike", "/images/brand-nike.png", "World-renowned athletic sportswear, signature sneakers, and performance apparel.", "ACTIVE");
        Brand bAdidas = new Brand(2, "Adidas", "adidas", "/images/brand-adidas.png", "Iconic 3-stripes sportswear, Originals lifestyle kicks, and boost comfort.", "ACTIVE");

        brands.put(1, bNike);
        brands.put(2, bAdidas);

        // Product 1: LAZAROPH Runner X1 (Men's Running Shoes)
        Product p1 = new Product();
        p1.setId(1);
        p1.setName("LAZAROPH Runner X1");
        p1.setSku("LZPH-SH-RUN01");
        p1.setDescription("High-performance men's running shoes engineered for explosive responsiveness, breathability, and all-day pavement endurance. Crafted with authentic premium components.");
        p1.setFeatures("Responsive CloudFoam midsole\nEngineered dual-layer mesh upper\nReinforced heel stabilizer\nHigh-traction rubber outsole");
        p1.setMaterials("Breathable knit mesh, EVA foam midsole, High-density carbon rubber sole");
        p1.setCareInstructions("Wipe with damp cloth and gentle soap. Air dry away from direct heat.");
        p1.setPrice(new BigDecimal("2499.00"));
        p1.setDiscountPrice(new BigDecimal("2199.00"));
        p1.setCategoryId(1);
        p1.setCategoryName("Shoes");
        p1.setSubcategory("Running Shoes");
        p1.setBrandId(1);
        p1.setBrandName("Nike");
        p1.setGender("MEN");
        p1.setSizeType("US_MEN_SHOES");
        p1.setStatus("ACTIVE");
        p1.setFeatured(true);
        p1.setNewArrival(true);
        p1.setSale(true);
        p1.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p1, "/images/runner-x1-black-main.png", true, 1);
        addImage(p1, "/images/runner-x1-black-side.png", false, 2);
        addImage(p1, "/images/runner-x1-black-sole.png", false, 3);

        addVariant(p1, "US 7", "Triple Black", "#111111", 5, new BigDecimal("2499.00"), "LZPH-SH-RUN01-7-BLK");
        addVariant(p1, "US 7.5", "Triple Black", "#111111", 8, new BigDecimal("2499.00"), "LZPH-SH-RUN01-7.5-BLK");
        addVariant(p1, "US 8", "Triple Black", "#111111", 12, new BigDecimal("2499.00"), "LZPH-SH-RUN01-8-BLK");
        addVariant(p1, "US 8.5", "Triple Black", "#111111", 10, new BigDecimal("2499.00"), "LZPH-SH-RUN01-8.5-BLK");
        addVariant(p1, "US 9", "Triple Black", "#111111", 15, new BigDecimal("2499.00"), "LZPH-SH-RUN01-9-BLK");
        addVariant(p1, "US 9.5", "Triple Black", "#111111", 7, new BigDecimal("2499.00"), "LZPH-SH-RUN01-9.5-BLK");
        addVariant(p1, "US 10", "Triple Black", "#111111", 20, new BigDecimal("2499.00"), "LZPH-SH-RUN01-10-BLK");
        addVariant(p1, "US 10.5", "Triple Black", "#111111", 9, new BigDecimal("2499.00"), "LZPH-SH-RUN01-10.5-BLK");
        addVariant(p1, "US 11", "Triple Black", "#111111", 6, new BigDecimal("2499.00"), "LZPH-SH-RUN01-11-BLK");

        addVariant(p1, "US 8", "Ghost White", "#f0f0f0", 8, new BigDecimal("2499.00"), "LZPH-SH-RUN01-8-WHT");
        addVariant(p1, "US 8.5", "Ghost White", "#f0f0f0", 10, new BigDecimal("2499.00"), "LZPH-SH-RUN01-8.5-WHT");
        addVariant(p1, "US 9", "Ghost White", "#f0f0f0", 12, new BigDecimal("2499.00"), "LZPH-SH-RUN01-9-WHT");
        addVariant(p1, "US 9.5", "Ghost White", "#f0f0f0", 5, new BigDecimal("2499.00"), "LZPH-SH-RUN01-9.5-WHT");
        addVariant(p1, "US 10", "Ghost White", "#f0f0f0", 14, new BigDecimal("2499.00"), "LZPH-SH-RUN01-10-WHT");
        products.put(p1.getId(), p1);

        // Product 2: LAZAROPH Street Classic (Women's Lifestyle Shoes)
        Product p2 = new Product();
        p2.setId(2);
        p2.setName("LAZAROPH Street Classic");
        p2.setSku("LZPH-SH-STR01");
        p2.setDescription("Iconic minimalist street sneaker built with supple vegan leather, timeless silhouette, and padded memory foam collar for modern everyday aesthetics.");
        p2.setFeatures("Minimalist silhouette\nPadded ankle collar\nShock-absorbing cushioned footbed\nNon-marking cupsole");
        p2.setMaterials("Premium synthetic leather, Recycled textile lining, Vulcanized rubber sole");
        p2.setCareInstructions("Clean with soft brush or leather wipes. Do not machine wash.");
        p2.setPrice(new BigDecimal("2299.00"));
        p2.setCategoryId(1);
        p2.setCategoryName("Shoes");
        p2.setSubcategory("Sneakers");
        p2.setBrandId(2);
        p2.setBrandName("Adidas");
        p2.setGender("WOMEN");
        p2.setSizeType("US_WOMEN_SHOES");
        p2.setStatus("ACTIVE");
        p2.setFeatured(true);
        p2.setNewArrival(true);
        p2.setSale(false);
        p2.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p2, "/images/street-classic-white-main.png", true, 1);
        addImage(p2, "/images/street-classic-white-angle.png", false, 2);

        addVariant(p2, "US 5", "Pure White", "#ffffff", 4, new BigDecimal("2299.00"), "LZPH-SH-STR01-5-WHT");
        addVariant(p2, "US 5.5", "Pure White", "#ffffff", 6, new BigDecimal("2299.00"), "LZPH-SH-STR01-5.5-WHT");
        addVariant(p2, "US 6", "Pure White", "#ffffff", 10, new BigDecimal("2299.00"), "LZPH-SH-STR01-6-WHT");
        addVariant(p2, "US 6.5", "Pure White", "#ffffff", 8, new BigDecimal("2299.00"), "LZPH-SH-STR01-6.5-WHT");
        addVariant(p2, "US 7", "Pure White", "#ffffff", 14, new BigDecimal("2299.00"), "LZPH-SH-STR01-7-WHT");
        addVariant(p2, "US 7.5", "Pure White", "#ffffff", 9, new BigDecimal("2299.00"), "LZPH-SH-STR01-7.5-WHT");
        addVariant(p2, "US 8", "Pure White", "#ffffff", 11, new BigDecimal("2299.00"), "LZPH-SH-STR01-8-WHT");
        addVariant(p2, "US 8.5", "Pure White", "#ffffff", 5, new BigDecimal("2299.00"), "LZPH-SH-STR01-8.5-WHT");
        addVariant(p2, "US 9", "Pure White", "#ffffff", 3, new BigDecimal("2299.00"), "LZPH-SH-STR01-9-WHT");
        products.put(p2.getId(), p2);

        // Product 3: LAZAROPH Junior Sprint (Kids' Sports Shoes)
        Product p3 = new Product();
        p3.setId(3);
        p3.setName("LAZAROPH Junior Sprint");
        p3.setSku("LZPH-SH-JNR01");
        p3.setDescription("Lightweight, durable athletic footwear crafted for active kids, featuring secure lock-down strap and flex-groove sole for high agility.");
        p3.setFeatures("Easy lock-down velcro strap\nFlexible outsole with multi-directional grip\nReinforced toe bumper for durability\nUltra-lightweight mesh");
        p3.setMaterials("Air-flow synthetic mesh, Phylon lightweight midsole, Rubber traction pods");
        p3.setCareInstructions("Hand wash cold with mild detergent. Remove insole before washing.");
        p3.setPrice(new BigDecimal("1799.00"));
        p3.setDiscountPrice(new BigDecimal("1499.00"));
        p3.setCategoryId(1);
        p3.setCategoryName("Shoes");
        p3.setSubcategory("Kids Shoes");
        p3.setBrandId(1);
        p3.setBrandName("Nike");
        p3.setGender("KIDS");
        p3.setSizeType("US_KIDS_SHOES");
        p3.setStatus("ACTIVE");
        p3.setFeatured(false);
        p3.setNewArrival(true);
        p3.setSale(true);
        p3.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p3, "/images/junior-sprint-blue-main.png", true, 1);

        addVariant(p3, "US 1Y", "Electric Blue", "#0070f3", 6, new BigDecimal("1799.00"), "LZPH-SH-JNR01-1Y-BLU");
        addVariant(p3, "US 2Y", "Electric Blue", "#0070f3", 8, new BigDecimal("1799.00"), "LZPH-SH-JNR01-2Y-BLU");
        addVariant(p3, "US 3Y", "Electric Blue", "#0070f3", 10, new BigDecimal("1799.00"), "LZPH-SH-JNR01-3Y-BLU");
        addVariant(p3, "US 4Y", "Electric Blue", "#0070f3", 7, new BigDecimal("1799.00"), "LZPH-SH-JNR01-4Y-BLU");
        addVariant(p3, "US 5Y", "Electric Blue", "#0070f3", 5, new BigDecimal("1799.00"), "LZPH-SH-JNR01-5Y-BLU");
        products.put(p3.getId(), p3);

        // Product 4: LAZAROPH Performance Tee
        Product p4 = new Product();
        p4.setId(4);
        p4.setName("LAZAROPH Performance Tee");
        p4.setSku("LZPH-AP-TEE01");
        p4.setDescription("Signature moisture-wicking athletic tee built with 4-way stretch fabric for intense workouts, basketball training, and lifestyle comfort.");
        p4.setFeatures("DryVent moisture-wicking technology\n4-way stretch ergonomic fit\nAnti-odor antimicrobial finish\nTagless comfort collar");
        p4.setMaterials("88% Polyester, 12% Spandex Quick-Dry Blend");
        p4.setCareInstructions("Machine wash cold with like colors. Do not bleach. Tumble dry low.");
        p4.setPrice(new BigDecimal("799.00"));
        p4.setDiscountPrice(new BigDecimal("699.00"));
        p4.setCategoryId(2);
        p4.setCategoryName("Apparel");
        p4.setSubcategory("T-Shirts");
        p4.setBrandId(2);
        p4.setBrandName("Adidas");
        p4.setGender("MEN");
        p4.setSizeType("APPAREL");
        p4.setStatus("ACTIVE");
        p4.setFeatured(true);
        p4.setNewArrival(true);
        p4.setSale(true);
        p4.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p4, "/images/perf-tee-black-main.png", true, 1);

        addVariant(p4, "XS", "Stealth Black", "#151515", 8, new BigDecimal("799.00"), "LZPH-AP-TEE01-XS-BLK");
        addVariant(p4, "S", "Stealth Black", "#151515", 18, new BigDecimal("799.00"), "LZPH-AP-TEE01-S-BLK");
        addVariant(p4, "M", "Stealth Black", "#151515", 25, new BigDecimal("799.00"), "LZPH-AP-TEE01-M-BLK");
        addVariant(p4, "L", "Stealth Black", "#151515", 30, new BigDecimal("799.00"), "LZPH-AP-TEE01-L-BLK");
        addVariant(p4, "XL", "Stealth Black", "#151515", 16, new BigDecimal("799.00"), "LZPH-AP-TEE01-XL-BLK");
        addVariant(p4, "XXL", "Stealth Black", "#151515", 7, new BigDecimal("799.00"), "LZPH-AP-TEE01-XXL-BLK");

        addVariant(p4, "M", "Charcoal Gray", "#333333", 15, new BigDecimal("799.00"), "LZPH-AP-TEE01-M-GRY");
        addVariant(p4, "L", "Charcoal Gray", "#333333", 20, new BigDecimal("799.00"), "LZPH-AP-TEE01-L-GRY");
        products.put(p4.getId(), p4);

        // Product 5: LAZAROPH Training Shorts
        Product p5 = new Product();
        p5.setId(5);
        p5.setName("LAZAROPH Training Shorts");
        p5.setSku("LZPH-AP-SHT01");
        p5.setDescription("Multi-sport athletic shorts with dual deep zip pockets, elastic drawcord waistband, and split-hem agility cut.");
        p5.setFeatures("Deep zippered side security pockets\nBuilt-in breathable compression liner\nReflective LAZAROPH branding\nElastic drawcord waistband");
        p5.setMaterials("92% Micro-polyester, 8% Elastane with water-resistant coating");
        p5.setCareInstructions("Machine wash cold inside out. Hang dry recommended.");
        p5.setPrice(new BigDecimal("699.00"));
        p5.setCategoryId(2);
        p5.setCategoryName("Apparel");
        p5.setSubcategory("Shorts");
        p5.setBrandId(2);
        p5.setBrandName("Adidas");
        p5.setGender("MEN");
        p5.setSizeType("APPAREL");
        p5.setStatus("ACTIVE");
        p5.setFeatured(false);
        p5.setNewArrival(false);
        p5.setSale(false);
        p5.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p5, "/images/train-shorts-gray-main.png", true, 1);

        addVariant(p5, "S", "Slate Gray", "#4a5568", 12, new BigDecimal("699.00"), "LZPH-AP-SHT01-S-GRY");
        addVariant(p5, "M", "Slate Gray", "#4a5568", 22, new BigDecimal("699.00"), "LZPH-AP-SHT01-M-GRY");
        addVariant(p5, "L", "Slate Gray", "#4a5568", 25, new BigDecimal("699.00"), "LZPH-AP-SHT01-L-GRY");
        addVariant(p5, "XL", "Slate Gray", "#4a5568", 14, new BigDecimal("699.00"), "LZPH-AP-SHT01-XL-GRY");
        addVariant(p5, "XXL", "Slate Gray", "#4a5568", 6, new BigDecimal("699.00"), "LZPH-AP-SHT01-XXL-GRY");
        products.put(p5.getId(), p5);

        // Product 6: LAZAROPH Performance Jersey
        Product p6 = new Product();
        p6.setId(6);
        p6.setName("LAZAROPH Performance Jersey");
        p6.setSku("LZPH-AP-JSY01");
        p6.setDescription("Breathable pro-cut sleeveless athletic jersey with reinforced side mesh panels and lightweight drape.");
        p6.setFeatures("Pro-cut athletic sleeveless silhouette\nLaser-perforated ventilation panels\nSublimated fade-resistant graphics\nComfort stretch rib collar");
        p6.setMaterials("100% High-Grade Birdseye Mesh Polyester");
        p6.setCareInstructions("Machine wash gentle cycle. Do not iron directly on graphics.");
        p6.setPrice(new BigDecimal("899.00"));
        p6.setCategoryId(2);
        p6.setCategoryName("Apparel");
        p6.setSubcategory("Sportswear");
        p6.setBrandId(1);
        p6.setBrandName("Nike");
        p6.setGender("UNISEX");
        p6.setSizeType("APPAREL");
        p6.setStatus("ACTIVE");
        p6.setFeatured(true);
        p6.setNewArrival(true);
        p6.setSale(false);
        p6.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p6, "/images/perf-jersey-black-main.png", true, 1);

        addVariant(p6, "S", "Obsidian Black", "#111111", 10, new BigDecimal("899.00"), "LZPH-AP-JSY01-S-BLK");
        addVariant(p6, "M", "Obsidian Black", "#111111", 20, new BigDecimal("899.00"), "LZPH-AP-JSY01-M-BLK");
        addVariant(p6, "L", "Obsidian Black", "#111111", 25, new BigDecimal("899.00"), "LZPH-AP-JSY01-L-BLK");
        addVariant(p6, "XL", "Obsidian Black", "#111111", 12, new BigDecimal("899.00"), "LZPH-AP-JSY01-XL-BLK");
        products.put(p6.getId(), p6);

        // Product 7: LAZAROPH Classic Time 01 (Watch)
        Product p7 = new Product();
        p7.setId(7);
        p7.setName("LAZAROPH Classic Time 01");
        p7.setSku("LZPH-WT-CLS01");
        p7.setDescription("Sophisticated analog watch featuring a brushed stainless steel case, minimalist date display, and genuine leather strap.");
        p7.setFeatures("Japanese Quartz precision movement\nHardened mineral crystal glass\n50m water resistance (5 ATM)\nQuick-release leather band");
        p7.setMaterials("316L Stainless steel case, Genuine top-grain leather strap, Mineral crystal");
        p7.setCareInstructions("Wipe with microfiber cloth. Avoid exposure to extreme heat and harsh chemicals.");
        p7.setPrice(new BigDecimal("1999.00"));
        p7.setCategoryId(4);
        p7.setCategoryName("Watches");
        p7.setSubcategory("Classic Watches");
        p7.setBrandId(1);
        p7.setBrandName("Nike");
        p7.setGender("MEN");
        p7.setSizeType("NO_SIZE");
        p7.setStatus("ACTIVE");
        p7.setFeatured(true);
        p7.setNewArrival(false);
        p7.setSale(false);
        p7.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p7, "/images/classic-time-black-main.png", true, 1);

        addVariant(p7, "One Size", "Silver & Leather", "#888888", 15, new BigDecimal("1999.00"), "LZPH-WT-CLS01-SLV");
        products.put(p7.getId(), p7);

        // Product 8: LAZAROPH Sport Digital 01 (Watch)
        Product p8 = new Product();
        p8.setId(8);
        p8.setName("LAZAROPH Sport Digital 01");
        p8.setSku("LZPH-WT-DIG01");
        p8.setDescription("Rugged tactical digital sports watch with backlight, 1/100s stopwatch, dual time zones, countdown timer, and shock resistance.");
        p8.setFeatures("High-contrast digital LCD with EL backlight\n100m Water resistance (10 ATM)\nShock and vibration resistant casing\nDaily alarm & hourly time signal");
        p8.setMaterials("High-impact resin case, Stainless steel back, Flexible silicone strap");
        p8.setCareInstructions("Rinse with fresh water after saltwater exposure.");
        p8.setPrice(new BigDecimal("2299.00"));
        p8.setDiscountPrice(new BigDecimal("1999.00"));
        p8.setCategoryId(4);
        p8.setCategoryName("Watches");
        p8.setSubcategory("Sports Watches");
        p8.setBrandId(2);
        p8.setBrandName("Adidas");
        p8.setGender("UNISEX");
        p8.setSizeType("NO_SIZE");
        p8.setStatus("ACTIVE");
        p8.setFeatured(true);
        p8.setNewArrival(true);
        p8.setSale(true);
        p8.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p8, "/images/sport-digital-stealth-main.png", true, 1);

        addVariant(p8, "One Size", "Matte Tactical Black", "#222222", 25, new BigDecimal("2299.00"), "LZPH-WT-DIG01-BLK");
        addVariant(p8, "One Size", "Military Olive", "#4b5320", 12, new BigDecimal("2299.00"), "LZPH-WT-DIG01-OLV");
        products.put(p8.getId(), p8);

        // Product 9: LAZAROPH Comfort Slide X1
        Product p9 = new Product();
        p9.setId(9);
        p9.setName("LAZAROPH Comfort Slide X1");
        p9.setSku("LZPH-SLD-CMF01");
        p9.setDescription("Ultra-cushioned athletic slide sandal with ergonomic contoured footbed, water-resistant wide strap, and shock-absorbing CloudFoam sole.");
        p9.setFeatures("Ergonomic textured footbed\nPadded wide synthetic leather strap\nHigh-density CloudFoam sole\nAnti-slip textured traction tread");
        p9.setMaterials("EVA CloudFoam footbed, Synthetic leather strap with soft foam padding");
        p9.setCareInstructions("Wipe with clean damp cloth. Air dry away from direct sunlight.");
        p9.setPrice(new BigDecimal("1499.00"));
        p9.setCategoryId(3);
        p9.setCategoryName("Slides");
        p9.setSubcategory("Athletic Slides");
        p9.setBrandId(1);
        p9.setBrandName("Nike");
        p9.setGender("UNISEX");
        p9.setSizeType("US_MEN_SHOES");
        p9.setStatus("ACTIVE");
        p9.setFeatured(true);
        p9.setNewArrival(true);
        p9.setSale(true);
        p9.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        addImage(p9, "/images/slide-comfort-x1.png", true, 1);

        addVariant(p9, "US 6", "Matte Black", "#000000", 15, new BigDecimal("1499.00"), "LZPH-SLD-CMF01-6-BLK");
        addVariant(p9, "US 7", "Matte Black", "#000000", 18, new BigDecimal("1499.00"), "LZPH-SLD-CMF01-7-BLK");
        addVariant(p9, "US 8", "Matte Black", "#000000", 25, new BigDecimal("1499.00"), "LZPH-SLD-CMF01-8-BLK");
        addVariant(p9, "US 9", "Matte Black", "#000000", 30, new BigDecimal("1499.00"), "LZPH-SLD-CMF01-9-BLK");
        addVariant(p9, "US 10", "Matte Black", "#000000", 35, new BigDecimal("1499.00"), "LZPH-SLD-CMF01-10-BLK");
        addVariant(p9, "US 11", "Matte Black", "#000000", 20, new BigDecimal("1499.00"), "LZPH-SLD-CMF01-11-BLK");
        addVariant(p9, "US 12", "Matte Black", "#000000", 12, new BigDecimal("1499.00"), "LZPH-SLD-CMF01-12-BLK");
        products.put(p9.getId(), p9);

        // Seed Sample Orders for Admin Statistics
        seedSampleOrders();
    }

    private void seedSampleOrders() {
        Order o1 = new Order();
        o1.setId(1);
        o1.setOrderNumber("LZPH-20260815-0001");
        o1.setUserId(2);
        o1.setCustomerName("Juan Dela Cruz");
        o1.setCustomerEmail("customer@example.com");
        o1.setCustomerPhone("09171234567");
        o1.setShippingAddress("32 F. E. Mendoza Street, Malanday");
        o1.setShippingCity("Marikina");
        o1.setShippingProvince("Metro Manila");
        o1.setShippingZip("1805");
        o1.setPaymentMethod("GCash (E-Wallet)");
        o1.setPaymentReference("GCASH-9823419082");
        o1.setSubtotal(new BigDecimal("4998.00"));
        o1.setShippingFee(new BigDecimal("150.00"));
        o1.setTotal(new BigDecimal("5148.00"));
        o1.setStatus("SHIPPED");
        o1.setCreatedAt(new Timestamp(System.currentTimeMillis() - 172800000L));

        OrderItem oi1 = new OrderItem(1, 1, 1, 107, "LAZAROPH Runner X1", "US 10", "Triple Black", new BigDecimal("2499.00"), 2, new BigDecimal("4998.00"), null);
        o1.getItems().add(oi1);
        orders.put(o1.getId(), o1);

        Order o2 = new Order();
        o2.setId(2);
        o2.setOrderNumber("LZPH-20260816-0002");
        o2.setUserId(2);
        o2.setCustomerName("Juan Dela Cruz");
        o2.setCustomerEmail("customer@example.com");
        o2.setCustomerPhone("09171234567");
        o2.setShippingAddress("32 F. E. Mendoza Street, Malanday");
        o2.setShippingCity("Marikina");
        o2.setShippingProvince("Metro Manila");
        o2.setShippingZip("1805");
        o2.setPaymentMethod("Maya (PayMaya)");
        o2.setPaymentReference("MAYA-8812049123");
        o2.setSubtotal(new BigDecimal("2499.00"));
        o2.setShippingFee(new BigDecimal("150.00"));
        o2.setTotal(new BigDecimal("2649.00"));
        o2.setStatus("CONFIRMED");
        o2.setCreatedAt(new Timestamp(System.currentTimeMillis() - 86400000L));

        OrderItem oi2 = new OrderItem(2, 2, 1, 105, "LAZAROPH Runner X1", "US 9", "Triple Black", new BigDecimal("2499.00"), 1, new BigDecimal("2499.00"), null);
        o2.getItems().add(oi2);
        orders.put(o2.getId(), o2);

        Order o3 = new Order();
        o3.setId(3);
        o3.setOrderNumber("LZPH-20260817-0003");
        o3.setUserId(null);
        o3.setCustomerName("Maria Santos");
        o3.setCustomerEmail("maria.santos@gmail.com");
        o3.setCustomerPhone("09189876543");
        o3.setShippingAddress("124 Tuazon Blvd");
        o3.setShippingCity("Marikina");
        o3.setShippingProvince("Metro Manila");
        o3.setShippingZip("1800");
        o3.setPaymentMethod("Online Bank Transfer (BDO)");
        o3.setPaymentReference("BDO-REF-44910283");
        o3.setSubtotal(new BigDecimal("1199.00"));
        o3.setShippingFee(new BigDecimal("150.00"));
        o3.setTotal(new BigDecimal("1349.00"));
        o3.setStatus("PENDING");
        o3.setCreatedAt(new Timestamp(System.currentTimeMillis() - 14400000L));

        OrderItem oi3 = new OrderItem(3, 3, 9, 36, "LAZAROPH Pro Elite Custom Jersey", "L", "Custom Sublimation", new BigDecimal("1199.00"), 1, new BigDecimal("1199.00"), "{\"name\":\"DELA CRUZ\",\"number\":\"24\",\"team\":\"MANILA KINGS\"}");
        o3.getItems().add(oi3);
        orders.put(o3.getId(), o3);

        CustomOrder co = new CustomOrder();
        co.setId(1);
        co.setOrderId(3);
        co.setOrderItemId(3);
        co.setOrderNumber(o3.getOrderNumber());
        co.setCustomerName(o3.getCustomerName());
        co.setCustomerEmail(o3.getCustomerEmail());
        co.setJerseyName("DELA CRUZ");
        co.setJerseyNumber("24");
        co.setTeamName("MANILA KINGS");
        co.setSize("L");
        co.setColor("Gold & Black");
        co.setJerseyDesign("Pro Elite Basketball Pattern");
        co.setCustomizationNotes("Please put 'KINGS' arched on front chest and small Philippine flag on back nape.");
        co.setStatus("PENDING_DESIGN");
        co.setCreatedAt(new Timestamp(System.currentTimeMillis() - 14400000L));
        customOrders.put(co.getId(), co);
    }

    private void addImage(Product p, String url, boolean isMain, int order) {
        int id = imageIdSeq.incrementAndGet();
        ProductImage img = new ProductImage(id, p.getId(), url, isMain, order);
        images.put(id, img);
        p.getImages().add(img);
    }

    private void addVariant(Product p, String size, String color, String hex, int stock, BigDecimal price, String sku) {
        int id = variantIdSeq.incrementAndGet();
        ProductVariant v = new ProductVariant(id, p.getId(), size, color, hex, stock, price, sku);
        variants.put(id, v);
        p.getVariants().add(v);
    }

    // USER OPERATIONS
    public User findUserByEmail(String email) {
        if (email == null) return null;
        for (User u : users.values()) {
            if (email.equalsIgnoreCase(u.getEmail())) return u;
        }
        return null;
    }

    public User findUserById(int id) {
        return users.get(id);
    }

    public User saveUser(User u) {
        if (u.getId() <= 0) {
            u.setId(userIdSeq.incrementAndGet());
            u.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        }
        users.put(u.getId(), u);
        return u;
    }

    public List<User> getAllUsers() {
        return new ArrayList<>(users.values());
    }

    // CATEGORY OPERATIONS
    public List<Category> getAllCategories() {
        return new ArrayList<>(categories.values());
    }

    // PRODUCT OPERATIONS
    public List<Product> getAllProducts(boolean activeOnly) {
        List<Product> list = new ArrayList<>();
        for (Product p : products.values()) {
            if (!activeOnly || "ACTIVE".equalsIgnoreCase(p.getStatus())) {
                list.add(p);
            }
        }
        // Sort newest first
        list.sort((a, b) -> b.getId() - a.getId());
        return list;
    }

    public Product findProductById(int id) {
        return products.get(id);
    }

    public Product findProductBySku(String sku) {
        if (sku == null) return null;
        for (Product p : products.values()) {
            if (sku.equalsIgnoreCase(p.getSku())) return p;
        }
        return null;
    }

    public Product saveProduct(Product p) {
        if (p.getId() <= 0) {
            p.setId(productIdSeq.incrementAndGet());
            p.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        }
        
        // Link Category and Brand names
        if (p.getCategoryId() > 0 && categories.containsKey(p.getCategoryId())) {
            p.setCategoryName(categories.get(p.getCategoryId()).getName());
        }
        if (p.getBrandId() > 0 && brands.containsKey(p.getBrandId())) {
            p.setBrandName(brands.get(p.getBrandId()).getName());
        }

        products.put(p.getId(), p);
        return p;
    }

    public boolean deleteProduct(int id) {
        Product p = products.remove(id);
        if (p != null) {
            // Remove associated variants and images
            variants.entrySet().removeIf(e -> e.getValue().getProductId() == id);
            images.entrySet().removeIf(e -> e.getValue().getProductId() == id);
            return true;
        }
        return false;
    }

    // VARIANT OPERATIONS & ATOMIC STOCK DECREMENT
    public ProductVariant findVariantById(int id) {
        return variants.get(id);
    }

    public ProductVariant saveVariant(ProductVariant v) {
        if (v.getId() <= 0) {
            v.setId(variantIdSeq.incrementAndGet());
        }
        variants.put(v.getId(), v);
        Product p = products.get(v.getProductId());
        if (p != null) {
            p.getVariants().removeIf(existing -> existing.getId() == v.getId());
            p.getVariants().add(v);
        }
        return v;
    }

    public synchronized boolean decrementVariantStock(int variantId, int quantityToDeduct) {
        ProductVariant v = variants.get(variantId);
        if (v == null) return false;
        if (v.getStock() < quantityToDeduct) return false;

        v.setStock(v.getStock() - quantityToDeduct);
        return true;
    }

    public synchronized void updateVariantStock(int variantId, int newStock) {
        ProductVariant v = variants.get(variantId);
        if (v != null) {
            v.setStock(Math.max(0, newStock));
        }
    }

    // CART OPERATIONS
    public synchronized int getOrCreateCartId(String sessionKey) {
        Integer cartId = cartSessions.get(sessionKey);
        if (cartId == null) {
            cartId = cartIdSeq.incrementAndGet();
            cartSessions.put(sessionKey, cartId);
            cartItems.put(cartId, new ArrayList<>());
        }
        return cartId;
    }

    public List<CartItem> getCartItems(String sessionKey) {
        int cartId = getOrCreateCartId(sessionKey);
        return cartItems.getOrDefault(cartId, new ArrayList<>());
    }

    public synchronized void addCartItem(String sessionKey, int productId, int variantId, int quantity, String customizationData) {
        int cartId = getOrCreateCartId(sessionKey);
        List<CartItem> items = cartItems.computeIfAbsent(cartId, k -> new ArrayList<>());

        Product p = products.get(productId);
        ProductVariant v = variants.get(variantId);
        if (p == null || v == null) return;

        // Check if matching item (and customization) exists
        CartItem existing = null;
        for (CartItem item : items) {
            if (item.getProductId() == productId && item.getVariantId() == variantId) {
                if (customizationData == null && item.getCustomizationData() == null) {
                    existing = item;
                    break;
                } else if (customizationData != null && customizationData.equals(item.getCustomizationData())) {
                    existing = item;
                    break;
                }
            }
        }

        BigDecimal effectivePrice = p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getPrice();
        if (v.getPrice() != null) {
            effectivePrice = v.getPrice();
        }

        if (existing != null) {
            int newQty = existing.getQuantity() + quantity;
            if (newQty <= v.getStock()) {
                existing.setQuantity(newQty);
            }
        } else {
            CartItem ci = new CartItem();
            ci.setId(cartItemIdSeq.incrementAndGet());
            ci.setCartId(cartId);
            ci.setProductId(productId);
            ci.setVariantId(variantId);
            ci.setProductName(p.getName());
            ci.setImageUrl(p.getMainImageUrl());
            ci.setSize(v.getSize());
            ci.setColor(v.getColor());
            ci.setQuantity(Math.min(quantity, v.getStock()));
            ci.setPrice(effectivePrice);
            ci.setStockAvailable(v.getStock());
            ci.setCustomizationData(customizationData);
            items.add(ci);
        }
    }

    public synchronized void updateCartItemQuantity(String sessionKey, int cartItemId, int quantity) {
        int cartId = getOrCreateCartId(sessionKey);
        List<CartItem> items = cartItems.get(cartId);
        if (items != null) {
            if (quantity <= 0) {
                items.removeIf(item -> item.getId() == cartItemId);
            } else {
                for (CartItem item : items) {
                    if (item.getId() == cartItemId) {
                        ProductVariant v = variants.get(item.getVariantId());
                        int max = v != null ? v.getStock() : quantity;
                        item.setQuantity(Math.min(quantity, max));
                        break;
                    }
                }
            }
        }
    }

    public synchronized void removeCartItem(String sessionKey, int cartItemId) {
        int cartId = getOrCreateCartId(sessionKey);
        List<CartItem> items = cartItems.get(cartId);
        if (items != null) {
            items.removeIf(item -> item.getId() == cartItemId);
        }
    }

    public synchronized void clearCart(String sessionKey) {
        int cartId = getOrCreateCartId(sessionKey);
        cartItems.put(cartId, new ArrayList<>());
    }

    // ORDER OPERATIONS
    public synchronized Order createOrder(Order order) {
        order.setId(orderIdSeq.incrementAndGet());
        
        // Generate Unique Order ID: LZPH-YYYYMMDD-XXXX
        String dateStr = new SimpleDateFormat("yyyyMMdd").format(new Date());
        String formattedNumber = String.format("LZPH-%s-%04d", dateStr, order.getId());
        order.setOrderNumber(formattedNumber);
        order.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        for (OrderItem oi : order.getItems()) {
            oi.setId(orderItemIdSeq.incrementAndGet());
            oi.setOrderId(order.getId());

            // ATOMIC STOCK DECREMENT FOR SPECIFIC SIZE VARIANT
            decrementVariantStock(oi.getVariantId(), oi.getQuantity());

            // If customized item, create CustomOrder tracking entry
            if (oi.getCustomizationData() != null && !oi.getCustomizationData().trim().isEmpty()) {
                createCustomOrderFromItem(order, oi);
            }
        }

        orders.put(order.getId(), order);
        return order;
    }

    private void createCustomOrderFromItem(Order order, OrderItem item) {
        try {
            Map<String, Object> data = com.lazaroph.util.JsonUtil.parseJsonObject(item.getCustomizationData());
            CustomOrder co = new CustomOrder();
            co.setId(customOrderIdSeq.incrementAndGet());
            co.setOrderId(order.getId());
            co.setOrderItemId(item.getId());
            co.setOrderNumber(order.getOrderNumber());
            co.setCustomerName(order.getCustomerName());
            co.setCustomerEmail(order.getCustomerEmail());
            co.setJerseyName(data.getOrDefault("jerseyName", data.getOrDefault("name", "N/A")).toString());
            co.setJerseyNumber(data.getOrDefault("jerseyNumber", data.getOrDefault("number", "00")).toString());
            co.setTeamName(data.getOrDefault("teamName", data.getOrDefault("team", "LAZAROPH")).toString());
            co.setSize(item.getSize());
            co.setColor(item.getColor());
            co.setJerseyDesign(data.getOrDefault("design", "Pro Elite Pattern").toString());
            co.setLogoUrl(data.getOrDefault("logoUrl", null) != null ? data.get("logoUrl").toString() : null);
            co.setCustomizationNotes(data.getOrDefault("notes", "").toString());
            co.setStatus("PENDING_DESIGN");
            co.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            customOrders.put(co.getId(), co);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<Order> getAllOrders() {
        List<Order> list = new ArrayList<>(orders.values());
        list.sort((a, b) -> b.getId() - a.getId());
        return list;
    }

    public Order findOrderById(int id) {
        return orders.get(id);
    }

    public Order findOrderByNumber(String orderNumber) {
        if (orderNumber == null) return null;
        for (Order o : orders.values()) {
            if (orderNumber.equalsIgnoreCase(o.getOrderNumber())) return o;
        }
        return null;
    }

    public List<Order> getOrdersByUserId(int userId) {
        List<Order> list = new ArrayList<>();
        for (Order o : orders.values()) {
            if (o.getUserId() != null && o.getUserId() == userId) {
                list.add(o);
            }
        }
        list.sort((a, b) -> b.getId() - a.getId());
        return list;
    }

    public synchronized boolean updateOrderStatus(int orderId, String newStatus) {
        Order o = orders.get(orderId);
        if (o != null) {
            o.setStatus(newStatus.toUpperCase());
            return true;
        }
        return false;
    }

    // CUSTOM ORDER OPERATIONS
    public List<CustomOrder> getAllCustomOrders() {
        List<CustomOrder> list = new ArrayList<>(customOrders.values());
        list.sort((a, b) -> b.getId() - a.getId());
        return list;
    }

    public synchronized boolean updateCustomOrderStatus(int customOrderId, String newStatus) {
        CustomOrder co = customOrders.get(customOrderId);
        if (co != null) {
            co.setStatus(newStatus);
            return true;
        }
        return false;
    }

    // WISHLIST OPERATIONS
    public synchronized void toggleWishlist(int userId, int productId) {
        Set<Integer> set = wishlists.computeIfAbsent(userId, k -> Collections.synchronizedSet(new HashSet<>()));
        if (set.contains(productId)) {
            set.remove(productId);
        } else {
            set.add(productId);
        }
    }

    public List<Product> getWishlistProducts(int userId) {
        Set<Integer> set = wishlists.get(userId);
        if (set == null) return new ArrayList<>();
        List<Product> list = new ArrayList<>();
        for (Integer pid : set) {
            Product p = products.get(pid);
            if (p != null) list.add(p);
        }
        return list;
    }

    // DASHBOARD STATS
    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();
        BigDecimal totalSales = BigDecimal.ZERO;
        for (Order o : orders.values()) {
            if (!"CANCELLED".equalsIgnoreCase(o.getStatus())) {
                totalSales = totalSales.add(o.getTotal());
            }
        }
        stats.setTotalSales(totalSales);
        stats.setTotalOrders(orders.size());
        stats.setTotalCustomers(users.size());
        stats.setTotalProducts(products.size());

        // Low stock count (variants where stock <= 5)
        List<Map<String, Object>> lowStockList = new ArrayList<>();
        for (ProductVariant v : variants.values()) {
            if (v.getStock() <= 5) {
                Product p = products.get(v.getProductId());
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("variantId", v.getId());
                map.put("productName", p != null ? p.getName() : "Unknown");
                map.put("sku", v.getSkuVariant() != null ? v.getSkuVariant() : (p != null ? p.getSku() : "N/A"));
                map.put("size", v.getSize());
                map.put("color", v.getColor());
                map.put("stock", v.getStock());
                map.put("status", v.getStock() == 0 ? "OUT OF STOCK" : "LOW STOCK");
                lowStockList.add(map);
            }
        }
        stats.setLowStockCount(lowStockList.size());
        stats.setLowStockProducts(lowStockList);

        // Recent Orders
        List<Map<String, Object>> recent = new ArrayList<>();
        List<Order> sortedOrders = getAllOrders();
        for (int i = 0; i < Math.min(6, sortedOrders.size()); i++) {
            Order o = sortedOrders.get(i);
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", o.getId());
            map.put("orderNumber", o.getOrderNumber());
            map.put("customerName", o.getCustomerName());
            map.put("total", o.getTotal());
            map.put("status", o.getStatus());
            map.put("date", new SimpleDateFormat("MMM dd, yyyy").format(o.getCreatedAt()));
            recent.add(map);
        }
        stats.setRecentOrders(recent);

        // Sales By Category
        Map<String, BigDecimal> catSales = new HashMap<>();
        for (Order o : orders.values()) {
            for (OrderItem item : o.getItems()) {
                Product p = products.get(item.getProductId());
                String cat = p != null && p.getCategoryName() != null ? p.getCategoryName() : "General";
                catSales.put(cat, catSales.getOrDefault(cat, BigDecimal.ZERO).add(item.getSubtotal()));
            }
        }
        List<Map<String, Object>> salesByCat = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : catSales.entrySet()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("category", e.getKey());
            map.put("amount", e.getValue());
            salesByCat.add(map);
        }
        stats.setSalesByCategory(salesByCat);

        return stats;
    }

    public Map<String, String> getStoreSettings() {
        return new LinkedHashMap<>(storeSettings);
    }

    public void updateStoreSettings(Map<String, ?> newSettings) {
        if (newSettings == null) return;
        for (Map.Entry<String, ?> entry : newSettings.entrySet()) {
            if (entry.getValue() != null) {
                storeSettings.put(entry.getKey(), entry.getValue().toString());
            }
        }
    }

    public User updateUserProfile(int userId, String name, String phone, String email, String password) {
        User u = users.get(userId);
        if (u == null) return null;
        if (name != null && !name.trim().isEmpty()) u.setName(name.trim());
        if (phone != null && !phone.trim().isEmpty()) {
            u.setPhone(phone.trim());
            storeSettings.put("adminPhone", phone.trim());
            storeSettings.put("storePhone", phone.trim());
        }
        if (email != null && !email.trim().isEmpty()) u.setEmail(email.trim());
        if (password != null && !password.trim().isEmpty()) {
            u.setPasswordHash(PasswordHasher.hashPassword(password.trim()));
        }
        return u;
    }

    // ==========================================================
    // BRAND MANAGEMENT METHODS
    // ==========================================================

    public List<Brand> getAllBrands() {
        List<Brand> list = new ArrayList<>(brands.values());
        for (Brand b : list) {
            int count = 0;
            for (Product p : products.values()) {
                if (p.getBrandId() == b.getId() || (p.getBrandName() != null && p.getBrandName().equalsIgnoreCase(b.getName()))) {
                    count++;
                }
            }
            b.setProductCount(count);
        }
        list.sort(Comparator.comparing(Brand::getName, String.CASE_INSENSITIVE_ORDER));
        return list;
    }

    public List<Brand> getActiveBrands() {
        return getAllBrands().stream()
                .filter(b -> "ACTIVE".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());
    }

    public Brand getBrandById(int id) {
        Brand b = brands.get(id);
        if (b != null) {
            int count = 0;
            for (Product p : products.values()) {
                if (p.getBrandId() == b.getId() || (p.getBrandName() != null && p.getBrandName().equalsIgnoreCase(b.getName()))) {
                    count++;
                }
            }
            b.setProductCount(count);
        }
        return b;
    }

    public Brand saveBrand(Brand brand) {
        if (brand.getId() <= 0) {
            // Check if brand with same name already exists to prevent duplicate entries
            for (Brand existing : brands.values()) {
                if (existing.getName() != null && existing.getName().trim().equalsIgnoreCase(brand.getName().trim())) {
                    brand.setId(existing.getId());
                    break;
                }
            }
            if (brand.getId() <= 0) {
                brand.setId(brandIdSeq.incrementAndGet());
            }
        }
        if (brand.getSlug() == null || brand.getSlug().trim().isEmpty()) {
            brand.setSlug(brand.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-"));
        }
        if (brand.getStatus() == null || brand.getStatus().trim().isEmpty()) {
            brand.setStatus("ACTIVE");
        }
        if (brand.getLogoUrl() == null || brand.getLogoUrl().trim().isEmpty()) {
            brand.setLogoUrl("/images/logo.png");
        }
        brands.put(brand.getId(), brand);
        return getBrandById(brand.getId());
    }

    public boolean deleteBrand(int id) {
        Brand b = brands.get(id);
        if (b == null) return false;
        
        // Remove brand from repository
        brands.remove(id);
        return true;
    }

    public Brand updateBrandStatus(int id, String status) {
        Brand b = brands.get(id);
        if (b != null) {
            b.setStatus("INACTIVE".equalsIgnoreCase(status) ? "INACTIVE" : "ACTIVE");
            return getBrandById(id);
        }
        return null;
    }
}
