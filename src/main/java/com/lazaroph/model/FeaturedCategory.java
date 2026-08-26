package com.lazaroph.model;

public class FeaturedCategory {
    private String key;
    private String name;
    private String badge;
    private String description;
    private String buttonText;
    private String targetRoute;
    private String cardSize;
    private String imageUrl;
    private long updatedAt;
    private String updatedBy;

    public FeaturedCategory() {}

    public FeaturedCategory(String key, String name, String badge, String description,
                            String buttonText, String targetRoute, String cardSize,
                            String imageUrl, long updatedAt, String updatedBy) {
        this.key = key;
        this.name = name;
        this.badge = badge;
        this.description = description;
        this.buttonText = buttonText;
        this.targetRoute = targetRoute;
        this.cardSize = cardSize;
        this.imageUrl = imageUrl;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getButtonText() { return buttonText; }
    public void setButtonText(String buttonText) { this.buttonText = buttonText; }

    public String getTargetRoute() { return targetRoute; }
    public void setTargetRoute(String targetRoute) { this.targetRoute = targetRoute; }

    public String getCardSize() { return cardSize; }
    public void setCardSize(String cardSize) { this.cardSize = cardSize; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
