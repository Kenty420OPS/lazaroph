package com.lazaroph.service;

import com.lazaroph.model.User;
import com.lazaroph.repository.DataStore;
import com.lazaroph.util.PasswordHasher;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {
    private static final AuthService INSTANCE = new AuthService();
    public static AuthService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();
    private final Map<String, Integer> activeTokens = new ConcurrentHashMap<>(); // token -> userId

    private AuthService() {}

    public User register(String name, String email, String password, String phone, String address, String city, String province, String zipCode) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password are required.");
        }
        if (store.findUserByEmail(email) != null) {
            throw new IllegalArgumentException("An account with this email address already exists.");
        }

        User u = new User();
        u.setName(name != null ? name.trim() : "Customer");
        u.setEmail(email.trim().toLowerCase());
        u.setPasswordHash(PasswordHasher.hashPassword(password));
        u.setRole("CUSTOMER");
        u.setPhone(phone);
        u.setAddress(address);
        u.setCity(city);
        u.setProvince(province);
        u.setZipCode(zipCode);

        return store.saveUser(u);
    }

    public User login(String email, String password) {
        if (email == null || password == null) return null;
        User user = store.findUserByEmail(email.trim());
        if (user != null && PasswordHasher.verify(password, user.getPasswordHash())) {
            return user;
        }
        return null;
    }

    public String generateToken(User user) {
        String token = UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
        activeTokens.put(token, user.getId());
        return token;
    }

    public User getUserByToken(String token) {
        if (token == null) return null;
        Integer userId = activeTokens.get(token);
        if (userId != null) {
            return store.findUserById(userId);
        }
        return null;
    }

    public void logout(String token) {
        if (token != null) {
            activeTokens.remove(token);
        }
    }
}
