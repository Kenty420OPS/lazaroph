package com.lazaroph.model;

public class Brand {
    private int id;
    private String name;
    private String slug;
    private String logoUrl;
    private String description;
    private String status = "ACTIVE";
    private int productCount = 0;

    public Brand() {}

    public Brand(int id, String name, String slug, String logoUrl) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.logoUrl = logoUrl;
        this.description = "";
        this.status = "ACTIVE";
    }

    public Brand(int id, String name, String slug, String logoUrl, String description, String status) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.logoUrl = logoUrl;
        this.description = description;
        this.status = status != null ? status : "ACTIVE";
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getProductCount() { return productCount; }
    public void setProductCount(int productCount) { this.productCount = productCount; }
}
