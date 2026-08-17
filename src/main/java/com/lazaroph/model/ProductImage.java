package com.lazaroph.model;

public class ProductImage {
    private int id;
    private int productId;
    private String imageUrl;
    private boolean isMain;
    private int sortOrder;

    public ProductImage() {}

    public ProductImage(int id, int productId, String imageUrl, boolean isMain, int sortOrder) {
        this.id = id;
        this.productId = productId;
        this.imageUrl = imageUrl;
        this.isMain = isMain;
        this.sortOrder = sortOrder;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isMain() { return isMain; }
    public void setMain(boolean isMain) { this.isMain = isMain; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
