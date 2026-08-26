-- ==========================================================
-- LAZAROPH — Official Database Schema & Seed Data
-- Business: Authentic Sneaker, Apparel, Watch & Custom Sportswear
-- Tagline: "AUTHENTIC. LEGIT. BELOW MARKET PRICE."
-- Branches: Concepcion Uno (Marikina) & Malanday (Marikina)
-- ==========================================================

DROP DATABASE IF EXISTS lazaroph;
CREATE DATABASE lazaroph CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lazaroph;

-- 1. ADMINISTRATORS TABLE (SUPER ADMINS)
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    security_password_hash VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN') NOT NULL DEFAULT 'SUPER_ADMIN',
    status ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    failed_security_attempts INT DEFAULT 0,
    security_locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS TABLE
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    province VARCHAR(100) NULL,
    zip_code VARCHAR(20) NULL,
    status ENUM('PENDING', 'VERIFIED', 'DISABLED') NOT NULL DEFAULT 'PENDING',
    verification_token VARCHAR(255) NULL,
    verification_expires TIMESTAMP NULL,
    reset_token VARCHAR(255) NULL,
    reset_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- LEGACY USERS TABLE (For Relational Foreign Keys)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    phone VARCHAR(30) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    province VARCHAR(100) NULL,
    zip_code VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    image_url VARCHAR(500) NULL
);

-- 3. BRANDS TABLE
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500) NULL,
    description TEXT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. PRODUCTS TABLE
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    features TEXT NULL,
    materials TEXT NULL,
    care_instructions TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2) NULL,
    category_id INT NOT NULL,
    subcategory VARCHAR(100) NULL,
    brand_id INT NOT NULL,
    gender ENUM('MEN', 'WOMEN', 'KIDS', 'UNISEX') NOT NULL DEFAULT 'UNISEX',
    size_type ENUM('US_MEN_SHOES', 'US_WOMEN_SHOES', 'US_KIDS_SHOES', 'APPAREL', 'CUSTOM_SIZE', 'NO_SIZE') NOT NULL DEFAULT 'NO_SIZE',
    status ENUM('ACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    is_featured BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT TRUE,
    is_sale BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- 5. PRODUCT IMAGES TABLE
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. PRODUCT VARIANTS TABLE (Separate Size & Color Inventory)
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL DEFAULT 'Standard',
    color_hex VARCHAR(20) DEFAULT '#000000',
    stock INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NULL,
    sku_variant VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_variant (product_id, size, color)
);

-- 7. CARTS & CART ITEMS
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    customization_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- 8. ORDERS & ORDER ITEMS
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_province VARCHAR(100) NOT NULL,
    shipping_zip VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'GCash',
    payment_reference VARCHAR(100) NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 180.00,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    courier ENUM('LALAMOVE', 'LBC', 'STORE_PICKUP') NOT NULL DEFAULT 'LALAMOVE',
    courier_tracking_number VARCHAR(100) NULL,
    courier_tracking_url TEXT NULL,
    courier_status VARCHAR(50) DEFAULT 'PENDING_DISPATCH',
    pickup_branch VARCHAR(100) DEFAULT 'Concepcion Uno, Marikina',
    driver_name VARCHAR(100) NULL,
    driver_phone VARCHAR(50) NULL,
    driver_plate VARCHAR(50) NULL,
    estimated_delivery VARCHAR(100) NULL,
    waybill_url TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    size VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    customization_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- 9. CUSTOM JERSEY ORDERS TABLE
