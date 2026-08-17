package com.lazaroph.model;

import java.math.BigDecimal;

public class ProductVariant {
    private int id;
    private int productId;
    private String size;
    private String color;
    private String colorHex;
    private int stock;
    private BigDecimal price; // null if uses product base price
    private String skuVariant;

    public ProductVariant() {}

    public ProductVariant(int id, int productId, String size, String color, String colorHex, int stock, BigDecimal price, String skuVariant) {
        this.id = id;
        this.productId = productId;
        this.size = size;
        this.color = color;
        this.colorHex = colorHex != null ? colorHex : "#000000";
        this.stock = stock;
        this.price = price;
        this.skuVariant = skuVariant;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getSkuVariant() { return skuVariant; }
    public void setSkuVariant(String skuVariant) { this.skuVariant = skuVariant; }

    public boolean isAvailable() {
        return this.stock > 0;
    }
}
