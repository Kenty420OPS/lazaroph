package com.lazaroph.model;

import java.sql.Timestamp;

public class ChatMessage {
    private int id;
    private int conversationId;
    private Integer senderId;
    private String senderName;
    private String senderRole; // "CUSTOMER", "ADMIN", "SYSTEM"
    private String message;
    private String imageUrl;
    private String messageType; // "TEXT", "PAYMENT_PROOF", "PAYMENT_VERIFIED", "IMAGE"
    private boolean isRead;
    private Timestamp createdAt;

    public ChatMessage() {
        this.messageType = "TEXT";
    }

    public ChatMessage(int id, int conversationId, Integer senderId, String senderName, String senderRole, String message) {
        this(id, conversationId, senderId, senderName, senderRole, message, null, "TEXT");
    }

    public ChatMessage(int id, int conversationId, Integer senderId, String senderName, String senderRole, String message, String imageUrl, String messageType) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.message = message;
        this.imageUrl = imageUrl;
        this.messageType = messageType != null ? messageType : "TEXT";
        this.isRead = false;
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getConversationId() { return conversationId; }
    public void setConversationId(int conversationId) { this.conversationId = conversationId; }

    public Integer getSenderId() { return senderId; }
    public void setSenderId(Integer senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