CREATE TABLE custom_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    order_item_id INT NULL,
    jersey_name VARCHAR(100) NOT NULL,
    jersey_number VARCHAR(20) NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    size VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    jersey_design VARCHAR(100) NOT NULL DEFAULT 'Pro Elite Pattern',
    logo_url TEXT NULL,
    customization_notes TEXT NULL,
    status ENUM('PENDING_DESIGN', 'DESIGN_APPROVED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'COMPLETED') NOT NULL DEFAULT 'PENDING_DESIGN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 10. WISHLIST TABLE
CREATE TABLE wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_wishlist (user_id, product_id)
);

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- 1. Seed 3 Super Admins (Admin 1, Admin 2, Admin 3)
INSERT INTO admins (name, email, password_hash, security_password_hash, role, status) VALUES
('Clark Montoya (Super Admin 1)', 'admin1@lazaroph.com', SHA2(CONCAT('AdminPassword123!', 'LAZAROPH_AUTHENTIC_2026'), 256), SHA2(CONCAT('992104', 'LAZAROPH_AUTHENTIC_2026'), 256), 'SUPER_ADMIN', 'ACTIVE'),
('Mark Lazaro (Super Admin 2)', 'admin2@lazaroph.com', SHA2(CONCAT('AdminPassword456!', 'LAZAROPH_AUTHENTIC_2026'), 256), SHA2(CONCAT('882910', 'LAZAROPH_AUTHENTIC_2026'), 256), 'SUPER_ADMIN', 'ACTIVE'),
('Elena Santos (Super Admin 3)', 'admin3@lazaroph.com', SHA2(CONCAT('AdminPassword789!', 'LAZAROPH_AUTHENTIC_2026'), 256), SHA2(CONCAT('773821', 'LAZAROPH_AUTHENTIC_2026'), 256), 'SUPER_ADMIN', 'ACTIVE'),
('LAZAROPH Administrator', 'admin@lazaroph.com', SHA2(CONCAT('admin123', 'LAZAROPH_AUTHENTIC_2026'), 256), SHA2(CONCAT('992104', 'LAZAROPH_AUTHENTIC_2026'), 256), 'SUPER_ADMIN', 'ACTIVE');

-- 2. Seed Verified Customer Account
INSERT INTO customers (name, email, password_hash, phone, address, city, province, zip_code, status) VALUES
('Juan Dela Cruz', 'customer@example.com', SHA2(CONCAT('customer123', 'LAZAROPH_AUTHENTIC_2026'), 256), '09171234567', '32 F. E. Mendoza Street, Malanday', 'Marikina', 'Metro Manila', '1805', 'VERIFIED');

-- 3. Legacy Users Table Seed
INSERT INTO users (name, email, password_hash, role, phone, address, city, province, zip_code) VALUES
('LAZAROPH Administrator', 'admin@lazaroph.com', SHA2(CONCAT('AdminPassword123!', 'LAZAROPH_AUTHENTIC_2026'), 256), 'ADMIN', '282948572', '911 J.P. Rizal Street, Concepcion Uno', 'Marikina', 'Metro Manila', '1805'),
('Juan Dela Cruz', 'customer@example.com', SHA2(CONCAT('customer123', 'LAZAROPH_AUTHENTIC_2026'), 256), 'CUSTOMER', '09171234567', '32 F. E. Mendoza Street, Malanday', 'Marikina', 'Metro Manila', '1805');

-- Categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Shoes', 'shoes', 'Authentic lifestyle sneakers, running shoes, basketball kicks and trainers.', '/images/category-shoes.jpg'),
('Apparel', 'apparel', 'Performance tees, training shorts, premium hoodies and street apparel.', '/images/category-apparel.jpg'),
('Slides', 'slides', 'Authentic athletic slides, recovery slide sandals, and lifestyle comfort footwear.', '/images/cat-slides.png'),
('Watches', 'watches', 'Authentic sports, digital, classic, and chronograph timepieces.', '/images/category-watches.jpg');

-- Brands (Nike and Adidas default active brands)
INSERT INTO brands (id, name, slug, logo_url, description, status) VALUES
(1, 'Nike', 'nike', '/images/brand-nike.png', 'World-renowned athletic sportswear, signature sneakers, and performance apparel.', 'ACTIVE'),
(2, 'Adidas', 'adidas', '/images/brand-adidas.png', 'Iconic 3-stripes sportswear, Originals lifestyle kicks, and boost comfort.', 'ACTIVE');

