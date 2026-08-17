package com.lazaroph.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConfig {
    private static final String MYSQL_HOST = System.getProperty("db.host", "localhost");
    private static final String MYSQL_PORT = System.getProperty("db.port", "3306");
    private static final String MYSQL_DB = System.getProperty("db.name", "lazaroph");
    private static final String MYSQL_USER = System.getProperty("db.user", "root");
    private static final String MYSQL_PASS = System.getProperty("db.pass", "");

    private static boolean useMySQL = false;

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            String url = "jdbc:mysql://" + MYSQL_HOST + ":" + MYSQL_PORT + "/" + MYSQL_DB + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
            try (Connection conn = DriverManager.getConnection(url, MYSQL_USER, MYSQL_PASS)) {
                if (conn != null && !conn.isClosed()) {
                    useMySQL = true;
                    System.out.println("[LAZAROPH DB] Connected successfully to MySQL database (" + MYSQL_DB + ")");
                }
            }
        } catch (Exception e) {
            useMySQL = false;
            System.out.println("[LAZAROPH DB] MySQL not detected or credentials not configured. Initializing High-Performance In-Memory Embedded Engine with Thread-Safe Variant Inventory.");
        }
    }

    public static boolean isUsingMySQL() {
        return useMySQL;
    }

    public static Connection getMySQLConnection() throws SQLException {
        String url = "jdbc:mysql://" + MYSQL_HOST + ":" + MYSQL_PORT + "/" + MYSQL_DB + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        return DriverManager.getConnection(url, MYSQL_USER, MYSQL_PASS);
    }
}
