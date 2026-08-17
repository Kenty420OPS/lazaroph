package com.lazaroph.controller;

import com.lazaroph.model.*;
import com.lazaroph.repository.DataStore;
import com.lazaroph.service.*;
import com.lazaroph.util.JsonUtil;

import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class ApiController {
    private final AuthService authService = AuthService.getInstance();
    private final ProductService productService = ProductService.getInstance();
    private final CartService cartService = CartService.getInstance();
    private final OrderService orderService = OrderService.getInstance();
    private final InventoryService inventoryService = InventoryService.getInstance();
    private final DataStore store = DataStore.getInstance();

    public static class ApiResponse {
        public final int statusCode;
        public final String contentType;
        public final String body;

        public ApiResponse(int statusCode, String body) {
            this.statusCode = statusCode;
            this.contentType = "application/json; charset=UTF-8";
            this.body = body;
        }

        public static ApiResponse ok(Object data) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("success", true);
            map.put("data", data);
            return new ApiResponse(200, JsonUtil.toJson(map));
        }

        public static ApiResponse message(String message) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("success", true);
            map.put("message", message);
            return new ApiResponse(200, JsonUtil.toJson(map));
        }

        public static ApiResponse error(int status, String message) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("success", false);
            map.put("error", message);
            return new ApiResponse(status, JsonUtil.toJson(map));
        }
    }

    public ApiResponse handleRequest(String method, String path, Map<String, String> queryParams, String body, String token, String sessionKey) {
        try {
            User currentUser = authService.getUserByToken(token);

            // ================= AUTH ROUTES =================
            if (path.equals("/api/auth/register") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String name = (String) req.get("name");
                String email = (String) req.get("email");
                String password = (String) req.get("password");
                String phone = (String) req.get("phone");
                String address = (String) req.get("address");
                String city = (String) req.get("city");
                String province = (String) req.get("province");
                String zipCode = (String) req.get("zipCode");

                User user = authService.register(name, email, password, phone, address, city, province, zipCode);
                String newToken = authService.generateToken(user);

                Map<String, Object> res = new LinkedHashMap<>();
                res.put("token", newToken);
                res.put("user", user);
                return ApiResponse.ok(res);
            }

            if (path.equals("/api/auth/login") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String email = (String) req.get("email");
                String password = (String) req.get("password");

                User user = authService.login(email, password);
                if (user == null) {
                    return ApiResponse.error(401, "Invalid email or password.");
                }

                String newToken = authService.generateToken(user);
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("token", newToken);
                res.put("user", user);
                return ApiResponse.ok(res);
            }

            if (path.equals("/api/auth/me") && "GET".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    return ApiResponse.error(401, "Not authenticated");
                }
                return ApiResponse.ok(currentUser);
            }

            if (path.equals("/api/auth/logout") && "POST".equalsIgnoreCase(method)) {
                if (token != null) {
                    authService.logout(token);
                }
                return ApiResponse.message("Logged out successfully");
            }

            // ================= STORE & CATALOG ROUTES =================
            if (path.equals("/api/categories") && "GET".equalsIgnoreCase(method)) {
                return ApiResponse.ok(store.getAllCategories());
            }

            if (path.equals("/api/brands") && "GET".equalsIgnoreCase(method)) {
                return ApiResponse.ok(store.getActiveBrands());
            }

            if (path.startsWith("/api/brands/") && "GET".equalsIgnoreCase(method)) {
                try {
                    int id = Integer.parseInt(path.substring("/api/brands/".length()));
                    Brand b = store.getBrandById(id);
                    if (b == null) return ApiResponse.error(404, "Brand not found");
                    return ApiResponse.ok(b);
                } catch (NumberFormatException ignored) {}
            }

            if (path.equals("/api/products") && "GET".equalsIgnoreCase(method)) {
                String category = queryParams.get("category");
                String gender = queryParams.get("gender");
                String size = queryParams.get("size");
                String brand = queryParams.get("brand");
                String inStockStr = queryParams.get("inStock");
                Boolean inStock = inStockStr != null ? Boolean.parseBoolean(inStockStr) : null;
                String query = queryParams.get("q");
                String sort = queryParams.get("sort");

                BigDecimal minPrice = null;
                if (queryParams.get("minPrice") != null && !queryParams.get("minPrice").isEmpty()) {
                    try { minPrice = new BigDecimal(queryParams.get("minPrice")); } catch (Exception ignored) {}
                }
                BigDecimal maxPrice = null;
                if (queryParams.get("maxPrice") != null && !queryParams.get("maxPrice").isEmpty()) {
                    try { maxPrice = new BigDecimal(queryParams.get("maxPrice")); } catch (Exception ignored) {}
                }

                List<Product> products = productService.getProducts(category, gender, size, minPrice, maxPrice, brand, inStock, query, sort);
                return ApiResponse.ok(products);
            }

            if (path.startsWith("/api/products/") && "GET".equalsIgnoreCase(method)) {
                int id = Integer.parseInt(path.substring("/api/products/".length()));
                Product p = productService.getProductById(id);
                if (p == null) return ApiResponse.error(404, "Product not found");
                return ApiResponse.ok(p);
            }

            // ================= CART ROUTES =================
            if (path.equals("/api/cart") && "GET".equalsIgnoreCase(method)) {
                return ApiResponse.ok(cartService.getCartSummary(sessionKey));
            }

            if (path.equals("/api/cart/add") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                int productId = ((Number) req.get("productId")).intValue();
                int variantId = ((Number) req.get("variantId")).intValue();
                int quantity = req.get("quantity") != null ? ((Number) req.get("quantity")).intValue() : 1;
                String customData = req.get("customizationData") != null ? req.get("customizationData").toString() : null;

                cartService.addItem(sessionKey, productId, variantId, quantity, customData);
                return ApiResponse.ok(cartService.getCartSummary(sessionKey));
            }

            if (path.equals("/api/cart/update") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                int cartItemId = ((Number) req.get("cartItemId")).intValue();
                int quantity = ((Number) req.get("quantity")).intValue();

                cartService.updateQuantity(sessionKey, cartItemId, quantity);
                return ApiResponse.ok(cartService.getCartSummary(sessionKey));
            }

            if (path.equals("/api/cart/remove") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                int cartItemId = ((Number) req.get("cartItemId")).intValue();

                cartService.removeItem(sessionKey, cartItemId);
                return ApiResponse.ok(cartService.getCartSummary(sessionKey));
            }

            if (path.equals("/api/cart/clear") && "POST".equalsIgnoreCase(method)) {
                cartService.clearCart(sessionKey);
                return ApiResponse.ok(cartService.getCartSummary(sessionKey));
            }

            // ================= CHECKOUT & ORDER ROUTES =================
            if (path.equals("/api/checkout") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String customerName = (String) req.get("customerName");
                String customerEmail = (String) req.get("customerEmail");
                String customerPhone = (String) req.get("customerPhone");
                String shippingAddress = (String) req.get("shippingAddress");
                String shippingCity = (String) req.get("shippingCity");
                String shippingProvince = (String) req.get("shippingProvince");
                String shippingZip = (String) req.get("shippingZip");
                String paymentMethod = (String) req.get("paymentMethod");
                String paymentReference = (String) req.get("paymentReference");
                String notes = (String) req.get("notes");

                Order created = orderService.checkout(
                        sessionKey, currentUser, customerName, customerEmail,
                        customerPhone, shippingAddress, shippingCity, shippingProvince,
                        shippingZip, paymentMethod, paymentReference, notes
                );

                return ApiResponse.ok(created);
            }

            if (path.equals("/api/orders/my-orders") && "GET".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    return ApiResponse.error(401, "Please log in to view your orders.");
                }
                return ApiResponse.ok(orderService.getOrdersByUser(currentUser.getId()));
            }

            if (path.startsWith("/api/orders/track/") && "GET".equalsIgnoreCase(method)) {
                String orderNumber = path.substring("/api/orders/track/".length());
                Order o = orderService.getOrderByNumber(orderNumber);
                if (o == null) return ApiResponse.error(404, "Order not found with number " + orderNumber);
                return ApiResponse.ok(o);
            }

            // ================= WISHLIST ROUTES =================
            if (path.equals("/api/wishlist") && "GET".equalsIgnoreCase(method)) {
                if (currentUser == null) return ApiResponse.ok(Collections.emptyList());
                return ApiResponse.ok(store.getWishlistProducts(currentUser.getId()));
            }

            if (path.equals("/api/wishlist/toggle") && "POST".equalsIgnoreCase(method)) {
                if (currentUser == null) return ApiResponse.error(401, "Please log in to manage your wishlist.");
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                int productId = ((Number) req.get("productId")).intValue();
                store.toggleWishlist(currentUser.getId(), productId);
                return ApiResponse.ok(store.getWishlistProducts(currentUser.getId()));
            }

            // ================= ADMIN PROTECTED ROUTES =================
            if (path.startsWith("/api/admin/")) {
                if (currentUser == null || !currentUser.isAdmin()) {
                    return ApiResponse.error(403, "Access denied. Administrator privileges required.");
                }

                if (path.equals("/api/admin/stats") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(store.getDashboardStats());
                }

                if (path.equals("/api/admin/products") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(store.getAllProducts(false));
                }

                if (path.equals("/api/admin/products/save") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    Product p = new Product();
                    if (req.get("id") != null) {
                        p.setId(((Number) req.get("id")).intValue());
                    }
                    p.setName((String) req.get("name"));
                    p.setSku((String) req.get("sku"));
                    p.setDescription((String) req.get("description"));
                    p.setFeatures((String) req.get("features"));
                    p.setMaterials((String) req.get("materials"));
                    p.setCareInstructions((String) req.get("careInstructions"));
                    if (req.get("price") != null) p.setPrice(new BigDecimal(req.get("price").toString()));
                    if (req.get("discountPrice") != null && !req.get("discountPrice").toString().isEmpty()) {
                        p.setDiscountPrice(new BigDecimal(req.get("discountPrice").toString()));
                    }
                    if (req.get("categoryId") != null) p.setCategoryId(((Number) req.get("categoryId")).intValue());
                    p.setSubcategory((String) req.get("subcategory"));
                    if (req.get("brandId") != null) p.setBrandId(((Number) req.get("brandId")).intValue());
                    p.setGender(req.get("gender") != null ? req.get("gender").toString() : "UNISEX");
                    p.setSizeType(req.get("sizeType") != null ? req.get("sizeType").toString() : "NO_SIZE");
                    p.setStatus(req.get("status") != null ? req.get("status").toString() : "ACTIVE");
                    if (req.get("isFeatured") != null) p.setFeatured(Boolean.parseBoolean(req.get("isFeatured").toString()));
                    if (req.get("isNewArrival") != null) p.setNewArrival(Boolean.parseBoolean(req.get("isNewArrival").toString()));
                    if (req.get("isSale") != null) p.setSale(Boolean.parseBoolean(req.get("isSale").toString()));

                    // Handle Images
                    if (req.get("images") instanceof List<?>) {
                        List<?> imgList = (List<?>) req.get("images");
                        List<ProductImage> pImages = new ArrayList<>();
                        for (int i = 0; i < imgList.size(); i++) {
                            Object item = imgList.get(i);
                            if (item instanceof String) {
                                pImages.add(new ProductImage(0, p.getId(), (String) item, i == 0, i + 1));
                            } else if (item instanceof Map<?, ?>) {
                                Map<?, ?> m = (Map<?, ?>) item;
                                String url = (String) m.get("imageUrl");
                                boolean isMain = m.get("isMain") != null && Boolean.parseBoolean(m.get("isMain").toString());
                                pImages.add(new ProductImage(0, p.getId(), url, isMain, i + 1));
                            }
                        }
                        p.setImages(pImages);
                    }

                    // Save base product
                    Product saved = store.saveProduct(p);

                    // Handle Variants & Stock
                    if (req.get("variants") instanceof List<?>) {
                        List<?> varList = (List<?>) req.get("variants");
                        for (Object varObj : varList) {
                            if (varObj instanceof Map<?, ?>) {
                                Map<?, ?> m = (Map<?, ?>) varObj;
                                ProductVariant v = new ProductVariant();
                                if (m.get("id") != null) v.setId(((Number) m.get("id")).intValue());
                                v.setProductId(saved.getId());
                                v.setSize((String) m.get("size"));
                                v.setColor(m.get("color") != null ? (String) m.get("color") : "Standard");
                                v.setColorHex(m.get("colorHex") != null ? (String) m.get("colorHex") : "#000000");
                                v.setStock(m.get("stock") != null ? ((Number) m.get("stock")).intValue() : 0);
                                if (m.get("price") != null) v.setPrice(new BigDecimal(m.get("price").toString()));
                                v.setSkuVariant(saved.getSku() + "-" + v.getSize());
                                store.saveVariant(v);
                            }
                        }
                    }

                    return ApiResponse.ok(saved);
                }

                if (path.startsWith("/api/admin/products/delete/") && "POST".equalsIgnoreCase(method)) {
                    int id = Integer.parseInt(path.substring("/api/admin/products/delete/".length()));
                    boolean deleted = store.deleteProduct(id);
                    return ApiResponse.ok(deleted);
                }

                if (path.equals("/api/admin/inventory") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(inventoryService.getInventoryMatrix());
                }

                if (path.equals("/api/admin/inventory/update-stock") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    int variantId = ((Number) req.get("variantId")).intValue();
                    int newStock = ((Number) req.get("stock")).intValue();
                    inventoryService.updateStock(variantId, newStock);
                    return ApiResponse.message("Stock updated successfully");
                }

                if (path.equals("/api/admin/orders") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(store.getAllOrders());
                }

                if (path.equals("/api/admin/orders/status") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    int orderId = ((Number) req.get("orderId")).intValue();
                    String status = (String) req.get("status");
                    store.updateOrderStatus(orderId, status);
                    return ApiResponse.message("Order status updated to " + status);
                }

                if (path.equals("/api/admin/custom-orders") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(store.getAllCustomOrders());
                }

                if (path.equals("/api/admin/custom-orders/status") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    int customOrderId = ((Number) req.get("customOrderId")).intValue();
                    String status = (String) req.get("status");
                    store.updateCustomOrderStatus(customOrderId, status);
                    return ApiResponse.message("Custom order status updated to " + status);
                }

                // Admin Brand Management Routes
                if (path.equals("/api/admin/brands") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(store.getAllBrands());
                }

                if (path.equals("/api/admin/brands") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    Brand brand = new Brand();
                    if (req.get("id") != null && ((Number) req.get("id")).intValue() > 0) {
                        brand.setId(((Number) req.get("id")).intValue());
                    }
                    brand.setName((String) req.get("name"));
                    brand.setSlug((String) req.get("slug"));
                    brand.setLogoUrl((String) req.get("logoUrl"));
                    brand.setDescription((String) req.get("description"));
                    brand.setStatus(req.get("status") != null ? (String) req.get("status") : "ACTIVE");

                    Brand saved = store.saveBrand(brand);
                    return ApiResponse.ok(saved);
                }

                if (path.startsWith("/api/admin/brands/delete/") && "POST".equalsIgnoreCase(method)) {
                    int id = Integer.parseInt(path.substring("/api/admin/brands/delete/".length()));
                    boolean deleted = store.deleteBrand(id);
                    return ApiResponse.ok(deleted);
                }

                if (path.startsWith("/api/admin/brands/status/") && "POST".equalsIgnoreCase(method)) {
                    int id = Integer.parseInt(path.substring("/api/admin/brands/status/".length()));
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    String status = (String) req.get("status");
                    Brand updated = store.updateBrandStatus(id, status);
                    return ApiResponse.ok(updated);
                }

                if (path.equals("/api/admin/customers") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(store.getAllUsers());
                }

                if (path.equals("/api/admin/settings") && "GET".equalsIgnoreCase(method)) {
                    return ApiResponse.ok(store.getStoreSettings());
                }

                if (path.equals("/api/admin/settings") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    store.updateStoreSettings(req);
                    return ApiResponse.message("Store contact details and settings updated successfully!");
                }

                if (path.equals("/api/admin/profile") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    String name = (String) req.get("name");
                    String phone = (String) req.get("phone");
                    String email = (String) req.get("email");
                    String password = (String) req.get("password");

                    User updated = store.updateUserProfile(currentUser.getId(), name, phone, email, password);
                    return ApiResponse.ok(updated);
                }
            }

            if (path.equals("/api/settings") && "GET".equalsIgnoreCase(method)) {
                return ApiResponse.ok(store.getStoreSettings());
            }

            return ApiResponse.error(404, "Endpoint not found: " + path);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(500, "Internal Server Error: " + e.getMessage());
        }
    }
}