-- Products
INSERT INTO products (id, name, sku, description, features, materials, care_instructions, price, discount_price, category_id, subcategory, brand_id, gender, size_type, status, is_featured, is_new_arrival, is_sale) VALUES
(1, 'LAZAROPH Runner X1', 'LZPH-SH-RUN01', 'High-performance men''s running shoes engineered for explosive responsiveness, breathability, and all-day pavement endurance.', 'Responsive CloudFoam midsole\nEngineered dual-layer mesh upper\nReinforced heel stabilizer\nHigh-traction rubber outsole', 'Breathable knit mesh, EVA foam midsole, High-density carbon rubber sole', 'Wipe with damp cloth and gentle soap. Air dry away from direct heat.', 2499.00, 2199.00, 1, 'Running Shoes', 2, 'MEN', 'US_MEN_SHOES', 'ACTIVE', TRUE, TRUE, TRUE),
(2, 'LAZAROPH Street Classic', 'LZPH-SH-STR01', 'Iconic minimalist street sneaker built with supple vegan leather, timeless silhouette, and padded memory foam collar.', 'Minimalist silhouette\nPadded ankle collar\nShock-absorbing cushioned footbed\nNon-marking cupsole', 'Premium synthetic leather, Recycled textile lining, Vulcanized rubber sole', 'Clean with soft brush or leather wipes. Do not machine wash.', 2299.00, NULL, 1, 'Sneakers', 3, 'WOMEN', 'US_WOMEN_SHOES', 'ACTIVE', TRUE, TRUE, FALSE),
(3, 'LAZAROPH Junior Sprint', 'LZPH-SH-JNR01', 'Lightweight, durable athletic footwear crafted for active kids, featuring secure lock-down strap and flex-groove sole.', 'Easy lock-down velcro strap\nFlexible outsole with multi-directional grip\nReinforced toe bumper for durability\nUltra-lightweight mesh', 'Air-flow synthetic mesh, Phylon lightweight midsole, Rubber traction pods', 'Hand wash cold with mild detergent. Remove insole before washing.', 1799.00, 1499.00, 1, 'Kids Shoes', 2, 'KIDS', 'US_KIDS_SHOES', 'ACTIVE', FALSE, TRUE, TRUE),
(4, 'LAZAROPH Performance Tee', 'LZPH-AP-TEE01', 'Signature moisture-wicking athletic tee built with 4-way stretch fabric for gym workouts and everyday lifestyle comfort.', 'DryVent moisture-wicking technology\n4-way stretch ergonomic fit\nAnti-odor antimicrobial finish\nTagless comfort collar', '88% Polyester, 12% Spandex Quick-Dry Blend', 'Machine wash cold with like colors. Do not bleach. Tumble dry low.', 799.00, 699.00, 2, 'T-Shirts', 2, 'MEN', 'APPAREL', 'ACTIVE', TRUE, TRUE, TRUE),
(5, 'LAZAROPH Training Shorts', 'LZPH-AP-SHT01', 'Multi-sport athletic shorts with dual deep zip pockets, elastic drawcord waistband, and split-hem agility cut.', 'Deep zippered side security pockets\nBuilt-in breathable compression liner\nReflective LAZAROPH branding\nElastic drawcord waistband', '92% Micro-polyester, 8% Elastane with water-resistant coating', 'Machine wash cold inside out. Hang dry recommended.', 699.00, NULL, 2, 'Shorts', 2, 'MEN', 'APPAREL', 'ACTIVE', FALSE, FALSE, FALSE),
(6, 'LAZAROPH Performance Jersey', 'LZPH-AP-JSY01', 'Breathable pro-cut sleeveless athletic jersey with reinforced side mesh panels and lightweight drape.', 'Pro-cut athletic sleeveless silhouette\nLaser-perforated ventilation panels\nSublimated fade-resistant graphics\nComfort stretch rib collar', '100% High-Grade Birdseye Mesh Polyester', 'Machine wash gentle cycle. Do not iron directly on graphics.', 899.00, NULL, 2, 'Sportswear', 2, 'UNISEX', 'APPAREL', 'ACTIVE', TRUE, TRUE, FALSE),
(7, 'LAZAROPH Classic Time 01', 'LZPH-WT-CLS01', 'Sophisticated analog watch featuring a brushed stainless steel case, minimalist date display, and genuine leather strap.', 'Japanese Quartz precision movement\nHardened mineral crystal glass\n50m water resistance (5 ATM)\nQuick-release leather band', '316L Stainless steel case, Genuine top-grain leather strap, Mineral crystal', 'Wipe with microfiber cloth. Avoid exposure to extreme heat and harsh chemicals.', 1999.00, NULL, 4, 'Classic Watches', 4, 'MEN', 'NO_SIZE', 'ACTIVE', TRUE, FALSE, FALSE),
(8, 'LAZAROPH Sport Digital 01', 'LZPH-WT-DIG01', 'Rugged tactical digital sports watch with backlight, 1/100s stopwatch, dual time zones, countdown timer, and shock resistance.', 'High-contrast digital LCD with EL backlight\n100m Water resistance (10 ATM)\nShock and vibration resistant casing\nDaily alarm & hourly time signal', 'High-impact resin case, Stainless steel back, Flexible silicone strap', 'Rinse with fresh water after saltwater exposure.', 2299.00, 1999.00, 4, 'Sports Watches', 4, 'UNISEX', 'NO_SIZE', 'ACTIVE', TRUE, TRUE, TRUE),
(9, 'LAZAROPH Comfort Slide X1', 'LZPH-SLD-CMF01', 'Ultra-cushioned athletic slide sandal with ergonomic contoured footbed, water-resistant wide strap, and shock-absorbing CloudFoam sole.', 'Ergonomic textured footbed\nPadded wide synthetic leather strap\nHigh-density CloudFoam sole\nAnti-slip textured traction tread', 'EVA CloudFoam footbed, Synthetic leather strap with soft foam padding', 'Wipe with clean damp cloth. Air dry away from direct sunlight.', 1499.00, 1199.00, 3, 'Athletic Slides', 1, 'UNISEX', 'US_MEN_SHOES', 'ACTIVE', TRUE, TRUE, TRUE);

