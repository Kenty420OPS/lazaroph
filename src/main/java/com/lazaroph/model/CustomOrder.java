package com.lazaroph.model;

import java.sql.Timestamp;

public class CustomOrder {
    private int id;
    private int orderId;
    private Integer orderItemId;
    private String orderNumber;
    private String customerName;
    private String customerEmail;
    private String jerseyName;
    private String jerseyNumber;
    private String teamName;
    private String size;
    private String color;
    private String jerseyDesign;
    private String logoUrl;
    private String customizationNotes;
    private String status; // PENDING_DESIGN, DESIGN_APPROVED, IN_PRODUCTION, READY, SHIPPED, COMPLETED
    private Timestamp createdAt;

    public CustomOrder() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }

    public Integer getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Integer orderItemId) { this.orderItemId = orderItemId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getJerseyName() { return jerseyName; }
    public void setJerseyName(String jerseyName) { this.jerseyName = jerseyName; }

    public String getJerseyNumber() { return jerseyNumber; }
    public void setJerseyNumber(String jerseyNumber) { this.jerseyNumber = jerseyNumber; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getJerseyDesign() { return jerseyDesign; }
    public void setJerseyDesign(String jerseyDesign) { this.jerseyDesign = jerseyDesign; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getCustomizationNotes() { return customizationNotes; }
    public void setCustomizationNotes(String customizationNotes) { this.customizationNotes = customizationNotes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
