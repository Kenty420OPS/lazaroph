# LAZAROPH — Official E-Commerce Platform

**Tagline:** `"AUTHENTIC. LEGIT. BELOW MARKET PRICE."`  
*"We sell authentic sneaker, apparel and watch. All are guaranteed legit at below market price."*

---

## 1. Business & Branch Information

### Physical Branches (Marikina City, Philippines)
* **Branch 1 — Concepcion Uno:**  
  911 J.P. Rizal Street, Concepcion Uno, Marikina, 1805 Metro Manila, Philippines  
  Contact: **282948572** | Hours: Mon–Sun 11:00 AM – 8:00 PM

* **Branch 2 — Malanday:**  
  32 F. E. Mendoza Street, Malanday, Marikina, 1805 Metro Manila, Philippines  
  Contact: **282948572** | Hours: Mon–Sun 11:00 AM – 8:00 PM

### Contact Details
* **Email:** [lazarophilippines20@gmail.com](mailto:lazarophilippines20@gmail.com)
* **Phone:** 282948572
* **Facebook:** LazaroPH
* **Instagram:** Lazaro Philippines

---

## 2. System Architecture & Features

### Customer Storefront
1. **Homepage:** Hero banner, Authenticity badges, Featured categories (Men, Women, Kids, Customized, Watches), Trending & New Arrivals grids, Physical Store Locator.
2. **Catalog & Search:** Multi-faceted filtering by Category, Gender, **US Shoe Size System**, Apparel Sizes, Price Range, Brand, and In-Stock availability with live search and sorting.
3. **US Shoe Size Engine:**
   - Men's Sizes: `US 6` to `US 14` (including half-sizes)
   - Women's Sizes: `US 5` to `US 12`
   - Kids' Sizes: `US 1C` to `13.5C`, `US 1Y` to `6Y`
   - Individual stock counter per size (disables out-of-stock sizes).
4. **Interactive Jersey Customizer Studio:** Live 2D/Canvas preview of customized jerseys with dynamic Player Name, Jersey Number, Team Name, color presets, and direct cart checkout.
5. **Shopping Cart & Checkout:** Variant-aware cart, Secure Digital Prepayment (GCash, Maya, Direct Bank Transfer, Credit/Debit Card) & In-Store Cash Pickup in Marikina with Philippine address validation.
6. **Order Tracking:** 5-Stage interactive progression timeline (`Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered`).

### Admin Management Dashboard
1. **Executive Dashboard:** Real-time Gross Sales (₱), Total Orders, Registered Customers, Active Products, and Low Stock variant alerts.
2. **No-Code Product Manager:** Add and edit products, images, descriptions, categories, and brand options without writing any HTML/Java/SQL.
3. **Variant Inventory Matrix:** View and update stock levels for every specific size variant.
4. **Order Pipeline:** Update fulfillment statuses (`Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered` → `Cancelled`).
5. **Customized Jersey Orders:** Inspect player name, number, team, design, and advance production status (`Pending Design` → `Design Approved` → `In Production` → `Ready` → `Shipped` → `Completed`).

---

## 3. How to Build and Run

### Prerequisites
* Java JDK 17+ or Java 25
* Any modern web browser (Chrome, Edge, Firefox, Safari)

### Quick Start (Windows)
1. Double-click `build.bat` to compile the Java backend.
2. Double-click `run.bat` or run:
   ```cmd
   java -cp bin com.lazaroph.Main 8080
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Default Login Accounts
* **Admin Dashboard:**
  * **Email:** `admin@lazaroph.com`
  * **Password:** `admin123`
* **Customer Account:**
  * **Email:** `customer@example.com`
  * **Password:** `customer123`

---

## 4. Production MySQL Deployment

The complete relational schema and initial seed data is located in `database/lazaroph.sql`.

To deploy with MySQL:
```bash
mysql -u root -p < database/lazaroph.sql
```
Then start the server with your MySQL connection properties:
```cmd
java -Ddb.host=localhost -Ddb.port=3306 -Ddb.name=lazaroph -Ddb.user=root -Ddb.pass=yourpassword -cp bin com.lazaroph.Main 8080
```
