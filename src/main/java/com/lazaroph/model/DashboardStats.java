package com.lazaroph.model;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardStats {
    private BigDecimal totalSales;
    private int totalOrders;
    private int totalCustomers;
    private int totalProducts;
    private int lowStockCount;
    private List<Map<String, Object>> recentOrders;
    private List<Map<String, Object>> lowStockProducts;
    private List<Map<String, Object>> salesByCategory;
    private List<Map<String, Object>> dailySalesTrend;

    public DashboardStats() {}

    public BigDecimal getTotalSales() { return totalSales; }
    public void setTotalSales(BigDecimal totalSales) { this.totalSales = totalSales; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public int getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(int totalCustomers) { this.totalCustomers = totalCustomers; }

    public int getTotalProducts() { return totalProducts; }
    public void setTotalProducts(int totalProducts) { this.totalProducts = totalProducts; }

    public int getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(int lowStockCount) { this.lowStockCount = lowStockCount; }

    public List<Map<String, Object>> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<Map<String, Object>> recentOrders) { this.recentOrders = recentOrders; }

    public List<Map<String, Object>> getLowStockProducts() { return lowStockProducts; }
    public void setLowStockProducts(List<Map<String, Object>> lowStockProducts) { this.lowStockProducts = lowStockProducts; }

    public List<Map<String, Object>> getSalesByCategory() { return salesByCategory; }
    public void setSalesByCategory(List<Map<String, Object>> salesByCategory) { this.salesByCategory = salesByCategory; }

    public List<Map<String, Object>> getDailySalesTrend() { return dailySalesTrend; }
    public void setDailySalesTrend(List<Map<String, Object>> dailySalesTrend) { this.dailySalesTrend = dailySalesTrend; }
}
