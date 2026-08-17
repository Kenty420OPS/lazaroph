package com.lazaroph.service;

import com.lazaroph.model.Product;
import com.lazaroph.model.ProductImage;
import com.lazaroph.model.ProductVariant;
import com.lazaroph.repository.DataStore;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

public class ProductService {
    private static final ProductService INSTANCE = new ProductService();
    public static ProductService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();

    private ProductService() {}

    public List<Product> getProducts(
            String category,
            String gender,
            String size,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String brand,
            Boolean inStockOnly,
            String query,
            String sort
    ) {
        List<Product> products = store.getAllProducts(true);

        return products.stream().filter(p -> {
            // Category filter
            if (category != null && !category.trim().isEmpty() && !"all".equalsIgnoreCase(category)) {
                boolean matchCat = (p.getCategoryName() != null && p.getCategoryName().equalsIgnoreCase(category))
                        || (p.getSubcategory() != null && p.getSubcategory().equalsIgnoreCase(category));
                if (!matchCat) return false;
            }

            // Gender filter
            if (gender != null && !gender.trim().isEmpty() && !"all".equalsIgnoreCase(gender)) {
                if (p.getGender() != null && !p.getGender().equalsIgnoreCase(gender) && !"UNISEX".equalsIgnoreCase(p.getGender())) {
                    return false;
                }
            }

            // Brand filter
            if (brand != null && !brand.trim().isEmpty() && !"all".equalsIgnoreCase(brand)) {
                if (p.getBrandName() != null && !p.getBrandName().equalsIgnoreCase(brand)) {
                    return false;
                }
            }

            // Price range filter
            BigDecimal effectivePrice = p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getPrice();
            if (minPrice != null && effectivePrice.compareTo(minPrice) < 0) return false;
            if (maxPrice != null && effectivePrice.compareTo(maxPrice) > 0) return false;

            // Size filter (Matches any variant with specified size and stock > 0)
            if (size != null && !size.trim().isEmpty() && !"all".equalsIgnoreCase(size)) {
                boolean hasSize = p.getVariants().stream().anyMatch(v -> 
                    v.getSize().equalsIgnoreCase(size) && v.getStock() > 0
                );
                if (!hasSize) return false;
            }

            // Availability filter
            if (Boolean.TRUE.equals(inStockOnly)) {
                if (p.getTotalStock() <= 0) return false;
            }

            // Text Query Search (Product name, SKU, Brand, Category, Description)
            if (query != null && !query.trim().isEmpty()) {
                String q = query.trim().toLowerCase();
                boolean matchesName = p.getName().toLowerCase().contains(q);
                boolean matchesSku = p.getSku().toLowerCase().contains(q);
                boolean matchesBrand = p.getBrandName() != null && p.getBrandName().toLowerCase().contains(q);
                boolean matchesCat = p.getCategoryName() != null && p.getCategoryName().toLowerCase().contains(q);
                boolean matchesDesc = p.getDescription() != null && p.getDescription().toLowerCase().contains(q);
                if (!matchesName && !matchesSku && !matchesBrand && !matchesCat && !matchesDesc) {
                    return false;
                }
            }

            return true;
        }).sorted((a, b) -> {
            if ("price_asc".equalsIgnoreCase(sort)) {
                BigDecimal pA = a.getDiscountPrice() != null ? a.getDiscountPrice() : a.getPrice();
                BigDecimal pB = b.getDiscountPrice() != null ? b.getDiscountPrice() : b.getPrice();
                return pA.compareTo(pB);
            } else if ("price_desc".equalsIgnoreCase(sort)) {
                BigDecimal pA = a.getDiscountPrice() != null ? a.getDiscountPrice() : a.getPrice();
                BigDecimal pB = b.getDiscountPrice() != null ? b.getDiscountPrice() : b.getPrice();
                return pB.compareTo(pA);
            } else if ("best_selling".equalsIgnoreCase(sort) || "popular".equalsIgnoreCase(sort)) {
                return (b.isFeatured() ? 1 : 0) - (a.isFeatured() ? 1 : 0);
            } else {
                // Newest first
                return b.getId() - a.getId();
            }
        }).collect(Collectors.toList());
    }

    public Product getProductById(int id) {
        return store.findProductById(id);
    }

    public Product saveOrUpdateProduct(Product p) {
        return store.saveProduct(p);
    }

    public boolean deleteProduct(int id) {
        return store.deleteProduct(id);
    }
}
