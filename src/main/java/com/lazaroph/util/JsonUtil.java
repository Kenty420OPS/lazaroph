package com.lazaroph.util;

import com.lazaroph.model.*;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.*;

public class JsonUtil {
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) {
            return "\"" + escape((String) obj) + "\"";
        }
        if (obj instanceof Number || obj instanceof Boolean) {
            return obj.toString();
        }
        if (obj instanceof Timestamp) {
            return "\"" + DATE_FORMAT.format((Timestamp) obj) + "\"";
        }
        if (obj instanceof Date) {
            return "\"" + DATE_FORMAT.format((Date) obj) + "\"";
        }
        if (obj instanceof Map<?, ?>) {
            Map<?, ?> map = (Map<?, ?>) obj;
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) sb.append(",");
                sb.append("\"").append(escape(String.valueOf(entry.getKey()))).append("\":");
                sb.append(toJson(entry.getValue()));
                first = false;
            }
            sb.append("}");
            return sb.toString();
        }
        if (obj instanceof Collection<?>) {
            Collection<?> col = (Collection<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : col) {
                if (!first) sb.append(",");
                sb.append(toJson(item));
                first = false;
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj.getClass().isArray()) {
            Object[] arr = (Object[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(toJson(arr[i]));
            }
            sb.append("]");
            return sb.toString();
        }

        // Domain models
        if (obj instanceof User) {
            User u = (User) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("phone", u.getPhone());
            m.put("address", u.getAddress());
            m.put("city", u.getCity());
            m.put("province", u.getProvince());
            m.put("zipCode", u.getZipCode());
            m.put("createdAt", u.getCreatedAt());
            return toJson(m);
        }
        if (obj instanceof Category) {
            Category c = (Category) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("slug", c.getSlug());
            m.put("description", c.getDescription());
            m.put("imageUrl", c.getImageUrl());
            return toJson(m);
        }
        if (obj instanceof FeaturedCategory) {
            FeaturedCategory fc = (FeaturedCategory) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", fc.getKey());
            m.put("name", fc.getName());
            m.put("badge", fc.getBadge());
            m.put("description", fc.getDescription());
            m.put("buttonText", fc.getButtonText());
            m.put("targetRoute", fc.getTargetRoute());
            m.put("cardSize", fc.getCardSize());
            m.put("imageUrl", fc.getImageUrl());
            m.put("updatedAt", fc.getUpdatedAt());
            m.put("updatedBy", fc.getUpdatedBy());
            return toJson(m);
        }
        if (obj instanceof Brand) {
            Brand b = (Brand) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("name", b.getName());
            m.put("slug", b.getSlug());
            m.put("logoUrl", b.getLogoUrl());
            m.put("description", b.getDescription());
            m.put("status", b.getStatus());
            m.put("productCount", b.getProductCount());
            return toJson(m);
        }
        if (obj instanceof ProductImage) {
            ProductImage pi = (ProductImage) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", pi.getId());
            m.put("productId", pi.getProductId());
            m.put("imageUrl", pi.getImageUrl());
            m.put("isMain", pi.isMain());
            m.put("sortOrder", pi.getSortOrder());
            return toJson(m);
        }
        if (obj instanceof ProductVariant) {
            ProductVariant pv = (ProductVariant) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", pv.getId());
            m.put("productId", pv.getProductId());
            m.put("size", pv.getSize());
            m.put("color", pv.getColor());
            m.put("colorHex", pv.getColorHex());
            m.put("stock", pv.getStock());
            m.put("price", pv.getPrice());
            m.put("skuVariant", pv.getSkuVariant());
            m.put("isAvailable", pv.isAvailable());
            return toJson(m);
        }
        if (obj instanceof Product) {
            Product p = (Product) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("sku", p.getSku());
            m.put("description", p.getDescription());
            m.put("features", p.getFeatures());
            m.put("materials", p.getMaterials());
            m.put("careInstructions", p.getCareInstructions());
            m.put("price", p.getPrice());
            m.put("discountPrice", p.getDiscountPrice());
            m.put("categoryId", p.getCategoryId());
            m.put("categoryName", p.getCategoryName());
            m.put("subcategory", p.getSubcategory());
            m.put("brandId", p.getBrandId());
            m.put("brandName", p.getBrandName());
            m.put("gender", p.getGender());
            m.put("sizeType", p.getSizeType());
            m.put("status", p.getStatus());
            m.put("isFeatured", p.isFeatured());
            m.put("isNewArrival", p.isNewArrival());
            m.put("isSale", p.isSale());
            m.put("createdAt", p.getCreatedAt());
            m.put("mainImageUrl", p.getMainImageUrl());
            m.put("totalStock", p.getTotalStock());
            m.put("images", p.getImages());
            m.put("variants", p.getVariants());
            return toJson(m);
        }
        if (obj instanceof CartItem) {
            CartItem ci = (CartItem) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", ci.getId());
            m.put("cartId", ci.getCartId());
            m.put("productId", ci.getProductId());
            m.put("variantId", ci.getVariantId());
            m.put("productName", ci.getProductName());
            m.put("imageUrl", ci.getImageUrl());
            m.put("size", ci.getSize());
            m.put("color", ci.getColor());
            m.put("quantity", ci.getQuantity());
            m.put("price", ci.getPrice());
            m.put("subtotal", ci.getSubtotal());
            m.put("stockAvailable", ci.getStockAvailable());
            m.put("customizationData", ci.getCustomizationData());
            return toJson(m);
        }
        if (obj instanceof OrderItem) {
            OrderItem oi = (OrderItem) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", oi.getId());
            m.put("orderId", oi.getOrderId());
            m.put("productId", oi.getProductId());
            m.put("variantId", oi.getVariantId());
            m.put("productName", oi.getProductName());
            m.put("size", oi.getSize());
            m.put("color", oi.getColor());
            m.put("price", oi.getPrice());
            m.put("quantity", oi.getQuantity());
            m.put("subtotal", oi.getSubtotal());
            m.put("customizationData", oi.getCustomizationData());
            return toJson(m);
        }
        if (obj instanceof Order) {
            Order o = (Order) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", o.getId());
            m.put("orderNumber", o.getOrderNumber());
            m.put("userId", o.getUserId());
            m.put("customerName", o.getCustomerName());
            m.put("customerEmail", o.getCustomerEmail());
            m.put("customerPhone", o.getCustomerPhone());
            m.put("shippingAddress", o.getShippingAddress());
            m.put("shippingCity", o.getShippingCity());
            m.put("shippingProvince", o.getShippingProvince());
            m.put("shippingZip", o.getShippingZip());
            m.put("paymentMethod", o.getPaymentMethod());
            m.put("paymentReference", o.getPaymentReference());
            m.put("subtotal", o.getSubtotal());
            m.put("shippingFee", o.getShippingFee());
            m.put("total", o.getTotal());
            m.put("status", o.getStatus());
            m.put("courier", o.getCourier());
            m.put("courierTrackingNumber", o.getCourierTrackingNumber());
            m.put("courierTrackingUrl", o.getCourierTrackingUrl());
            m.put("courierStatus", o.getCourierStatus());
            m.put("pickupBranch", o.getPickupBranch());
            m.put("driverName", o.getDriverName());
            m.put("driverPhone", o.getDriverPhone());
            m.put("driverPlate", o.getDriverPlate());
            m.put("estimatedDelivery", o.getEstimatedDelivery());
            m.put("waybillUrl", o.getWaybillUrl());
            m.put("notes", o.getNotes());
            m.put("deliveryFeeConfirmed", o.isDeliveryFeeConfirmed());
            m.put("riderName", o.getRiderName());
            m.put("riderPhone", o.getRiderPhone());
            m.put("estimatedDeliveryTime", o.getEstimatedDeliveryTime());
            m.put("lbcTrackingNumber", o.getLbcTrackingNumber());
            m.put("shippingDate", o.getShippingDate());
            m.put("estimatedDeliveryDate", o.getEstimatedDeliveryDate());
            m.put("deliveryNotes", o.getDeliveryNotes());
            m.put("createdAt", o.getCreatedAt());
            m.put("items", o.getItems());
            return toJson(m);
        }
        if (obj instanceof Conversation) {
            Conversation conv = (Conversation) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", conv.getId());
            m.put("customerId", conv.getCustomerId());
            m.put("customerName", conv.getCustomerName());
            m.put("customerEmail", conv.getCustomerEmail());
            m.put("customerPhone", conv.getCustomerPhone());
            m.put("orderId", conv.getOrderId());
            m.put("orderNumber", conv.getOrderNumber());
            m.put("lastMessage", conv.getLastMessage());
            m.put("lastMessageTime", conv.getLastMessageTime());
            m.put("unreadCustomerCount", conv.getUnreadCustomerCount());
            m.put("unreadAdminCount", conv.getUnreadAdminCount());
            m.put("status", conv.getStatus());
            m.put("createdAt", conv.getCreatedAt());
            m.put("updatedAt", conv.getUpdatedAt());
            return toJson(m);
        }
        if (obj instanceof ChatMessage) {
            ChatMessage msg = (ChatMessage) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", msg.getId());
            m.put("conversationId", msg.getConversationId());
            m.put("senderId", msg.getSenderId());
            m.put("senderName", msg.getSenderName());
            m.put("senderRole", msg.getSenderRole());
            m.put("message", msg.getMessage());
            m.put("imageUrl", msg.getImageUrl());
            m.put("messageType", msg.getMessageType());
            m.put("isRead", msg.isRead());
            m.put("createdAt", msg.getCreatedAt());
            return toJson(m);
        }
        if (obj instanceof com.lazaroph.service.CourierService.CourierQuote) {
            com.lazaroph.service.CourierService.CourierQuote q = (com.lazaroph.service.CourierService.CourierQuote) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("courier", q.courier);
            m.put("courierName", q.courierName);
            m.put("fee", q.fee);
            m.put("formattedFee", q.formattedFee);
            m.put("estimatedDelivery", q.estimatedDelivery);
            m.put("isAvailable", q.isAvailable);
            m.put("note", q.note);
            return toJson(m);
        }
        if (obj instanceof CustomOrder) {
            CustomOrder co = (CustomOrder) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", co.getId());
            m.put("orderId", co.getOrderId());
            m.put("orderItemId", co.getOrderItemId());
            m.put("orderNumber", co.getOrderNumber());
            m.put("customerName", co.getCustomerName());
            m.put("customerEmail", co.getCustomerEmail());
            m.put("jerseyName", co.getJerseyName());
            m.put("jerseyNumber", co.getJerseyNumber());
            m.put("teamName", co.getTeamName());
            m.put("size", co.getSize());
            m.put("color", co.getColor());
            m.put("jerseyDesign", co.getJerseyDesign());
            m.put("logoUrl", co.getLogoUrl());
            m.put("customizationNotes", co.getCustomizationNotes());
            m.put("status", co.getStatus());
            m.put("createdAt", co.getCreatedAt());
            return toJson(m);
        }
        if (obj instanceof DashboardStats) {
            DashboardStats ds = (DashboardStats) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("totalSales", ds.getTotalSales());
            m.put("totalOrders", ds.getTotalOrders());
            m.put("totalCustomers", ds.getTotalCustomers());
            m.put("totalProducts", ds.getTotalProducts());
            m.put("lowStockCount", ds.getLowStockCount());
            m.put("recentOrders", ds.getRecentOrders());
            m.put("lowStockProducts", ds.getLowStockProducts());
            m.put("salesByCategory", ds.getSalesByCategory());
            m.put("dailySalesTrend", ds.getDailySalesTrend());
            return toJson(m);
        }
        if (obj instanceof CustomerUser) {
            CustomerUser cu = (CustomerUser) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", cu.getId());
            m.put("name", cu.getName());
            m.put("email", cu.getEmail());
            m.put("phone", cu.getPhone());
            m.put("address", cu.getAddress());
            m.put("city", cu.getCity());
            m.put("province", cu.getProvince());
            m.put("zipCode", cu.getZipCode());
            m.put("status", cu.getStatus());
            m.put("isVerified", cu.isVerified());
            m.put("createdAt", cu.getCreatedAt());
            return toJson(m);
        }
        if (obj instanceof AdminUser) {
            AdminUser au = (AdminUser) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", au.getId());
            m.put("name", au.getName());
            m.put("email", au.getEmail());
            m.put("role", au.getRole());
            m.put("status", au.getStatus());
            m.put("isLocked", au.isLocked());
            m.put("createdAt", au.getCreatedAt());
            return toJson(m);
        }
        if (obj instanceof com.lazaroph.service.AuthService.SimulatedEmail) {
            com.lazaroph.service.AuthService.SimulatedEmail se = (com.lazaroph.service.AuthService.SimulatedEmail) obj;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("toEmail", se.toEmail);
            m.put("toName", se.toName);
            m.put("subject", se.subject);
            m.put("type", se.type);
            m.put("token", se.token);
            m.put("actionUrl", se.actionUrl);
            m.put("snippet", se.snippet);
            m.put("sentAt", se.sentAt);
            return toJson(m);
        }

        return "\"" + escape(obj.toString()) + "\"";
    }

    private static String escape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch < ' ') {
                        String hex = "000" + Integer.toHexString(ch);
                        sb.append("\\u").append(hex.substring(hex.length() - 4));
                    } else {
                        sb.append(ch);
                    }
            }
        }
        return sb.toString();
    }

    public static Map<String, Object> parseJsonObject(String json) {
        if (json == null) return new LinkedHashMap<>();
        json = json.trim();
        if (!json.startsWith("{") || !json.endsWith("}")) return new LinkedHashMap<>();

        Map<String, Object> map = new LinkedHashMap<>();
        int index = 1;
        int len = json.length();

        while (index < len - 1) {
            index = skipWhitespace(json, index);
            if (index >= len - 1 || json.charAt(index) == '}') break;

            String key;
            if (json.charAt(index) == '"') {
                int keyEnd = findStringEnd(json, index);
                key = unescape(json.substring(index + 1, keyEnd));
                index = keyEnd + 1;
            } else {
                // Unquoted key
                int keyEnd = index;
                while (keyEnd < len && json.charAt(keyEnd) != ':' && !Character.isWhitespace(json.charAt(keyEnd))) {
                    keyEnd++;
                }
                key = json.substring(index, keyEnd).trim();
                index = keyEnd;
            }

            // Find colon
            index = skipWhitespace(json, index);
            if (index < len && json.charAt(index) == ':') index++;
            index = skipWhitespace(json, index);

            // Read Value
            ValueParseResult vpr = parseValue(json, index);
            map.put(key, vpr.value);
            index = vpr.nextIndex;

            index = skipWhitespace(json, index);
            if (index < len && json.charAt(index) == ',') {
                index++;
            }
        }
        return map;
    }

    public static List<Object> parseJsonArray(String json) {
        if (json == null) return new ArrayList<>();
        json = json.trim();
        if (!json.startsWith("[") || !json.endsWith("]")) return new ArrayList<>();

        List<Object> list = new ArrayList<>();
        int index = 1;
        int len = json.length();

        while (index < len - 1) {
            index = skipWhitespace(json, index);
            if (index >= len - 1 || json.charAt(index) == ']') break;

            ValueParseResult vpr = parseValue(json, index);
            list.add(vpr.value);
            index = vpr.nextIndex;

            index = skipWhitespace(json, index);
            if (index < len && json.charAt(index) == ',') {
                index++;
            }
        }
        return list;
    }

    private static class ValueParseResult {
        Object value;
        int nextIndex;
        ValueParseResult(Object value, int nextIndex) {
            this.value = value;
            this.nextIndex = nextIndex;
        }
    }

    private static ValueParseResult parseValue(String json, int index) {
        index = skipWhitespace(json, index);
        if (index >= json.length()) return new ValueParseResult(null, index);

        char c = json.charAt(index);
        if (c == '"') {
            int end = findStringEnd(json, index);
            String str = unescape(json.substring(index + 1, end));
            return new ValueParseResult(str, end + 1);
        } else if (c == '{') {
            int end = findMatchingBracket(json, index, '{', '}');
            String sub = json.substring(index, end + 1);
            Map<String, Object> map = parseJsonObject(sub);
            return new ValueParseResult(map, end + 1);
        } else if (c == '[') {
            int end = findMatchingBracket(json, index, '[', ']');
            String sub = json.substring(index, end + 1);
            List<Object> list = parseJsonArray(sub);
            return new ValueParseResult(list, end + 1);
        } else if (c == 't' || c == 'T') {
            return new ValueParseResult(true, index + 4);
        } else if (c == 'f' || c == 'F') {
            return new ValueParseResult(false, index + 5);
        } else if (c == 'n' || c == 'N') {
            return new ValueParseResult(null, index + 4);
        } else {
            // Number or unquoted value
            int end = index;
            while (end < json.length() && ",}]".indexOf(json.charAt(end)) < 0) {
                end++;
            }
            String numStr = json.substring(index, end).trim();
            try {
                if (numStr.contains(".")) {
                    return new ValueParseResult(Double.parseDouble(numStr), end);
                } else {
                    return new ValueParseResult(Long.parseLong(numStr), end);
                }
            } catch (Exception e) {
                return new ValueParseResult(numStr, end);
            }
        }
    }

    private static int skipWhitespace(String s, int index) {
        while (index < s.length() && Character.isWhitespace(s.charAt(index))) {
            index++;
        }
        return index;
    }

    private static int findStringEnd(String s, int start) {
        boolean escape = false;
        for (int i = start + 1; i < s.length(); i++) {
            char c = s.charAt(i);
            if (escape) {
                escape = false;
            } else if (c == '\\') {
                escape = true;
            } else if (c == '"') {
                return i;
            }
        }
        return s.length() - 1;
    }

    private static int findMatchingBracket(String s, int start, char open, char close) {
        int depth = 0;
        boolean inString = false;
        boolean escape = false;
        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);
            if (inString) {
                if (escape) {
                    escape = false;
                } else if (c == '\\') {
                    escape = true;
                } else if (c == '"') {
                    inString = false;
                }
            } else {
                if (c == '"') {
                    inString = true;
                } else if (c == open) {
                    depth++;
                } else if (c == close) {
                    depth--;
                    if (depth == 0) return i;
                }
            }
        }
        return s.length() - 1;
    }

    private static String unescape(String s) {
        if (s == null || !s.contains("\\")) return s;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char next = s.charAt(i + 1);
                switch (next) {
                    case '"': sb.append('"'); i++; break;
                    case '\\': sb.append('\\'); i++; break;
                    case '/': sb.append('/'); i++; break;
                    case 'b': sb.append('\b'); i++; break;
                    case 'f': sb.append('\f'); i++; break;
                    case 'n': sb.append('\n'); i++; break;
                    case 'r': sb.append('\r'); i++; break;
                    case 't': sb.append('\t'); i++; break;
                    case 'u':
                        if (i + 5 < s.length()) {
                            try {
                                int hexVal = Integer.parseInt(s.substring(i + 2, i + 6), 16);
                                sb.append((char) hexVal);
                                i += 5;
                            } catch (Exception e) {
                                sb.append(c);
                            }
                        } else {
                            sb.append(c);
                        }
                        break;
                    default:
                        sb.append(next);
                        i++;
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
