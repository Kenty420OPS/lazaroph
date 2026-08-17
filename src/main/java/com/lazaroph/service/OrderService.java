package com.lazaroph.service;

import com.lazaroph.model.*;
import com.lazaroph.repository.DataStore;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class OrderService {
    private static final OrderService INSTANCE = new OrderService();
    public static OrderService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();

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
            String notes
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
        order.setStatus("PENDING");

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

        BigDecimal shippingFee = new BigDecimal("150.00");
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setTotal(subtotal.add(shippingFee));

        // Create order and decrement specific variant inventory
        Order createdOrder = store.createOrder(order);

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