-- Product Variants with Specific Inventory per Size
INSERT INTO product_variants (product_id, size, color, color_hex, stock, price, sku_variant) VALUES
(1, 'US 7', 'Triple Black', '#111111', 5, 2499.00, 'LZPH-SH-RUN01-7-BLK'),
(1, 'US 7.5', 'Triple Black', '#111111', 8, 2499.00, 'LZPH-SH-RUN01-7.5-BLK'),
(1, 'US 8', 'Triple Black', '#111111', 12, 2499.00, 'LZPH-SH-RUN01-8-BLK'),
(1, 'US 8.5', 'Triple Black', '#111111', 10, 2499.00, 'LZPH-SH-RUN01-8.5-BLK'),
(1, 'US 9', 'Triple Black', '#111111', 15, 2499.00, 'LZPH-SH-RUN01-9-BLK'),
(1, 'US 9.5', 'Triple Black', '#111111', 7, 2499.00, 'LZPH-SH-RUN01-9.5-BLK'),
(1, 'US 10', 'Triple Black', '#111111', 20, 2499.00, 'LZPH-SH-RUN01-10-BLK'),
(1, 'US 10.5', 'Triple Black', '#111111', 9, 2499.00, 'LZPH-SH-RUN01-10.5-BLK'),
(1, 'US 11', 'Triple Black', '#111111', 6, 2499.00, 'LZPH-SH-RUN01-11-BLK'),

(9, 'US 6', 'Matte Black', '#000000', 15, 1499.00, 'LZPH-SLD-CMF01-6-BLK'),
(9, 'US 7', 'Matte Black', '#000000', 18, 1499.00, 'LZPH-SLD-CMF01-7-BLK'),
(9, 'US 8', 'Matte Black', '#000000', 25, 1499.00, 'LZPH-SLD-CMF01-8-BLK'),
(9, 'US 9', 'Matte Black', '#000000', 30, 1499.00, 'LZPH-SLD-CMF01-9-BLK'),
(9, 'US 10', 'Matte Black', '#000000', 35, 1499.00, 'LZPH-SLD-CMF01-10-BLK'),
(9, 'US 11', 'Matte Black', '#000000', 20, 1499.00, 'LZPH-SLD-CMF01-11-BLK'),
(9, 'US 12', 'Matte Black', '#000000', 12, 1499.00, 'LZPH-SLD-CMF01-12-BLK');

(2, 'US 5', 'Pure White', '#ffffff', 4, 2299.00, 'LZPH-SH-STR01-5-WHT'),
(2, 'US 5.5', 'Pure White', '#ffffff', 6, 2299.00, 'LZPH-SH-STR01-5.5-WHT'),
(2, 'US 6', 'Pure White', '#ffffff', 10, 2299.00, 'LZPH-SH-STR01-6-WHT'),
(2, 'US 6.5', 'Pure White', '#ffffff', 8, 2299.00, 'LZPH-SH-STR01-6.5-WHT'),
(2, 'US 7', 'Pure White', '#ffffff', 14, 2299.00, 'LZPH-SH-STR01-7-WHT'),
(2, 'US 7.5', 'Pure White', '#ffffff', 9, 2299.00, 'LZPH-SH-STR01-7.5-WHT'),
(2, 'US 8', 'Pure White', '#ffffff', 11, 2299.00, 'LZPH-SH-STR01-8-WHT'),
(2, 'US 8.5', 'Pure White', '#ffffff', 5, 2299.00, 'LZPH-SH-STR01-8.5-WHT'),
(2, 'US 9', 'Pure White', '#ffffff', 3, 2299.00, 'LZPH-SH-STR01-9-WHT'),

