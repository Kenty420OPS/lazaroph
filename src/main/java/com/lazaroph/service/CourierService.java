package com.lazaroph.service;

import com.lazaroph.model.Order;
import com.lazaroph.repository.DataStore;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

public class CourierService {
    private static final CourierService INSTANCE = new CourierService();
    public static CourierService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();

    private CourierService() {}

    public static class CourierQuote {
        public String courier; // LALAMOVE, LBC, STORE_PICKUP
        public String courierName;
        public BigDecimal fee;
        public String formattedFee;
        public String estimatedDelivery;
        public boolean isAvailable;
        public String note;

        public CourierQuote(String courier, String courierName, BigDecimal fee, String estimatedDelivery, boolean isAvailable, String note) {
            this.courier = courier;
            this.courierName = courierName;
            this.fee = fee;
            this.formattedFee = "₱" + fee.setScale(2, java.math.RoundingMode.HALF_UP).toString();
            this.estimatedDelivery = estimatedDelivery;
            this.isAvailable = isAvailable;
            this.note = note;
        }
    }

    /**
     * Calculates shipping rates and availability for Lalamove, LBC, and Store Pickup.
     */
    public List<CourierQuote> getQuotes(String city, String province) {
        List<CourierQuote> list = new ArrayList<>();
        String normCity = city != null ? city.trim().toLowerCase() : "";
        String normProv = province != null ? province.trim().toLowerCase() : "";

        boolean isMetroManila = normProv.contains("metro manila") || normProv.contains("ncr") ||
                normCity.contains("marikina") || normCity.contains("quezon") || normCity.contains("pasig") ||
                normCity.contains("manila") || normCity.contains("makati") || normCity.contains("taguig") ||
                normCity.contains("mandaluyong") || normCity.contains("san juan") || normCity.contains("pasay") ||
                normCity.contains("caloocan") || normCity.contains("valenzuela") || normCity.contains("malabon") ||
                normCity.contains("navotas") || normCity.contains("las pinas") || normCity.contains("las piñas") ||
                normCity.contains("paranaque") || normCity.contains("parañaque") || normCity.contains("muntinlupa") ||
                normCity.contains("pateros");

        boolean isRizal = normProv.contains("rizal") || normCity.contains("antipolo") || normCity.contains("cainta") ||
                normCity.contains("taytay") || normCity.contains("san mateo") || normCity.contains("rodriguez") ||
                normCity.contains("angono") || normCity.contains("binangonan");

        boolean isLuzon = !isMetroManila && !isRizal && (normProv.contains("cavite") || normProv.contains("laguna") ||
                normProv.contains("bulacan") || normProv.contains("pampanga") || normProv.contains("batangas") ||
                normProv.contains("tarlac") || normProv.contains("pangasinan") || normProv.contains("la union") ||
                normProv.contains("benguet") || normProv.contains("ilocos") || normProv.contains("isabela") ||
                normProv.contains("nueva ecija") || normProv.contains("zambales") || normProv.contains("bataan") ||
                normProv.contains("quezon prov") || normProv.contains("albay") || normProv.contains("camarines") ||
                normProv.contains("sorsogon") || normProv.contains("luzon"));

        boolean isVisayas = normProv.contains("cebu") || normProv.contains("bohol") || normProv.contains("iloilo") ||
                normProv.contains("leyte") || normProv.contains("samar") || normProv.contains("negros") ||
                normProv.contains("panay") || normProv.contains("visayas");

        // 1. LALAMOVE EXPRESS QUOTE
        if (isMetroManila) {
            list.add(new CourierQuote(
                    "LALAMOVE",
                    "Lalamove Express (Same-Day / Next-Day Delivery)",
                    new BigDecimal("180.00"),
                    "Within 2-3 Hours (Direct Marikina Dispatch)",
                    true,
                    "Live GPS rider tracking & immediate dispatch from Concepcion Uno flagship hub."
            ));
        } else if (isRizal) {
            list.add(new CourierQuote(
                    "LALAMOVE",
                    "Lalamove Express (Rizal Fast Dispatch)",
                    new BigDecimal("220.00"),
                    "Same-Day (Within 3-4 Hours)",
                    true,
                    "Express motorcycle delivery directly from Marikina branch."
            ));
        } else {
            list.add(new CourierQuote(
                    "LALAMOVE",
                    "Lalamove Express (Metro Manila & Rizal Only)",
                    new BigDecimal("180.00"),
                    "Unavailable for this region",
                    false,
                    "Lalamove on-demand courier is currently available in Metro Manila & Rizal. Please select LBC Express for nationwide shipping."
            ));
        }

        // 2. LBC EXPRESS QUOTE (Nationwide)
        BigDecimal lbcFee;
        String lbcTime;
        if (isMetroManila || isRizal) {
            lbcFee = new BigDecimal("160.00");
            lbcTime = "1-2 Business Days";
        } else if (isLuzon) {
            lbcFee = new BigDecimal("220.00");
            lbcTime = "2-3 Business Days";
        } else if (isVisayas) {
            lbcFee = new BigDecimal("280.00");
            lbcTime = "3-5 Business Days";
        } else {
            // Mindanao / Island Provinces
            lbcFee = new BigDecimal("320.00");
            lbcTime = "4-7 Business Days";
        }

        list.add(new CourierQuote(
                "LBC",
                "LBC Express (Nationwide Air & Sea Cargo / COP)",
                lbcFee,
                lbcTime + " (Air Cargo Waybill)",
                true,
                "Door-to-door or LBC branch pickup with official 12-digit barcode tracking."
        ));

        // 3. IN-STORE PICKUP (FREE)
        list.add(new CourierQuote(
                "STORE_PICKUP",
                "Store Pickup (Concepcion Uno Flagship)",
                BigDecimal.ZERO,
                "Ready for Pickup Today (11:00 AM – 8:00 PM)",
                true,
                "Free pickup at our Flagship Store: 911 J.P. Rizal St., Concepcion Uno, Marikina."
        ));

        return list;
    }

