package com.lazaroph.model;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class Product {
    private int id;
    private String name;
    private String sku;
    private String description;
    private String features;
    private String materials;
    private String careInstructions;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private int categoryId;
    private String categoryName;
    private String subcategory;
    private int brandId;
    private String brandName;
    private String gender; // MEN, WOMEN, KIDS, UNISEX
    private String sizeType; // US_MEN_SHOES, US_WOMEN_SHOES, US_KIDS_SHOES, APPAREL, CUSTOM_SIZE, NO_SIZE
    private String status; // ACTIVE, DRAFT, ARCHIVED
    private boolean isFeatured;
    private boolean isNewArrival;
    private boolean isSale;
    private Timestamp createdAt;
    
    private List<ProductImage> images = new ArrayList<>();
    private List<ProductVariant> variants = new ArrayList<>();

    public Product() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    public String getMaterials() { return materials; }
    public void setMaterials(String materials) { this.materials = materials; }

    public String getCareInstructions() { return careInstructions; }
    public void setCareInstructions(String careInstructions) { this.careInstructions = careInstructions; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getDiscountPrice() { return discountPrice; }
    public void setDiscountPrice(BigDecimal discountPrice) { this.discountPrice = discountPrice; }

    public int getCategoryId() { return categoryId; }
    public void setCategoryId(int categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }

    public int getBrandId() { return brandId; }
    public void setBrandId(int brandId) { this.brandId = brandId; }

    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getSizeType() { return sizeType; }
    public void setSizeType(String sizeType) { this.sizeType = sizeType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isFeatured() { return isFeatured; }
    public void setFeatured(boolean featured) { isFeatured = featured; }

    public boolean isNewArrival() { return isNewArrival; }
    public void setNewArrival(boolean newArrival) { isNewArrival = newArrival; }

    public boolean isSale() { return isSale; }
    public void setSale(boolean sale) { isSale = sale; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public List<ProductImage> getImages() { return images; }
    public void setImages(List<ProductImage> images) { this.images = images; }

    public List<ProductVariant> getVariants() { return variants; }
    public void setVariants(List<ProductVariant> variants) { this.variants = variants; }

    public String getMainImageUrl() {
        if (images != null) {
            for (ProductImage img : images) {
                if (img.isMain()) return img.getImageUrl();
            }
            if (!images.isEmpty()) return images.get(0).getImageUrl();
        }
        return "/images/placeholder-product.png";
    }

    public int getTotalStock() {
        if (variants == null) return 0;
        int total = 0;
        for (ProductVariant v : variants) {
            total += v.getStock();
        }
        return total;
    }
}
