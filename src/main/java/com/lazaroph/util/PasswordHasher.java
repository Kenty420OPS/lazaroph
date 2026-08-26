package com.lazaroph.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class PasswordHasher {
    private static final String SALT = "LAZAROPH_AUTHENTIC_2026";

    public static String hashPassword(String plainPassword) {
        if (plainPassword == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((plainPassword + SALT).getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public static boolean verify(String plainPassword, String storedHash) {
        if (plainPassword == null || storedHash == null) return false;
        return hashPassword(plainPassword).equalsIgnoreCase(storedHash);
    }

    public static String generateSecureToken() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
