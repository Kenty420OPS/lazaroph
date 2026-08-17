package com.lazaroph.service;

import com.lazaroph.model.Product;
import com.lazaroph.model.ProductVariant;
import com.lazaroph.repository.DataStore;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InventoryService {
    private static final InventoryService INSTANCE = new InventoryService();
    public static InventoryService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();

    private InventoryService() {}

    public List<Map<String, Object>> getInventoryMatrix() {
        List<Product> products = store.getAllProducts(false);
        List<Map<String, Object>> matrix = new ArrayList<>();

        for (Product p : products) {
            for (ProductVariant v : p.getVariants()) {
                Map<String, Object> row = new HashMap<>();
                row.put("productId", p.getId());
                row.put("productName", p.getName());
                row.put("productSku", p.getSku());
                row.put("category", p.getCategoryName());
                row.put("variantId", v.getId());
                row.put("size", v.getSize());
                row.put("color", v.getColor());
                row.put("colorHex", v.getColorHex());
                row.put("stock", v.getStock());
                row.put("skuVariant", v.getSkuVariant() != null ? v.getSkuVariant() : p.getSku() + "-" + v.getSize());
                row.put("status", v.getStock() == 0 ? "OUT_OF_STOCK" : (v.getStock() <= 5 ? "LOW_STOCK" : "IN_STOCK"));
                matrix.add(row);
            }
        }
        return matrix;
    }

    public void updateStock(int variantId, int newStock) {
        store.updateVariantStock(variantId, newStock);
    }
}
