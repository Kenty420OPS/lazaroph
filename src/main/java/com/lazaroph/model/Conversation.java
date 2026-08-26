package com.lazaroph.model;

import java.sql.Timestamp;

public class Conversation {
    private int id;
    private int customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Integer orderId;
    private String orderNumber;
    private String title;
    private String status = "ACTIVE"; // ACTIVE, CLOSED
    private String lastMessage;
    private Timestamp lastMessageTime;
    private int unreadAdminCount;
    private int unreadCustomerCount;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public Conversation() {}

    public Conversation(int id, int customerId, String customerName, String customerEmail, String customerPhone, Integer orderId, String orderNumber, String title) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.title = title;
        this.createdAt = new Timestamp(System.currentTimeMillis());
        this.updatedAt = this.createdAt;
        this.lastMessageTime = this.createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public Timestamp getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(Timestamp lastMessageTime) { this.lastMessageTime = lastMessageTime; }

    public int getUnreadAdminCount() { return unreadAdminCount; }
    public void setUnreadAdminCount(int unreadAdminCount) { this.unreadAdminCount = unreadAdminCount; }

    public int getUnreadCustomerCount() { return unreadCustomerCount; }
    public void setUnreadCustomerCount(int unreadCustomerCount) { this.unreadCustomerCount = unreadCustomerCount; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
