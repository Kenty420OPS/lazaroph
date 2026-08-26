package com.lazaroph.model;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class Order {
    private int id;
    private String orderNumber; // e.g. LZPH-20260817-0001
    private Integer userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String shippingAddress;
    private String shippingCity;
    private String shippingProvince;
    private String shippingZip;
    private String paymentMethod;
    private String paymentReference;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private String status; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    private String notes;
    private Timestamp createdAt;

    // Manual Delivery & Logistics Fields
    private String courier = "LALAMOVE"; // LALAMOVE, LBC, STORE_PICKUP
    private boolean deliveryFeeConfirmed = false; // true when admin confirms fee; false = "To be Confirmed"
    private String courierTrackingNumber; // e.g. LBC-180599201948 or LLM-9928103
    private String courierTrackingUrl;
    private String courierStatus = "Pending Order"; // Pending Order, Payment Verification, Delivery Confirmation, Preparing Order, Ready for Pickup, For Delivery, Shipped, Out for Delivery, Delivered, Cancelled
    private String pickupBranch = "Concepcion Uno, Marikina";
    
    // Lalamove Rider Info
    private String riderName;
    private String riderPhone;
    private String driverPlate;
    private String estimatedDeliveryTime;
    
    // LBC Info
    private String lbcTrackingNumber;
    private String shippingDate;
    private String estimatedDeliveryDate;
    
    // Delivery Notes & Waybill
    private String deliveryNotes;
    private String estimatedDelivery;
    private String waybillUrl;
    
    private List<OrderItem> items = new ArrayList<>();

    public Order() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getShippingCity() { return shippingCity; }
    public void setShippingCity(String shippingCity) { this.shippingCity = shippingCity; }

    public String getShippingProvince() { return shippingProvince; }
    public void setShippingProvince(String shippingProvince) { this.shippingProvince = shippingProvince; }

    public String getShippingZip() { return shippingZip; }
    public void setShippingZip(String shippingZip) { this.shippingZip = shippingZip; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getShippingFee() { return shippingFee; }
    public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public String getCourier() { return courier; }
    public void setCourier(String courier) { this.courier = courier; }

    public boolean isDeliveryFeeConfirmed() { return deliveryFeeConfirmed; }
    public void setDeliveryFeeConfirmed(boolean deliveryFeeConfirmed) { this.deliveryFeeConfirmed = deliveryFeeConfirmed; }

    public String getCourierTrackingNumber() { return courierTrackingNumber; }
    public void setCourierTrackingNumber(String courierTrackingNumber) { this.courierTrackingNumber = courierTrackingNumber; }

    public String getCourierTrackingUrl() { return courierTrackingUrl; }
    public void setCourierTrackingUrl(String courierTrackingUrl) { this.courierTrackingUrl = courierTrackingUrl; }

    public String getCourierStatus() { return courierStatus; }
    public void setCourierStatus(String courierStatus) { this.courierStatus = courierStatus; }

    public String getPickupBranch() { return pickupBranch; }
    public void setPickupBranch(String pickupBranch) { this.pickupBranch = pickupBranch; }

    public String getRiderName() { return riderName; }
    public void setRiderName(String riderName) { this.riderName = riderName; }

    public String getDriverName() { return getRiderName(); }
    public void setDriverName(String driverName) { setRiderName(driverName); }

    public String getRiderPhone() { return riderPhone; }
    public void setRiderPhone(String riderPhone) { this.riderPhone = riderPhone; }

    public String getDriverPhone() { return getRiderPhone(); }
    public void setDriverPhone(String driverPhone) { setRiderPhone(driverPhone); }

    public String getDriverPlate() { return driverPlate; }
    public void setDriverPlate(String driverPlate) { this.driverPlate = driverPlate; }

    public String getEstimatedDeliveryTime() { return estimatedDeliveryTime; }
    public void setEstimatedDeliveryTime(String estimatedDeliveryTime) { this.estimatedDeliveryTime = estimatedDeliveryTime; }

    public String getLbcTrackingNumber() { return lbcTrackingNumber != null ? lbcTrackingNumber : courierTrackingNumber; }
    public void setLbcTrackingNumber(String lbcTrackingNumber) { this.lbcTrackingNumber = lbcTrackingNumber; this.courierTrackingNumber = lbcTrackingNumber; }

    public String getShippingDate() { return shippingDate; }
    public void setShippingDate(String shippingDate) { this.shippingDate = shippingDate; }

    public String getEstimatedDeliveryDate() { return estimatedDeliveryDate; }
    public void setEstimatedDeliveryDate(String estimatedDeliveryDate) { this.estimatedDeliveryDate = estimatedDeliveryDate; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }

    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }

    public String getWaybillUrl() { return waybillUrl; }
    public void setWaybillUrl(String waybillUrl) { this.waybillUrl = waybillUrl; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
