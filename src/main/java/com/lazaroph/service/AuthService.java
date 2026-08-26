package com.lazaroph.service;

import com.lazaroph.model.AdminUser;
import com.lazaroph.model.CustomerUser;
import com.lazaroph.model.User;
import com.lazaroph.repository.DataStore;
import com.lazaroph.util.PasswordHasher;

import java.sql.Timestamp;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {
    private static final AuthService INSTANCE = new AuthService();
    public static AuthService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();

    // Session Mappings
    private final Map<String, Integer> customerTokens = new ConcurrentHashMap<>(); // token -> customerId
    private final Map<String, Integer> adminTokens = new ConcurrentHashMap<>();    // verified admin token -> adminId
    private final Map<String, AdminPreAuthSession> adminPreAuthTokens = new ConcurrentHashMap<>(); // pre-auth token -> session
    private final Map<String, Integer> legacyTokens = new ConcurrentHashMap<>();   // token -> userId

    // Rate Limiting (email/IP -> timestamps)
    private final Map<String, List<Long>> forgotPasswordRateLimits = new ConcurrentHashMap<>();

    // In-memory Simulated Email Outbox for testing/local verification
    private final List<SimulatedEmail> simulatedEmails = Collections.synchronizedList(new ArrayList<>());

    public static class AdminPreAuthSession {
        public final int adminId;
        public final long createdAt;
        public AdminPreAuthSession(int adminId) {
            this.adminId = adminId;
            this.createdAt = System.currentTimeMillis();
        }
        public boolean isExpired() {
            return (System.currentTimeMillis() - createdAt) > (10 * 60 * 1000L); // 10 minutes
        }
    }

    public static class SimulatedEmail {
        public String toEmail;
        public String toName;
        public String subject;
        public String type; // "VERIFICATION" or "PASSWORD_RESET"
        public String token;
        public String actionUrl;
        public String snippet;
        public long sentAt;
    }

    private AuthService() {}

    // =========================================================================
    // CUSTOMER AUTHENTICATION METHODS
    // =========================================================================

    public CustomerUser registerCustomer(String name, String email, String password, String confirmPassword) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Full Name is required.");
        }
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            throw new IllegalArgumentException("A valid email address is required.");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }
        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match. Please re-enter your password.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (store.findCustomerByEmail(normalizedEmail) != null) {
            throw new IllegalArgumentException("An account with this email address already exists. Please log in.");
        }

        CustomerUser customer = new CustomerUser();
        customer.setName(name.trim());
        customer.setEmail(normalizedEmail);
        customer.setPasswordHash(PasswordHasher.hashPassword(password));
        customer.setStatus("PENDING");

        // Generate 24-hour secure single-use verification token
        String token = PasswordHasher.generateSecureToken();
        customer.setVerificationToken(token);
        customer.setVerificationExpires(new Timestamp(System.currentTimeMillis() + (24 * 60 * 60 * 1000L)));

        CustomerUser saved = store.saveCustomer(customer);

        // Dispatch verification email
        dispatchVerificationEmail(saved, token);

        return saved;
    }

    public CustomerUser verifyCustomerEmail(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Verification token is missing or invalid.");
        }

        CustomerUser customer = store.findCustomerByVerificationToken(token.trim());
        if (customer == null) {
            throw new IllegalArgumentException("Invalid verification token. The link may have already been used.");
        }

        if (customer.getVerificationExpires() != null && customer.getVerificationExpires().before(new Timestamp(System.currentTimeMillis()))) {
            throw new IllegalArgumentException("Verification link has expired. Please request a new verification email.");
        }

        customer.setStatus("VERIFIED");
        customer.setVerificationToken(null);
        customer.setVerificationExpires(null);
        return store.saveCustomer(customer);
    }

    public boolean resendCustomerVerification(String email) {
        if (email == null || email.trim().isEmpty()) return false;
        CustomerUser customer = store.findCustomerByEmail(email.trim().toLowerCase());
        if (customer == null || !"PENDING".equalsIgnoreCase(customer.getStatus())) {
            return false;
        }

        String newToken = PasswordHasher.generateSecureToken();
        customer.setVerificationToken(newToken);
        customer.setVerificationExpires(new Timestamp(System.currentTimeMillis() + (24 * 60 * 60 * 1000L)));
        store.saveCustomer(customer);

        dispatchVerificationEmail(customer, newToken);
        return true;
    }

    public Map<String, Object> loginCustomer(String email, String password) {
        if (email == null || password == null) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        CustomerUser customer = store.findCustomerByEmail(email.trim().toLowerCase());
        if (customer == null || !PasswordHasher.verify(password, customer.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        if ("PENDING".equalsIgnoreCase(customer.getStatus())) {
            throw new IllegalStateException("PENDING:Please verify your email address before logging in.");
        }

        if ("DISABLED".equalsIgnoreCase(customer.getStatus())) {
            throw new IllegalStateException("DISABLED:Your account has been disabled. Please contact customer support.");
        }

        String token = "cust_" + PasswordHasher.generateSecureToken();
        customerTokens.put(token, customer.getId());

        // Also add to legacy token mapping for any existing storefront services
        User legacyUser = store.findUserById(customer.getId());
        if (legacyUser != null) {
            legacyTokens.put(token, legacyUser.getId());
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token", token);
        res.put("customer", customer);
        return res;
    }

    public boolean forgotCustomerPassword(String email, String clientIp) {
        if (email == null || email.trim().isEmpty()) return true;

        String key = (clientIp != null ? clientIp : "") + "_" + email.trim().toLowerCase();
        long now = System.currentTimeMillis();

        // Rate limiting: Max 3 requests per 15 minutes
        List<Long> attempts = forgotPasswordRateLimits.computeIfAbsent(key, k -> new ArrayList<>());
        synchronized (attempts) {
            attempts.removeIf(t -> (now - t) > (15 * 60 * 1000L));
            if (attempts.size() >= 3) {
                // Rate limited: silently accept to prevent abuse
                return true;
            }
            attempts.add(now);
        }

        CustomerUser customer = store.findCustomerByEmail(email.trim().toLowerCase());
        if (customer != null && !"DISABLED".equalsIgnoreCase(customer.getStatus())) {
            String resetToken = PasswordHasher.generateSecureToken();
            customer.setResetToken(resetToken);
            customer.setResetExpires(new Timestamp(now + (60 * 60 * 1000L))); // 1 hour expiration
            store.saveCustomer(customer);

            dispatchPasswordResetEmail(customer, resetToken);
        }

        // Always return true to never reveal whether an email exists in the database
        return true;
    }

    public boolean resetCustomerPassword(String token, String newPassword, String confirmPassword) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Password reset token is missing or invalid.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long.");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match. Please re-enter your password.");
        }

        CustomerUser customer = store.findCustomerByResetToken(token.trim());
        if (customer == null) {
            throw new IllegalArgumentException("Invalid or expired password reset link.");
        }

        if (customer.getResetExpires() != null && customer.getResetExpires().before(new Timestamp(System.currentTimeMillis()))) {
            throw new IllegalArgumentException("Password reset link has expired. Please request a new one.");
        }

        customer.setPasswordHash(PasswordHasher.hashPassword(newPassword));
        customer.setResetToken(null);
        customer.setResetExpires(null);
        store.saveCustomer(customer);
        return true;
    }

    public CustomerUser getCustomerByToken(String token) {
        if (token == null) return null;
        Integer id = customerTokens.get(token);
        if (id == null) return null;
        return store.findCustomerById(id);
    }

    public void logoutCustomer(String token) {
        if (token != null) {
            customerTokens.remove(token);
            legacyTokens.remove(token);
        }
    }

    // =========================================================================
    // ADMIN TWO-STEP AUTHENTICATION METHODS
    // =========================================================================

    public Map<String, Object> adminLoginStep1(String email, String password) {
        if (email == null || password == null) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        AdminUser admin = store.findAdminByEmail(email.trim().toLowerCase());
        if (admin == null || !PasswordHasher.verify(password, admin.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid administrator credentials.");
        }

        if (!admin.isActive()) {
            throw new IllegalStateException("This administrator account has been disabled. Access denied.");
        }

        if (admin.isLocked()) {
            long remainingMins = Math.max(1, (admin.getSecurityLockedUntil().getTime() - System.currentTimeMillis()) / 60000);
            throw new IllegalStateException("Security Lockout: Too many failed security attempts. Please try again in " + remainingMins + " minute(s).");
        }

        // Issue 10-minute temporary 2FA token
        String preAuthToken = "pre2fa_" + PasswordHasher.generateSecureToken();
        adminPreAuthTokens.put(preAuthToken, new AdminPreAuthSession(admin.getId()));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("preAuthToken", preAuthToken);
        res.put("requiresSecurityPassword", true);
        res.put("adminName", admin.getName());
        res.put("adminEmail", admin.getEmail());
        res.put("message", "Step 1 passed. Please enter your security password.");
        return res;
    }

    public Map<String, Object> adminVerifyStep2(String preAuthToken, String securityPassword) {
        if (preAuthToken == null || preAuthToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Session expired or missing. Please log in again.");
        }

        AdminPreAuthSession session = adminPreAuthTokens.get(preAuthToken);
        if (session == null || session.isExpired()) {
            adminPreAuthTokens.remove(preAuthToken);
            throw new IllegalArgumentException("Security session expired. Please start login again from Step 1.");
        }

        AdminUser admin = store.findAdminById(session.adminId);
        if (admin == null || !admin.isActive()) {
            adminPreAuthTokens.remove(preAuthToken);
            throw new IllegalStateException("Administrator account not found or disabled.");
        }

        if (admin.isLocked()) {
            long remainingMins = Math.max(1, (admin.getSecurityLockedUntil().getTime() - System.currentTimeMillis()) / 60000);
            throw new IllegalStateException("Security Lockout: Too many failed security attempts. Please wait " + remainingMins + " minute(s).");
        }

        if (securityPassword == null || !PasswordHasher.verify(securityPassword, admin.getSecurityPasswordHash())) {
            int attempts = admin.getFailedSecurityAttempts() + 1;
            admin.setFailedSecurityAttempts(attempts);
            if (attempts >= 5) {
                admin.setSecurityLockedUntil(new Timestamp(System.currentTimeMillis() + (15 * 60 * 1000L))); // 15-min lockout
                store.saveAdmin(admin);
                adminPreAuthTokens.remove(preAuthToken);
                throw new IllegalStateException("Account locked for 15 minutes due to 5 failed security password attempts.");
            }
            store.saveAdmin(admin);
            int remaining = 5 - attempts;
            throw new IllegalArgumentException("Incorrect security password. " + remaining + " attempt(s) remaining before temporary lockout.");
        }

        // Success: Reset failed attempts & issue full verified admin token
        admin.setFailedSecurityAttempts(0);
        admin.setSecurityLockedUntil(null);
        store.saveAdmin(admin);

        adminPreAuthTokens.remove(preAuthToken);

        String adminToken = "adm_" + PasswordHasher.generateSecureToken();
        adminTokens.put(adminToken, admin.getId());

        // Also map to legacy user token for existing admin API compatibility
        User legacyAdmin = store.findUserById(admin.getId());
        if (legacyAdmin != null) {
            legacyTokens.put(adminToken, legacyAdmin.getId());
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("adminToken", adminToken);
        res.put("admin", admin);
        return res;
    }

    public AdminUser getAdminByToken(String token) {
        if (token == null) return null;
        Integer id = adminTokens.get(token);
        if (id == null) return null;
        AdminUser admin = store.findAdminById(id);
        if (admin != null && admin.isActive()) {
            return admin;
        }
        return null;
    }

    public void logoutAdmin(String token) {
        if (token != null) {
            adminTokens.remove(token);
            legacyTokens.remove(token);
        }
    }

    // =========================================================================
    // ADMIN MANAGEMENT METHODS (SUPER ADMIN)
    // =========================================================================

    public List<AdminUser> listAllAdmins() {
        return store.getAllAdmins();
    }

    public AdminUser createAdmin(String name, String email, String password, String confirmPassword,
                                 String securityPassword, String confirmSecurity, String role) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Administrator name is required.");
        }
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            throw new IllegalArgumentException("A valid administrator email address is required.");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Login password must be at least 6 characters.");
        }
        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Login passwords do not match.");
        }
        if (securityPassword == null || securityPassword.length() < 4) {
            throw new IllegalArgumentException("Security password/PIN must be at least 4 characters.");
        }
        if (!securityPassword.equals(confirmSecurity)) {
            throw new IllegalArgumentException("Security passwords do not match.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (store.findAdminByEmail(normalizedEmail) != null) {
            throw new IllegalArgumentException("An administrator with this email address already exists.");
        }

        AdminUser newAdmin = new AdminUser(
                0,
                name.trim(),
                normalizedEmail,
                PasswordHasher.hashPassword(password),
                PasswordHasher.hashPassword(securityPassword),
                "SUPER_ADMIN",
                "ACTIVE"
        );

        return store.saveAdmin(newAdmin);
    }

    public AdminUser updateAdminStatus(int adminId, String newStatus, AdminUser requestingAdmin) {
        AdminUser target = store.findAdminById(adminId);
        if (target == null) {
            throw new IllegalArgumentException("Administrator not found.");
        }
        if (target.getId() == requestingAdmin.getId() && "DISABLED".equalsIgnoreCase(newStatus)) {
            throw new IllegalArgumentException("You cannot disable your own administrator account.");
        }

        target.setStatus("ACTIVE".equalsIgnoreCase(newStatus) ? "ACTIVE" : "DISABLED");
        return store.saveAdmin(target);
    }

    public boolean resetAdminSecurity(int adminId, String newPassword, String newSecurityPassword) {
        AdminUser target = store.findAdminById(adminId);
        if (target == null) return false;

        if (newPassword != null && !newPassword.trim().isEmpty()) {
            target.setPasswordHash(PasswordHasher.hashPassword(newPassword.trim()));
        }
        if (newSecurityPassword != null && !newSecurityPassword.trim().isEmpty()) {
            target.setSecurityPasswordHash(PasswordHasher.hashPassword(newSecurityPassword.trim()));
        }
        target.setFailedSecurityAttempts(0);
        target.setSecurityLockedUntil(null);
        store.saveAdmin(target);
        return true;
    }

    public boolean deleteAdmin(int adminId, AdminUser requestingAdmin) {
        if (adminId == requestingAdmin.getId()) {
            throw new IllegalArgumentException("You cannot delete your own administrator account.");
        }
        return store.deleteAdmin(adminId);
    }

    // =========================================================================
    // EMAIL SIMULATION & LOGGING FOR LOCAL TESTING
    // =========================================================================

    private void dispatchVerificationEmail(CustomerUser customer, String token) {
        String verifyUrl = "http://localhost:8080/#verify-email?token=" + token;
        System.out.println("\n==================================================================");
        System.out.println("  [EMAIL DISPATCH] CUSTOMER EMAIL VERIFICATION");
        System.out.println("  To: " + customer.getName() + " <" + customer.getEmail() + ">");
        System.out.println("  Subject: Verify Your Email Address — LAZAROPH");
        System.out.println("  Verification Link: " + verifyUrl);
        System.out.println("==================================================================\n");

        SimulatedEmail email = new SimulatedEmail();
        email.toEmail = customer.getEmail();
        email.toName = customer.getName();
        email.subject = "Verify Your Email Address — LAZAROPH";
        email.type = "VERIFICATION";
        email.token = token;
        email.actionUrl = verifyUrl;
        email.snippet = "Welcome to LAZAROPH! Please click 'VERIFY MY EMAIL' to activate your customer account.";
        email.sentAt = System.currentTimeMillis();
        simulatedEmails.add(0, email);
    }

    private void dispatchPasswordResetEmail(CustomerUser customer, String token) {
        String resetUrl = "http://localhost:8080/#reset-password?token=" + token;
        System.out.println("\n==================================================================");
        System.out.println("  [EMAIL DISPATCH] CUSTOMER PASSWORD RESET");
        System.out.println("  To: " + customer.getName() + " <" + customer.getEmail() + ">");
        System.out.println("  Subject: Password Reset Request — LAZAROPH");
        System.out.println("  Reset Link: " + resetUrl);
        System.out.println("==================================================================\n");

        SimulatedEmail email = new SimulatedEmail();
        email.toEmail = customer.getEmail();
        email.toName = customer.getName();
        email.subject = "Password Reset Request — LAZAROPH";
        email.type = "PASSWORD_RESET";
        email.token = token;
        email.actionUrl = resetUrl;
        email.snippet = "We received a request to reset your LazaroPH password. Click 'RESET MY PASSWORD' to proceed.";
        email.sentAt = System.currentTimeMillis();
        simulatedEmails.add(0, email);
    }

    public List<SimulatedEmail> getSimulatedEmails() {
        return new ArrayList<>(simulatedEmails);
    }

    // =========================================================================
    // LEGACY METHODS (BACKWARD COMPATIBILITY)
    // =========================================================================

    public User getUserByToken(String token) {
        if (token == null) return null;

        // Check admin token first
        Integer adminId = adminTokens.get(token);
        if (adminId != null) {
            AdminUser a = store.findAdminById(adminId);
            if (a != null && a.isActive()) {
                return new User(a.getId(), a.getName(), a.getEmail(), a.getPasswordHash(), "ADMIN", "282948572", "911 J.P. Rizal Street", "Marikina", "Metro Manila", "1805");
            }
        }

        // Check customer token
        Integer custId = customerTokens.get(token);
        if (custId != null) {
            CustomerUser c = store.findCustomerById(custId);
            if (c != null && c.isVerified()) {
                return new User(c.getId(), c.getName(), c.getEmail(), c.getPasswordHash(), "CUSTOMER", c.getPhone(), c.getAddress(), c.getCity(), c.getProvince(), c.getZipCode());
            }
        }

        // Legacy fallback
        Integer userId = legacyTokens.get(token);
        if (userId != null) {
            return store.findUserById(userId);
        }
        return null;
    }

    public void logout(String token) {
        if (token != null) {
            logoutCustomer(token);
            logoutAdmin(token);
            legacyTokens.remove(token);
        }
    }
}
