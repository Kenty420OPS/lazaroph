package com.lazaroph.model;

import java.math.BigDecimal;

public class CartItem {
    private int id;
    private int cartId;
    private int productId;
    private int variantId;
    private String productName;
    private String imageUrl;
    private String size;
    private String color;
    private int quantity;
    private BigDecimal price;
    private BigDecimal subtotal;
    private int stockAvailable;
    private String customizationData; // JSON string for customized jerseys

    public CartItem() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getCartId() { return cartId; }
    public void setCartId(int cartId) { this.cartId = cartId; }

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }

    public int getVariantId() { return variantId; }
    public void setVariantId(int variantId) { this.variantId = variantId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { 
        this.quantity = quantity; 
        recalcSubtotal();
    }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { 
        this.price = price; 
        recalcSubtotal();
    }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public int getStockAvailable() { return stockAvailable; }
    public void setStockAvailable(int stockAvailable) { this.stockAvailable = stockAvailable; }

    public String getCustomizationData() { return customizationData; }
    public void setCustomizationData(String customizationData) { this.customizationData = customizationData; }

    private void recalcSubtotal() {
        if (this.price != null && this.quantity > 0) {
            this.subtotal = this.price.multiply(new BigDecimal(this.quantity));
        }
    }
}
