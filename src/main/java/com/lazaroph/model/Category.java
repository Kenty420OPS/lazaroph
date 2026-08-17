package com.lazaroph.model;

public class Category {
    private int id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;

    public Category() {}

    public Category(int id, String name, String slug, String description, String imageUrl) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
