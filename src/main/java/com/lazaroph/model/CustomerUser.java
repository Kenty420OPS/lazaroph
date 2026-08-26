package com.lazaroph.model;

import java.sql.Timestamp;

public class CustomerUser {
    private int id;
    private String name;
    private String email;
    private String passwordHash;
    private String phone;
    private String address;
    private String city;
    private String province;
    private String zipCode;
    private String status; // "PENDING", "VERIFIED", "DISABLED"
    private String verificationToken;
    private Timestamp verificationExpires;
    private String resetToken;
    private Timestamp resetExpires;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public CustomerUser() {
        this.status = "PENDING";
    }

    public CustomerUser(int id, String name, String email, String passwordHash, String phone, String address, String city, String province, String zipCode, String status) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.province = province;
        this.zipCode = zipCode;
        this.status = (status != null) ? status : "PENDING";
        this.createdAt = new Timestamp(System.currentTimeMillis());
        this.updatedAt = new Timestamp(System.currentTimeMillis());
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public Timestamp getVerificationExpires() { return verificationExpires; }
    public void setVerificationExpires(Timestamp verificationExpires) { this.verificationExpires = verificationExpires; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public Timestamp getResetExpires() { return resetExpires; }
    public void setResetExpires(Timestamp resetExpires) { this.resetExpires = resetExpires; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public boolean isVerified() {
        return "VERIFIED".equalsIgnoreCase(this.status);
    }

    public boolean isPending() {
        return "PENDING".equalsIgnoreCase(this.status);
    }

    public boolean isDisabled() {
        return "DISABLED".equalsIgnoreCase(this.status);
    }
}
