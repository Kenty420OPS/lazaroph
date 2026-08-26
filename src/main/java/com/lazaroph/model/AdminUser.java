package com.lazaroph.model;

import java.sql.Timestamp;

public class AdminUser {
    private int id;
    private String name;
    private String email;
    private String passwordHash;
    private String securityPasswordHash;
    private String role; // Always "SUPER_ADMIN"
    private String status; // "ACTIVE" or "DISABLED"
    private int failedSecurityAttempts;
    private Timestamp securityLockedUntil;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public AdminUser() {
        this.role = "SUPER_ADMIN";
        this.status = "ACTIVE";
        this.failedSecurityAttempts = 0;
    }

    public AdminUser(int id, String name, String email, String passwordHash, String securityPasswordHash, String role, String status) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.securityPasswordHash = securityPasswordHash;
        this.role = (role != null) ? role : "SUPER_ADMIN";
        this.status = (status != null) ? status : "ACTIVE";
        this.failedSecurityAttempts = 0;
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

    public String getSecurityPasswordHash() { return securityPasswordHash; }
    public void setSecurityPasswordHash(String securityPasswordHash) { this.securityPasswordHash = securityPasswordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getFailedSecurityAttempts() { return failedSecurityAttempts; }
    public void setFailedSecurityAttempts(int failedSecurityAttempts) { this.failedSecurityAttempts = failedSecurityAttempts; }

    public Timestamp getSecurityLockedUntil() { return securityLockedUntil; }
    public void setSecurityLockedUntil(Timestamp securityLockedUntil) { this.securityLockedUntil = securityLockedUntil; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(this.status);
    }

    public boolean isSuperAdmin() {
        return "SUPER_ADMIN".equalsIgnoreCase(this.role);
    }

    public boolean isLocked() {
        if (securityLockedUntil == null) return false;
        return securityLockedUntil.after(new Timestamp(System.currentTimeMillis()));
    }
}