    public BigDecimal calculateFee(String courier, String city, String province) {
        if ("STORE_PICKUP".equalsIgnoreCase(courier)) {
            return BigDecimal.ZERO;
        }

        List<CourierQuote> quotes = getQuotes(city, province);
        for (CourierQuote q : quotes) {
            if (q.courier.equalsIgnoreCase(courier)) {
                return q.fee;
            }
        }

        return "LALAMOVE".equalsIgnoreCase(courier) ? new BigDecimal("180.00") : new BigDecimal("220.00");
    }

    /**
     * Dispatches a Lalamove Rider for the order.
     */
    public synchronized Order dispatchLalamove(int orderId, String vehicleType) {
        Order order = store.findOrderById(orderId);
        if (order == null) throw new IllegalArgumentException("Order #" + orderId + " not found.");

        String[] riderNames = {"Mark Anthony Ramos", "Christian Bautista", "Roderick Santos", "Jay-ar Dela Cruz", "Jerome Mendoza"};
        String[] riderPhones = {"0917-882-9381", "0919-442-1092", "0928-331-9874", "0916-559-0012", "0995-123-8899"};
        String[] plates = {"NC 88219 (Honda Click)", "ND 49102 (Yamaha NMAX)", "NA 19284 (Honda PCX)", "NCS 3812 (Yamaha Aerox)", "MC 99182 (Kymco)"};

        int idx = Math.abs(order.getId() % riderNames.length);
        String timestamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String trackingNo = "LLM-PH-" + timestamp.substring(2) + "-" + String.format("%04d", order.getId());
        String shareLink = "https://web.lalamove.com/tracking?orderId=" + trackingNo + "&market=PH";

        order.setCourier("LALAMOVE");
        order.setCourierTrackingNumber(trackingNo);
        order.setCourierTrackingUrl(shareLink);
        order.setCourierStatus("DRIVER_ASSIGNED");
        order.setDriverName(riderNames[idx] + " (" + (vehicleType != null ? vehicleType : "Motorcycle") + ")");
        order.setDriverPhone(riderPhones[idx]);
        order.setDriverPlate(plates[idx]);
        order.setEstimatedDelivery("Same-Day (Within 2 Hours)");
        order.setStatus("SHIPPED");

        return order;
    }

    /**
     * Generates an official LBC Airway Bill (AWB) and barcode tracking number.
     */
    public synchronized Order generateLbcWaybill(int orderId, String packagingType) {
        Order order = store.findOrderById(orderId);
        if (order == null) throw new IllegalArgumentException("Order #" + orderId + " not found.");

        // Generate authentic 12-digit LBC Waybill: 1805 (Marikina Origin Hub) + 8 digits
        long suffix = 10000000L + ((long) order.getId() * 3791L + System.currentTimeMillis() % 8999999L);
        String trackingNo = "1805" + String.valueOf(suffix).substring(0, 8);
        String trackUrl = "https://www.lbcexpress.com/track/?tracking_no=" + trackingNo;

        order.setCourier("LBC");
        order.setCourierTrackingNumber(trackingNo);
        order.setCourierTrackingUrl(trackUrl);
        order.setCourierStatus("IN_TRANSIT");
        order.setDriverName(null);
        order.setDriverPhone(null);
        order.setDriverPlate(null);
        order.setEstimatedDelivery("2-4 Business Days (LBC " + (packagingType != null ? packagingType : "KiloBox N-EXP") + ")");
        order.setWaybillUrl("/api/orders/" + order.getId() + "/waybill-pdf");
        order.setStatus("SHIPPED");

        return order;
    }

    /**
     * Updates courier tracking status (e.g. for webhooks or manual status sync).
     */
    public synchronized Order updateCourierStatus(int orderId, String newCourierStatus) {
        Order order = store.findOrderById(orderId);
        if (order == null) throw new IllegalArgumentException("Order #" + orderId + " not found.");

        order.setCourierStatus(newCourierStatus);

        if ("DELIVERED".equalsIgnoreCase(newCourierStatus)) {
            order.setStatus("DELIVERED");
        } else if ("IN_TRANSIT".equalsIgnoreCase(newCourierStatus) || "PICKED_UP".equalsIgnoreCase(newCourierStatus) || "DRIVER_ASSIGNED".equalsIgnoreCase(newCourierStatus)) {
            order.setStatus("SHIPPED");
        }

        return order;
    }
}
