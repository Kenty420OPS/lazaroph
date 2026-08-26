package com.lazaroph;

import com.lazaroph.controller.ApiController;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.Executors;

public class Main {
    private static final int DEFAULT_PORT = 8080;

    private static String resolveWebappDir() {
        String[] candidates = {
            "src/main/webapp",
            "webapp",
            "../src/main/webapp",
            System.getProperty("user.dir") + "/src/main/webapp"
        };
        for (String c : candidates) {
            Path p = Paths.get(c);
            if (Files.exists(p) && Files.isDirectory(p)) {
                return c;
            }
        }
        return "src/main/webapp";
    }

    private static final String WEBAPP_DIR = resolveWebappDir();

    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try { port = Integer.parseInt(args[0]); } catch (Exception ignored) {}
        } else if (System.getenv("PORT") != null) {
            try { port = Integer.parseInt(System.getenv("PORT")); } catch (Exception ignored) {}
        } else if (System.getProperty("server.port") != null) {
            try { port = Integer.parseInt(System.getProperty("server.port")); } catch (Exception ignored) {}
        }

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            server.setExecutor(Executors.newFixedThreadPool(20));

            ApiController apiController = new ApiController();

            // Handler for all requests
            server.createContext("/", new MainHttpHandler(apiController));

            server.start();
            System.out.println("==================================================================");
            System.out.println("  LAZAROPH E-Commerce Platform Server");
            System.out.println("  Tagline: AUTHENTIC. LEGIT. BELOW MARKET PRICE.");
            System.out.println("  Local URL: http://localhost:" + port);
            System.out.println("  Webapp Dir: " + Paths.get(WEBAPP_DIR).toAbsolutePath());
            System.out.println("  Admin Login: admin@lazaroph.com / admin123");
            System.out.println("  Customer Login: customer@example.com / customer123");
            System.out.println("==================================================================");

        } catch (IOException e) {
            System.err.println("Failed to start server on port " + port + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static class MainHttpHandler implements HttpHandler {
        private final ApiController apiController;

        public MainHttpHandler(ApiController apiController) {
            this.apiController = apiController;
        }

        private void addCorsHeaders(HttpExchange exchange) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Key, Accept, Origin");
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod().toUpperCase();
            String uri = exchange.getRequestURI().toString();
            String path = exchange.getRequestURI().getPath();

            // Handle CORS Preflight
            if ("OPTIONS".equals(method)) {
                addCorsHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            // API Endpoint Handling
            if (path.startsWith("/api/")) {
                handleApi(exchange, method, path, uri);
                return;
            }

            // Static Resource Handling
            handleStaticFile(exchange, path);
        }

        private void handleApi(HttpExchange exchange, String method, String path, String fullUri) throws IOException {
            addCorsHeaders(exchange);

            // Read Authorization header & Session header
            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7).trim();
            }

            String sessionKey = exchange.getRequestHeaders().getFirst("X-Session-Key");
            if (sessionKey == null || sessionKey.trim().isEmpty()) {
                sessionKey = "anon_" + exchange.getRemoteAddress().getHostString();
            }

            // Parse Query Parameters
            Map<String, String> queryParams = new HashMap<>();
            int qIndex = fullUri.indexOf('?');
            if (qIndex != -1) {
                String queryString = fullUri.substring(qIndex + 1);
                String[] pairs = queryString.split("&");
                for (String pair : pairs) {
                    int eqIndex = pair.indexOf('=');
                    if (eqIndex > 0) {
                        String key = URLDecoder.decode(pair.substring(0, eqIndex), StandardCharsets.UTF_8);
                        String value = URLDecoder.decode(pair.substring(eqIndex + 1), StandardCharsets.UTF_8);
                        queryParams.put(key, value);
                    }
                }
            }

            // Read Body
            String body = "";
            if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) {
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    baos.write(buffer, 0, read);
                }
                body = baos.toString(StandardCharsets.UTF_8);
            }

            ApiController.ApiResponse response = apiController.handleRequest(method, path, queryParams, body, token, sessionKey);

            exchange.getResponseHeaders().set("Content-Type", response.contentType);
            addCorsHeaders(exchange);

            byte[] respBytes = response.body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(response.statusCode, respBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(respBytes);
            }
        }

        private void handleStaticFile(HttpExchange exchange, String path) throws IOException {
            addCorsHeaders(exchange);

            if ("/".equals(path) || path.isEmpty()) {
                path = "/index.html";
            }

            // Normalization: If request path is e.g. /admin/css/main.css or /admin/login/js/app.js,
            // extract the actual asset folder (/css/, /js/, /images/, /uploads/, /favicon.ico)
            String normalizedPath = path;
            for (String assetPrefix : new String[]{"/css/", "/js/", "/images/", "/uploads/", "/favicon.ico"}) {
                int idx = path.indexOf(assetPrefix);
                if (idx > 0) {
                    normalizedPath = path.substring(idx);
                    break;
                }
            }

            // Resolve file path
            Path filePath = Paths.get(WEBAPP_DIR, normalizedPath.startsWith("/") ? normalizedPath.substring(1) : normalizedPath);

            if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
                // SPA fallback to index.html if file doesn't exist
                if (!path.startsWith("/api/") && !path.contains(".")) {
                    filePath = Paths.get(WEBAPP_DIR, "index.html");
                } else {
                    String notFound = "404 Not Found";
                    exchange.sendResponseHeaders(404, notFound.length());
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(notFound.getBytes(StandardCharsets.UTF_8));
                    }
                    return;
                }
            }

            byte[] fileBytes = Files.readAllBytes(filePath);
            String contentType = getMimeType(filePath.getFileName().toString(), fileBytes);
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-store, must-revalidate");
            exchange.getResponseHeaders().set("Pragma", "no-cache");
            exchange.getResponseHeaders().set("Expires", "0");
            addCorsHeaders(exchange);

            exchange.sendResponseHeaders(200, fileBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }
        }

        private String getMimeType(String filename, byte[] fileBytes) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
            if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
            if (lower.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
            if (lower.endsWith(".svg")) return "image/svg+xml";

            // Sniff SVG content if file contains <svg or <?xml in header
            if (fileBytes != null && fileBytes.length > 4) {
                String header = new String(fileBytes, 0, Math.min(fileBytes.length, 128), StandardCharsets.UTF_8);
                if (header.contains("<svg") || header.contains("<?xml")) {
                    return "image/svg+xml";
                }
            }

            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".webp")) return "image/webp";
            if (lower.endsWith(".ico")) return "image/x-icon";
            if (lower.endsWith(".woff2")) return "font/woff2";
            if (lower.endsWith(".woff")) return "font/woff";
            if (lower.endsWith(".ttf")) return "font/ttf";
            return "application/octet-stream";
        }
    }
}