(3, 'US 1Y', 'Electric Blue', '#0070f3', 6, 1799.00, 'LZPH-SH-JNR01-1Y-BLU'),
(3, 'US 2Y', 'Electric Blue', '#0070f3', 8, 1799.00, 'LZPH-SH-JNR01-2Y-BLU'),
(3, 'US 3Y', 'Electric Blue', '#0070f3', 10, 1799.00, 'LZPH-SH-JNR01-3Y-BLU'),
(3, 'US 4Y', 'Electric Blue', '#0070f3', 7, 1799.00, 'LZPH-SH-JNR01-4Y-BLU'),
(3, 'US 5Y', 'Electric Blue', '#0070f3', 5, 1799.00, 'LZPH-SH-JNR01-5Y-BLU'),

(4, 'XS', 'Stealth Black', '#151515', 8, 799.00, 'LZPH-AP-TEE01-XS-BLK'),
(4, 'S', 'Stealth Black', '#151515', 18, 799.00, 'LZPH-AP-TEE01-S-BLK'),
(4, 'M', 'Stealth Black', '#151515', 25, 799.00, 'LZPH-AP-TEE01-M-BLK'),
(4, 'L', 'Stealth Black', '#151515', 30, 799.00, 'LZPH-AP-TEE01-L-BLK'),
(4, 'XL', 'Stealth Black', '#151515', 16, 799.00, 'LZPH-AP-TEE01-XL-BLK'),
(4, 'XXL', 'Stealth Black', '#151515', 7, 799.00, 'LZPH-AP-TEE01-XXL-BLK'),

(5, 'S', 'Slate Gray', '#4a5568', 12, 699.00, 'LZPH-AP-SHT01-S-GRY'),
(5, 'M', 'Slate Gray', '#4a5568', 22, 699.00, 'LZPH-AP-SHT01-M-GRY'),
(5, 'L', 'Slate Gray', '#4a5568', 25, 699.00, 'LZPH-AP-SHT01-L-GRY'),
(5, 'XL', 'Slate Gray', '#4a5568', 14, 699.00, 'LZPH-AP-SHT01-XL-GRY'),
(5, 'XXL', 'Slate Gray', '#4a5568', 6, 699.00, 'LZPH-AP-SHT01-XXL-GRY'),

(6, 'S', 'Obsidian Black', '#111111', 10, 899.00, 'LZPH-AP-JSY01-S-BLK'),
(6, 'M', 'Obsidian Black', '#111111', 20, 899.00, 'LZPH-AP-JSY01-M-BLK'),
(6, 'L', 'Obsidian Black', '#111111', 25, 899.00, 'LZPH-AP-JSY01-L-BLK'),
(6, 'XL', 'Obsidian Black', '#111111', 12, 899.00, 'LZPH-AP-JSY01-XL-BLK'),

(7, 'One Size', 'Silver & Leather', '#888888', 15, 1999.00, 'LZPH-WT-CLS01-SLV'),
(8, 'One Size', 'Matte Tactical Black', '#222222', 25, 2299.00, 'LZPH-WT-DIG01-BLK'),

(9, 'XS', 'Custom Sublimation', '#ff3b30', 999, 1199.00, 'LZPH-CST-BB01-XS'),
(9, 'S', 'Custom Sublimation', '#ff3b30', 999, 1199.00, 'LZPH-CST-BB01-S'),
(9, 'M', 'Custom Sublimation', '#ff3b30', 999, 1199.00, 'LZPH-CST-BB01-M'),
(9, 'L', 'Custom Sublimation', '#ff3b30', 999, 1199.00, 'LZPH-CST-BB01-L'),
(9, 'XL', 'Custom Sublimation', '#ff3b30', 999, 1199.00, 'LZPH-CST-BB01-XL'),
(9, 'XXL', 'Custom Sublimation', '#ff3b30', 999, 1199.00, 'LZPH-CST-BB01-XXL');
