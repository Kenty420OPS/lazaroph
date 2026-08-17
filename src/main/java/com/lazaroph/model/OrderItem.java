package com.lazaroph.model;

import java.math.BigDecimal;

public class OrderItem {
    private int id;
    private int orderId;
    private int productId;
    private int variantId;
    private String productName;
    private String size;
    private String color;
    private BigDecimal price;
    private int quantity;
    private BigDecimal subtotal;
    private String customizationData;

    public OrderItem() {}

    public OrderItem(int id, int orderId, int productId, int variantId, String productName, String size, String color, BigDecimal price, int quantity, BigDecimal subtotal, String customizationData) {
        this.id = id;
        this.orderId = orderId;
        this.productId = productId;
        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.price = price;
        this.quantity = quantity;
        this.subtotal = subtotal;
        this.customizationData = customizationData;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }

    public int getVariantId() { return variantId; }
    public void setVariantId(int variantId) { this.variantId = variantId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public String getCustomizationData() { return customizationData; }
    public void setCustomizationData(String customizationData) { this.customizationData = customizationData; }
}
