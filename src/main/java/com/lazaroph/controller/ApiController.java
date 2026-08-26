package com.lazaroph.controller;

import com.lazaroph.model.*;
import com.lazaroph.repository.DataStore;
import com.lazaroph.service.*;
import com.lazaroph.util.JsonUtil;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class ApiController {
    private final AuthService authService = AuthService.getInstance();
    private final ProductService productService = ProductService.getInstance();
    private final CartService cartService = CartService.getInstance();
    private final OrderService orderService = OrderService.getInstance();
    private final InventoryService inventoryService = InventoryService.getInstance();
    private final CourierService courierService = CourierService.getInstance();
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

            // ================= CUSTOMER AUTH ROUTES =================
            if (path.equals("/api/auth/customer/register") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String name = (String) req.get("name");
                String email = (String) req.get("email");
                String password = (String) req.get("password");
                String confirmPassword = (String) req.get("confirmPassword");

                CustomerUser customer = authService.registerCustomer(name, email, password, confirmPassword);
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("message", "Registration successful. Please verify your email before logging in.");
                res.put("email", customer.getEmail());
                res.put("status", customer.getStatus());
                return ApiResponse.ok(res);
            }

            if (path.equals("/api/auth/customer/verify-email") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String tokenParam = (String) req.get("token");
                CustomerUser customer = authService.verifyCustomerEmail(tokenParam);
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("message", "Email verified successfully! You can now log in.");
                res.put("customer", customer);
                return ApiResponse.ok(res);
            }

            if (path.equals("/api/auth/customer/resend-verification") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String email = (String) req.get("email");
                authService.resendCustomerVerification(email);
                return ApiResponse.message("If an unverified account exists, a new verification link has been sent.");
            }

            if (path.equals("/api/auth/customer/login") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String email = (String) req.get("email");
                String password = (String) req.get("password");

                try {
                    Map<String, Object> res = authService.loginCustomer(email, password);
                    return ApiResponse.ok(res);
                } catch (IllegalStateException e) {
                    if (e.getMessage().startsWith("PENDING:")) {
                        Map<String, Object> err = new HashMap<>();
                        err.put("error", "Please verify your email address before logging in.");
                        err.put("status", "PENDING");
                        err.put("canResend", true);
                        return new ApiResponse(403, JsonUtil.toJson(err));
                    } else if (e.getMessage().startsWith("DISABLED:")) {
                        return ApiResponse.error(403, "Your account has been disabled. Please contact customer support.");
                    }
                    return ApiResponse.error(400, e.getMessage());
                } catch (IllegalArgumentException e) {
                    return ApiResponse.error(401, e.getMessage());
                }
            }

            if (path.equals("/api/auth/customer/forgot-password") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String email = (String) req.get("email");
                String clientIp = sessionKey;
                authService.forgotCustomerPassword(email, clientIp);
                return ApiResponse.message("If an account exists for this email, we will send you a password reset link.");
            }

            if (path.equals("/api/auth/customer/reset-password") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String resetToken = (String) req.get("token");
                String newPassword = (String) req.get("newPassword");
                String confirmPassword = (String) req.get("confirmPassword");

                authService.resetCustomerPassword(resetToken, newPassword, confirmPassword);
                return ApiResponse.message("Your password has been successfully reset. You can now log in using your new password.");
            }

            if (path.equals("/api/auth/customer/me") && "GET".equalsIgnoreCase(method)) {
                CustomerUser customer = authService.getCustomerByToken(token);
                if (customer == null) {
                    return ApiResponse.error(401, "Not authenticated as a customer.");
                }
                return ApiResponse.ok(customer);
            }

            if (path.equals("/api/auth/customer/logout") && "POST".equalsIgnoreCase(method)) {
                if (token != null) authService.logoutCustomer(token);
                return ApiResponse.message("Customer logged out successfully.");
            }

            // ================= ADMIN TWO-STEP AUTH ROUTES =================
            if (path.equals("/api/auth/admin/login-step1") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String email = (String) req.get("email");
                String password = (String) req.get("password");

                try {
                    Map<String, Object> res = authService.adminLoginStep1(email, password);
                    return ApiResponse.ok(res);
                } catch (IllegalStateException e) {
                    return ApiResponse.error(403, e.getMessage());
                } catch (IllegalArgumentException e) {
                    return ApiResponse.error(401, e.getMessage());
                }
            }

            if (path.equals("/api/auth/admin/verify-step2") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String preAuthToken = (String) req.get("preAuthToken");
                String securityPassword = (String) req.get("securityPassword");

                try {
                    Map<String, Object> res = authService.adminVerifyStep2(preAuthToken, securityPassword);
                    return ApiResponse.ok(res);
                } catch (IllegalStateException e) {
                    return ApiResponse.error(403, e.getMessage());
                } catch (IllegalArgumentException e) {
                    return ApiResponse.error(401, e.getMessage());
                }
            }

            if (path.equals("/api/auth/admin/me") && "GET".equalsIgnoreCase(method)) {
                AdminUser admin = authService.getAdminByToken(token);
                if (admin == null) {
                    return ApiResponse.error(401, "Not authenticated as an administrator.");
                }
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("id", admin.getId());
                res.put("name", admin.getName());
                res.put("email", admin.getEmail());
                res.put("role", admin.getRole());
                res.put("status", admin.getStatus());
                return ApiResponse.ok(res);
            }

            if (path.equals("/api/auth/admin/logout") && "POST".equalsIgnoreCase(method)) {
                if (token != null) authService.logoutAdmin(token);
                return ApiResponse.message("Administrator logged out successfully.");
            }

            // ================= LOCAL EMAIL SIMULATOR ROUTE =================
            if (path.equals("/api/auth/email-simulator/latest") && "GET".equalsIgnoreCase(method)) {
                List<AuthService.SimulatedEmail> emails = authService.getSimulatedEmails();
                return ApiResponse.ok(emails);
            }

            // ================= LEGACY AUTH ROUTES (BACKWARD COMPATIBILITY) =================
            if (path.equals("/api/auth/register") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String name = (String) req.get("name");
                String email = (String) req.get("email");
                String password = (String) req.get("password");
                String confirmPassword = req.containsKey("confirmPassword") ? (String) req.get("confirmPassword") : password;

                CustomerUser customer = authService.registerCustomer(name, email, password, confirmPassword);
                // For legacy direct registrations: auto-verify if needed or return customer
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("customer", customer);
                res.put("message", "Registration successful.");
                return ApiResponse.ok(res);
            }

            if (path.equals("/api/auth/login") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String email = (String) req.get("email");
                String password = (String) req.get("password");

                try {
                    Map<String, Object> res = authService.loginCustomer(email, password);
                    return ApiResponse.ok(res);
                } catch (Exception e) {
                    return ApiResponse.error(401, e.getMessage());
                }
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

            if (path.equals("/api/featured-categories") && "GET".equalsIgnoreCase(method)) {
                return ApiResponse.ok(store.getAllFeaturedCategories());
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

            // ================= LOGISTICS & COURIER QUOTE ROUTES =================
            if (path.equals("/api/couriers/quotes") && "GET".equalsIgnoreCase(method)) {
                String city = queryParams.get("city");
                String province = queryParams.get("province");
                return ApiResponse.ok(courierService.getQuotes(city, province));
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
                String courier = (String) req.get("courier");
                String pickupBranch = (String) req.get("pickupBranch");

                Order created = orderService.checkout(
                        sessionKey, currentUser, customerName, customerEmail,
                        customerPhone, shippingAddress, shippingCity, shippingProvince,
                        shippingZip, paymentMethod, paymentReference, notes,
                        courier, pickupBranch
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

            // Webhook Receiver (Lalamove / LBC status callbacks)
            if (path.equals("/api/webhooks/lalamove") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                if (req.get("orderId") != null && req.get("status") != null) {
                    int orderId = ((Number) req.get("orderId")).intValue();
                    String st = req.get("status").toString();
                    courierService.updateCourierStatus(orderId, st);
                }
                return ApiResponse.message("Lalamove webhook processed");
            }

            if (path.equals("/api/webhooks/lbc") && "POST".equalsIgnoreCase(method)) {
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                if (req.get("orderId") != null && req.get("status") != null) {
                    int orderId = ((Number) req.get("orderId")).intValue();
                    String st = req.get("status").toString();
                    courierService.updateCourierStatus(orderId, st);
                }
                return ApiResponse.message("LBC webhook processed");
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

            // ================= CHAT & MESSAGING SYSTEM ROUTES =================
            if (path.equals("/api/chat/conversations") && "GET".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    return ApiResponse.error(401, "Please log in to access messages.");
                }
                if (currentUser.isAdmin()) {
                    return ApiResponse.ok(store.getAllConversations());
                } else {
                    return ApiResponse.ok(store.getConversationsByCustomerId(currentUser.getId()));
                }
            }

            if (path.equals("/api/chat/start") && "POST".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    return ApiResponse.error(401, "Please log in to send messages.");
                }
                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                Conversation conv;
                if (req.get("orderId") != null) {
                    int orderId = ((Number) req.get("orderId")).intValue();
                    Order order = store.findOrderById(orderId);
                    if (order != null) {
                        conv = store.getOrCreateConversationForOrder(order, currentUser);
                    } else {
                        conv = store.getOrCreateGeneralConversation(currentUser);
                    }
                } else {
                    conv = store.getOrCreateGeneralConversation(currentUser);
                }

                if (req.get("initialMessage") != null && !req.get("initialMessage").toString().trim().isEmpty()) {
                    store.addChatMessage(
                        conv.getId(),
                        currentUser.getId(),
                        currentUser.getName(),
                        currentUser.isAdmin() ? "ADMIN" : "CUSTOMER",
                        req.get("initialMessage").toString().trim()
                    );
                }

                return ApiResponse.ok(conv);
            }

            if (path.matches("^/api/chat/conversations/\\d+/messages$") && "GET".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    return ApiResponse.error(401, "Please log in to view conversation.");
                }
                int convId = Integer.parseInt(path.split("/")[4]);
                Conversation conv = store.findConversationById(convId);
                if (conv == null) return ApiResponse.error(404, "Conversation not found.");

                // Security: ensure customer can only access their own conversation
                boolean isConvOwner = currentUser.isAdmin() || conv.getCustomerId() == currentUser.getId() ||
                    (currentUser.getEmail() != null && currentUser.getEmail().equalsIgnoreCase(conv.getCustomerEmail()));
                if (!isConvOwner) {
                    return ApiResponse.error(403, "Access denied to this conversation.");
                }

                // Mark messages as read by current user role
                store.markConversationMessagesAsRead(convId, currentUser.isAdmin() ? "ADMIN" : "CUSTOMER");

                Map<String, Object> res = new LinkedHashMap<>();
                res.put("conversation", conv);
                res.put("messages", store.getMessagesByConversationId(convId));
                return ApiResponse.ok(res);
            }

            if (path.matches("^/api/chat/conversations/\\d+/messages$") && "POST".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    return ApiResponse.error(401, "Please log in to send messages.");
                }
                int convId = Integer.parseInt(path.split("/")[4]);
                Conversation conv = store.findConversationById(convId);
                if (conv == null) return ApiResponse.error(404, "Conversation not found.");

                boolean isConvOwner = currentUser.isAdmin() || conv.getCustomerId() == currentUser.getId() ||
                    (currentUser.getEmail() != null && currentUser.getEmail().equalsIgnoreCase(conv.getCustomerEmail()));
                if (!isConvOwner) {
                    return ApiResponse.error(403, "Access denied to this conversation.");
                }

                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                String msgText = req.get("message") != null ? ((String) req.get("message")).trim() : "";
                String imageUrl = req.get("imageUrl") != null ? ((String) req.get("imageUrl")).trim() : null;
                String messageType = req.get("messageType") != null ? ((String) req.get("messageType")).trim() : "TEXT";

                if (msgText.isEmpty() && (imageUrl == null || imageUrl.isEmpty())) {
                    return ApiResponse.error(400, "Message or image attachment cannot be empty.");
                }

                ChatMessage msg = store.addChatMessage(
                    convId,
                    currentUser.getId(),
                    currentUser.isAdmin() ? "LAZAROPH Administrator" : currentUser.getName(),
                    currentUser.isAdmin() ? "ADMIN" : "CUSTOMER",
                    msgText.isEmpty() ? "Attached photo" : msgText,
                    imageUrl,
                    messageType
                );

                return ApiResponse.ok(msg);
            }

            // Chat Image Attachment & Proof of Payment Upload Endpoint
            if (path.equals("/api/chat/upload-image") && "POST".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    return ApiResponse.error(401, "Sign in or active session required to send attachments.");
                }

                Map<String, Object> req = JsonUtil.parseJsonObject(body);
                Object convIdObj = req.get("conversationId");
                if (convIdObj == null) return ApiResponse.error(400, "conversationId is required.");
                int convId = convIdObj instanceof Number ? ((Number) convIdObj).intValue() : Integer.parseInt(convIdObj.toString().trim());

                Conversation conv = store.getConversationById(convId);
                if (conv == null) return ApiResponse.error(404, "Conversation not found.");

                boolean isConvOwner = currentUser.isAdmin() || conv.getCustomerId() == currentUser.getId() ||
                    (currentUser.getEmail() != null && currentUser.getEmail().equalsIgnoreCase(conv.getCustomerEmail()));
                if (!isConvOwner) {
                    return ApiResponse.error(403, "Access denied to this conversation.");
                }

                String filename = req.get("filename") != null ? (String) req.get("filename") : "payment.jpg";
                String imageData = (String) req.get("imageData");
                String message = req.get("message") != null ? ((String) req.get("message")).trim() : "";
                String messageType = req.get("messageType") != null ? ((String) req.get("messageType")).trim() : "PAYMENT_PROOF";
                String refNo = req.get("referenceNumber") != null ? ((String) req.get("referenceNumber")).trim() : "";

                if (imageData == null || imageData.trim().isEmpty()) {
                    return ApiResponse.error(400, "Image data cannot be empty.");
                }

                // Parse base64 header if present
                String mimeType = "image/jpeg";
                String base64Content = imageData;
                if (imageData.startsWith("data:") && imageData.contains(",")) {
                    int commaIdx = imageData.indexOf(',');
                    String header = imageData.substring(0, commaIdx);
                    base64Content = imageData.substring(commaIdx + 1);
                    int colonIdx = header.indexOf(':');
                    int semiIdx = header.indexOf(';');
                    if (colonIdx != -1 && semiIdx != -1 && semiIdx > colonIdx) {
                        mimeType = header.substring(colonIdx + 1, semiIdx).toLowerCase();
                    }
                }

                // Validate MIME type
                if (!mimeType.equals("image/jpeg") && !mimeType.equals("image/jpg") &&
                    !mimeType.equals("image/png") && !mimeType.equals("image/webp")) {
                    return ApiResponse.error(400, "Unsupported format: " + mimeType + ". Please upload JPG, PNG, or WEBP.");
                }

                // Decode bytes
                byte[] imageBytes;
                try {
                    imageBytes = Base64.getDecoder().decode(base64Content.trim().replaceAll("\\s+", ""));
                } catch (Exception e) {
                    return ApiResponse.error(400, "Corrupted image data. Base64 decoding failed.");
                }

                // Validate file size (max 10MB)
                if (imageBytes.length > 10 * 1024 * 1024) {
                    return ApiResponse.error(400, "The file is too large (" + String.format("%.1f", imageBytes.length / (1024.0 * 1024.0)) + "MB). Maximum allowed size is 10MB.");
                }

                String ext = (mimeType.contains("png") || filename.toLowerCase().endsWith(".png")) ? "png" :
                             (mimeType.contains("webp") || filename.toLowerCase().endsWith(".webp")) ? "webp" : "jpg";

                String paymentsDir = "src/main/webapp/uploads/payments";
                File dir = new File(paymentsDir);
                if (!dir.exists()) dir.mkdirs();

                String savedFileName = "payment-" + convId + "-" + System.currentTimeMillis() + "." + ext;
                File destFile = new File(dir, savedFileName);
                try (FileOutputStream fos = new FileOutputStream(destFile)) {
                    fos.write(imageBytes);
                    fos.flush();
                } catch (Exception e) {
                    return ApiResponse.error(500, "Failed to save payment proof image: " + e.getMessage());
                }

                // Mirror to GitHub if exists
                try {
                    File ghDir = new File("C:/Users/Clark L. Montoya/OneDrive/Documents/GitHub/lazaroph/src/main/webapp/uploads/payments");
                    if (ghDir.exists() || (ghDir.getParentFile() != null && ghDir.getParentFile().exists())) {
                        ghDir.mkdirs();
                        try (FileOutputStream fos = new FileOutputStream(new File(ghDir, savedFileName))) {
                            fos.write(imageBytes);
                            fos.flush();
                        }
                    }
                } catch (Exception ignored) {}

                String publicUrl = "uploads/payments/" + savedFileName;
                String finalMessage = message;
                if (finalMessage.isEmpty()) {
                    if ("PAYMENT_PROOF".equalsIgnoreCase(messageType)) {
                        finalMessage = "💳 [PROOF OF PAYMENT] Receipt submitted for order verification" +
                            (!refNo.isEmpty() ? " (Ref: " + refNo + ")" : ".");
                    } else {
                        finalMessage = "Attached photo.";
                    }
                }

                ChatMessage chatMsg = store.addChatMessage(
                    convId,
                    currentUser.getId(),
                    currentUser.isAdmin() ? "LAZAROPH Administrator" : currentUser.getName(),
                    currentUser.isAdmin() ? "ADMIN" : "CUSTOMER",
                    finalMessage,
                    publicUrl,
                    messageType
                );

                return ApiResponse.ok(chatMsg);
            }

            // Payment Verification Double-Confirmation Endpoint
            if (path.matches("^/api/chat/conversations/\\d+/verify-payment$") && "POST".equalsIgnoreCase(method)) {
                AdminUser currentAdmin = authService.getAdminByToken(token);
                if (currentAdmin == null || !currentAdmin.isActive()) {
                    if (currentUser == null || !currentUser.isAdmin()) {
                        return ApiResponse.error(403, "Access denied. Administrator session required.");
                    }
                }

                int convId = Integer.parseInt(path.split("/")[4]);
                Conversation conv = store.getConversationById(convId);
                if (conv == null) return ApiResponse.error(404, "Conversation not found.");

                if (conv.getOrderId() != null && conv.getOrderId() > 0) {
                    store.updateOrderStatus(conv.getOrderId(), "PAID");
                }

                String adminName = currentAdmin != null ? currentAdmin.getName() : "LAZAROPH Administrator";
                String orderRef = conv.getOrderNumber() != null ? " for Order #" + conv.getOrderNumber() : "";
                String confirmMsg = "✅ PAYMENT VERIFIED & CONFIRMED: Payment receipt" + orderRef + " has been verified by " + adminName + ". Your order is now confirmed and scheduled for dispatch!";

                ChatMessage sysMsg = store.addChatMessage(
                    convId,
                    currentAdmin != null ? currentAdmin.getId() : 1,
                    adminName,
                    "ADMIN",
                    confirmMsg,
                    null,
                    "PAYMENT_VERIFIED"
                );

                return ApiResponse.ok(sysMsg);
            }

            if (path.matches("^/api/chat/conversations/\\d+/read$") && "POST".equalsIgnoreCase(method)) {
                if (currentUser != null) {
                    int convId = Integer.parseInt(path.split("/")[4]);
                    store.markConversationMessagesAsRead(convId, currentUser.isAdmin() ? "ADMIN" : "CUSTOMER");
                }
                return ApiResponse.message("Conversation marked as read.");
            }

            if (path.equals("/api/chat/unread-count") && "GET".equalsIgnoreCase(method)) {
                if (currentUser == null) {
                    Map<String, Object> countMap = new HashMap<>();
                    countMap.put("unreadCount", 0);
                    return ApiResponse.ok(countMap);
                }
                int count = currentUser.isAdmin() ? store.getUnreadChatCountForAdmin() : store.getUnreadChatCountForCustomer(currentUser.getId());
                Map<String, Object> countMap = new HashMap<>();
                countMap.put("unreadCount", count);
                return ApiResponse.ok(countMap);
            }

            // ================= ADMIN PROTECTED ROUTES =================
            if (path.startsWith("/api/admin/")) {
                AdminUser currentAdmin = authService.getAdminByToken(token);
                if (currentAdmin == null || !currentAdmin.isActive() || !currentAdmin.isSuperAdmin()) {
                    if (currentUser == null || !currentUser.isAdmin()) {
                        return ApiResponse.error(403, "Access denied. Valid 2-step verified Administrator session required.");
                    }
                }

                // --- Admin Management Endpoints ---
                if (path.equals("/api/admin/admins") && "GET".equalsIgnoreCase(method)) {
                    List<AdminUser> admins = authService.listAllAdmins();
                    List<Map<String, Object>> safeList = new ArrayList<>();
                    for (AdminUser a : admins) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", a.getId());
                        m.put("name", a.getName());
                        m.put("email", a.getEmail());
                        m.put("role", a.getRole());
                        m.put("status", a.getStatus());
                        m.put("isLocked", a.isLocked());
                        m.put("createdAt", a.getCreatedAt());
                        safeList.add(m);
                    }
                    return ApiResponse.ok(safeList);
                }

                if (path.equals("/api/admin/admins") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    String name = (String) req.get("name");
                    String email = (String) req.get("email");
                    String password = (String) req.get("password");
                    String confirmPassword = (String) req.get("confirmPassword");
                    String securityPassword = (String) req.get("securityPassword");
                    String confirmSecurity = (String) req.get("confirmSecurity");
                    String role = req.containsKey("role") ? (String) req.get("role") : "SUPER_ADMIN";

                    try {
                        AdminUser created = authService.createAdmin(name, email, password, confirmPassword, securityPassword, confirmSecurity, role);
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", created.getId());
                        m.put("name", created.getName());
                        m.put("email", created.getEmail());
                        m.put("role", created.getRole());
                        m.put("status", created.getStatus());
                        return ApiResponse.ok(m);
                    } catch (IllegalArgumentException e) {
                        return ApiResponse.error(400, e.getMessage());
                    }
                }

                if ((path.equals("/api/admin/admins/status") || path.equals("/api/admin/admins/toggle-status")) && ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method))) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    Object adminIdObj = req.get("adminId");
                    if (adminIdObj == null) return ApiResponse.error(400, "Missing required 'adminId'.");
                    int targetId = adminIdObj instanceof Number ? ((Number) adminIdObj).intValue() : Integer.parseInt(adminIdObj.toString().trim());
                    String newStatus = (String) req.get("status");
                    try {
                        AdminUser updated = authService.updateAdminStatus(targetId, newStatus, currentAdmin != null ? currentAdmin : new AdminUser(1, "Super Admin", "admin@lazaroph.com", "", "", "SUPER_ADMIN", "ACTIVE"));
                        return ApiResponse.ok(updated);
                    } catch (Exception e) {
                        return ApiResponse.error(400, e.getMessage());
                    }
                }

                if (path.equals("/api/admin/admins/reset-security") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    Object adminIdObj = req.get("adminId");
                    if (adminIdObj == null) return ApiResponse.error(400, "Missing required 'adminId'.");
                    int targetId = adminIdObj instanceof Number ? ((Number) adminIdObj).intValue() : Integer.parseInt(adminIdObj.toString().trim());
                    String newPassword = (String) req.get("password");
                    String newPin = (String) req.get("securityPassword");
                    boolean ok = authService.resetAdminSecurity(targetId, newPassword, newPin);
                    if (!ok) return ApiResponse.error(404, "Administrator not found.");
                    return ApiResponse.message("Admin credentials reset successfully.");
                }

                if ((path.equals("/api/admin/admins/delete") || path.equals("/api/admin/admins/remove")) && ("POST".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method))) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    Object adminIdObj = req.get("adminId");
                    if (adminIdObj == null) return ApiResponse.error(400, "Missing required 'adminId'.");
                    int targetId = adminIdObj instanceof Number ? ((Number) adminIdObj).intValue() : Integer.parseInt(adminIdObj.toString().trim());
                    try {
                        authService.deleteAdmin(targetId, currentAdmin != null ? currentAdmin : new AdminUser(1, "Super Admin", "admin@lazaroph.com", "", "", "SUPER_ADMIN", "ACTIVE"));
                        return ApiResponse.message("Administrator deleted successfully.");
                    } catch (Exception e) {
                        return ApiResponse.error(400, e.getMessage());
                    }
                }

                // --- Featured Categories Upload & Management Endpoints ---
                if (path.equals("/api/admin/featured-categories/upload") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    String categoryKey = req.containsKey("categoryKey") ? ((String) req.get("categoryKey")).toLowerCase().trim() : "";
                    String filename = req.containsKey("filename") ? (String) req.get("filename") : "image.jpg";
                    String imageData = (String) req.get("imageData");

                    if (categoryKey.isEmpty() || !Arrays.asList("men", "women", "kids", "slides", "watches").contains(categoryKey)) {
                        return ApiResponse.error(400, "Invalid category. Must be one of: men, women, kids, slides, watches.");
                    }

                    if (imageData == null || imageData.trim().isEmpty()) {
                        return ApiResponse.error(400, "No image data provided. Please select an image.");
                    }

                    // Parse base64 header if present
                    String mimeType = "image/jpeg";
                    String base64Content = imageData;
                    if (imageData.startsWith("data:") && imageData.contains(",")) {
                        int commaIdx = imageData.indexOf(',');
                        String header = imageData.substring(0, commaIdx);
                        base64Content = imageData.substring(commaIdx + 1);
                        int colonIdx = header.indexOf(':');
                        int semiIdx = header.indexOf(';');
                        if (colonIdx != -1 && semiIdx != -1 && semiIdx > colonIdx) {
                            mimeType = header.substring(colonIdx + 1, semiIdx).toLowerCase();
                        }
                    }

                    // Validate MIME type
                    if (!mimeType.equals("image/jpeg") && !mimeType.equals("image/jpg") &&
                        !mimeType.equals("image/png") && !mimeType.equals("image/webp")) {
                        return ApiResponse.error(400, "Unsupported image format: " + mimeType + ". Supported formats are JPG, JPEG, PNG, and WEBP.");
                    }

                    // Decode bytes
                    byte[] imageBytes;
                    try {
                        imageBytes = Base64.getDecoder().decode(base64Content.trim().replaceAll("\\s+", ""));
                    } catch (Exception e) {
                        return ApiResponse.error(400, "Corrupted image data. Base64 decoding failed.");
                    }

                    // Validate file size (max 10MB)
                    if (imageBytes.length > 10 * 1024 * 1024) {
                        return ApiResponse.error(400, "The file is too large (" + String.format("%.1f", imageBytes.length / (1024.0 * 1024.0)) + "MB). Maximum allowed size is 10MB.");
                    }

                    // Determine file extension
                    String ext = "jpg";
                    if (mimeType.contains("png") || filename.toLowerCase().endsWith(".png")) {
                        ext = "png";
                    } else if (mimeType.contains("webp") || filename.toLowerCase().endsWith(".webp")) {
                        ext = "webp";
                    } else {
                        ext = "jpg";
                    }

                    // Ensure upload directories exist
                    String webappUploads = "src/main/webapp/uploads/categories";
                    File uploadDir = new File(webappUploads);
                    if (!uploadDir.exists()) {
                        uploadDir.mkdirs();
                    }

                    String savedFileName = "category-" + categoryKey + "-" + System.currentTimeMillis() + "." + ext;
                    File destFile = new File(uploadDir, savedFileName);
                    try (FileOutputStream fos = new FileOutputStream(destFile)) {
                        fos.write(imageBytes);
                        fos.flush();
                    } catch (Exception e) {
                        return ApiResponse.error(500, "Failed to write image file to disk: " + e.getMessage());
                    }

                    // Also mirror to GitHub local workspace if it exists
                    try {
                        String githubUploads = "C:/Users/Clark L. Montoya/OneDrive/Documents/GitHub/lazaroph/src/main/webapp/uploads/categories";
                        File githubDir = new File(githubUploads);
                        if (githubDir.exists() || (githubDir.getParentFile() != null && githubDir.getParentFile().exists())) {
                            githubDir.mkdirs();
                            File githubDest = new File(githubDir, savedFileName);
                            try (FileOutputStream fos = new FileOutputStream(githubDest)) {
                                fos.write(imageBytes);
                                fos.flush();
                            }
                        }
                    } catch (Exception ignored) {}

                    String publicUrl = "uploads/categories/" + savedFileName;
                    String adminName = currentAdmin != null ? currentAdmin.getName() : "Super Admin";
                    FeaturedCategory updated = store.updateFeaturedCategoryImage(categoryKey, publicUrl, adminName);

                    Map<String, Object> respData = new LinkedHashMap<>();
                    respData.put("success", true);
                    respData.put("imageUrl", publicUrl);
                    respData.put("category", updated);
                    respData.put("message", "Image for " + categoryKey.toUpperCase() + " successfully uploaded and set as homepage background!");
                    return ApiResponse.ok(respData);
                }

                if (path.equals("/api/admin/featured-categories/reset") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    String categoryKey = req.containsKey("categoryKey") ? ((String) req.get("categoryKey")).toLowerCase().trim() : "";
                    if (categoryKey.isEmpty()) {
                        return ApiResponse.error(400, "categoryKey is required.");
                    }
                    String defaultUrl = "images/category-" + categoryKey + ".jpg";
                    if ("slides".equals(categoryKey)) defaultUrl = "images/cat-slides.png";
                    String adminName = currentAdmin != null ? currentAdmin.getName() : "Super Admin";
                    FeaturedCategory updated = store.updateFeaturedCategoryImage(categoryKey, defaultUrl, adminName);
                    return ApiResponse.ok(updated);
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

                if (path.matches("^/api/admin/orders/\\d+/delivery$") && "POST".equalsIgnoreCase(method)) {
                    int orderId = Integer.parseInt(path.split("/")[4]);
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    Order updated = store.updateOrderDelivery(orderId, req);
                    if (updated == null) return ApiResponse.error(404, "Order not found.");
                    return ApiResponse.ok(updated);
                }

                if (path.equals("/api/admin/orders/dispatch-lalamove") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    int orderId = ((Number) req.get("orderId")).intValue();
                    String vehicle = req.get("vehicleType") != null ? req.get("vehicleType").toString() : "Motorcycle";
                    Order updated = courierService.dispatchLalamove(orderId, vehicle);
                    return ApiResponse.ok(updated);
                }

                if (path.equals("/api/admin/orders/generate-lbc-waybill") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    int orderId = ((Number) req.get("orderId")).intValue();
                    String packaging = req.get("packagingType") != null ? req.get("packagingType").toString() : "KiloBox Large";
                    Order updated = courierService.generateLbcWaybill(orderId, packaging);
                    return ApiResponse.ok(updated);
                }

                if (path.equals("/api/admin/orders/courier-status") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    int orderId = ((Number) req.get("orderId")).intValue();
                    String courierStatus = (String) req.get("courierStatus");
                    Order updated = courierService.updateCourierStatus(orderId, courierStatus);
                    return ApiResponse.ok(updated);
                }

                if (path.equals("/api/admin/courier-settings") && "GET".equalsIgnoreCase(method)) {
                    Map<String, String> s = store.getStoreSettings();
                    Map<String, Object> courierData = new LinkedHashMap<>();
                    courierData.put("lalamoveApiKey", s.getOrDefault("lalamoveApiKey", ""));
                    courierData.put("lalamoveApiSecret", s.getOrDefault("lalamoveApiSecret", ""));
                    courierData.put("lalamoveEnv", s.getOrDefault("lalamoveEnv", "SANDBOX"));
                    courierData.put("lalamoveMarket", s.getOrDefault("lalamoveMarket", "PH"));
                    courierData.put("lbcAccountNumber", s.getOrDefault("lbcAccountNumber", ""));
                    courierData.put("lbcApiToken", s.getOrDefault("lbcApiToken", ""));
                    courierData.put("lbcPackaging", s.getOrDefault("lbcPackaging", "KB_LARGE"));
                    courierData.put("defaultDispatchBranch", s.getOrDefault("defaultDispatchBranch", "Concepcion Uno, Marikina"));
                    return ApiResponse.ok(courierData);
                }

                if (path.equals("/api/admin/courier-settings") && "POST".equalsIgnoreCase(method)) {
                    Map<String, Object> req = JsonUtil.parseJsonObject(body);
                    store.updateStoreSettings(req);
                    return ApiResponse.message("Lalamove and LBC logistics credentials saved successfully!");
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
