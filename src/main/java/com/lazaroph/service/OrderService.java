package com.lazaroph.service;

import com.lazaroph.model.*;
import com.lazaroph.repository.DataStore;

import java.math.BigDecimal;
import java.util.List;

public class OrderService {
    private static final OrderService INSTANCE = new OrderService();
    public static OrderService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();
    private final CourierService courierService = CourierService.getInstance();

    private OrderService() {}

    public synchronized Order checkout(
            String sessionKey,
            User currentUser,
            String customerName,
            String customerEmail,
            String customerPhone,
            String shippingAddress,
            String shippingCity,
            String shippingProvince,
            String shippingZip,
            String paymentMethod,
            String paymentReference,
            String notes,
            String courier,
            String pickupBranch
    ) {
        List<CartItem> cartItems = store.getCartItems(sessionKey);
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Your cart is empty.");
        }

        // Validate variant stock availability before committing
        for (CartItem ci : cartItems) {
            ProductVariant variant = store.findVariantById(ci.getVariantId());
            if (variant == null || variant.getStock() < ci.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for " + ci.getProductName() + " (" + ci.getSize() + "). Available: " + (variant != null ? variant.getStock() : 0));
            }
        }

        Order order = new Order();
        if (currentUser != null) {
            order.setUserId(currentUser.getId());
        }
        order.setCustomerName(customerName != null ? customerName.trim() : (currentUser != null ? currentUser.getName() : "Customer"));
        order.setCustomerEmail(customerEmail != null ? customerEmail.trim() : (currentUser != null ? currentUser.getEmail() : ""));
        order.setCustomerPhone(customerPhone != null ? customerPhone.trim() : (currentUser != null ? currentUser.getPhone() : ""));
        order.setShippingAddress(shippingAddress != null ? shippingAddress.trim() : "");
        order.setShippingCity(shippingCity != null ? shippingCity.trim() : "Marikina");
        order.setShippingProvince(shippingProvince != null ? shippingProvince.trim() : "Metro Manila");
        order.setShippingZip(shippingZip != null ? shippingZip.trim() : "1805");
        order.setPaymentMethod(paymentMethod != null ? paymentMethod : "GCash");
        order.setPaymentReference(paymentReference != null ? paymentReference.trim() : "");
        order.setNotes(notes);
        order.setStatus("Pending Order");

        // Set Manual Logistics & Delivery
        String selectedCourier = (courier != null && !courier.trim().isEmpty()) ? courier.trim().toUpperCase() : "LALAMOVE";
        order.setCourier(selectedCourier);
        order.setPickupBranch(pickupBranch != null && !pickupBranch.trim().isEmpty() ? pickupBranch.trim() : "Concepcion Uno, Marikina");
        order.setCourierStatus("Pending Order");

        if ("STORE_PICKUP".equals(selectedCourier)) {
            order.setEstimatedDelivery("Ready for pickup upon store confirmation");
            order.setShippingFee(BigDecimal.ZERO);
            order.setDeliveryFeeConfirmed(true);
        } else if ("LALAMOVE".equals(selectedCourier)) {
            order.setEstimatedDelivery("Same-Day Delivery (Lalamove)");
            order.setShippingFee(BigDecimal.ZERO); // Displayed as "To be Confirmed"
            order.setDeliveryFeeConfirmed(false);
        } else {
            order.setEstimatedDelivery("2-4 Business Days (LBC Express)");
            order.setShippingFee(BigDecimal.ZERO); // Displayed as "To be Confirmed"
            order.setDeliveryFeeConfirmed(false);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem ci : cartItems) {
            OrderItem oi = new OrderItem();
            oi.setProductId(ci.getProductId());
            oi.setVariantId(ci.getVariantId());
            oi.setProductName(ci.getProductName());
            oi.setSize(ci.getSize());
            oi.setColor(ci.getColor());
            oi.setPrice(ci.getPrice());
            oi.setQuantity(ci.getQuantity());
            oi.setSubtotal(ci.getSubtotal());
            oi.setCustomizationData(ci.getCustomizationData());
            order.getItems().add(oi);

            subtotal = subtotal.add(ci.getSubtotal());
        }

        order.setSubtotal(subtotal);
        order.setTotal(subtotal);

        // Create order and decrement specific variant inventory
        Order createdOrder = store.createOrder(order);

        // Automatically initialize Order Chat Conversation & send Welcome Notification
        Conversation conv = store.getOrCreateConversationForOrder(createdOrder, currentUser);
        if (conv != null) {
            store.addChatMessage(
                conv.getId(),
                null,
                "LAZAROPH System",
                "SYSTEM",
                "Hello " + createdOrder.getCustomerName() + "! We received your order #" + createdOrder.getOrderNumber() + ". Our team will review your order shortly."
            );
        }

        // Clear user cart
        store.clearCart(sessionKey);

        return createdOrder;
    }

    public List<Order> getAllOrders() {
        return store.getAllOrders();
    }

    public Order getOrderById(int id) {
        return store.findOrderById(id);
    }

    public Order getOrderByNumber(String orderNumber) {
        return store.findOrderByNumber(orderNumber);
    }

    public List<Order> getOrdersByUser(int userId) {
        return store.getOrdersByUserId(userId);
    }

    public boolean updateStatus(int orderId, String newStatus) {
        return store.updateOrderStatus(orderId, newStatus);
    }
}
