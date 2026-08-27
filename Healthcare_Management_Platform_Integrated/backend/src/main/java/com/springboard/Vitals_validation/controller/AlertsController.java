package com.springboard.Vitals_validation.controller;

import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/alerts")
public class AlertsController {

    @GetMapping("/recent")
    public List<Map<String, Object>> getRecentAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();

        alerts.add(Map.of(
            "id", 1,
            "sev", "high",
            "text", "SpO₂ dropped below 90% — Bed 4",
            "suppressed", false,
            "time", "2 min ago"
        ));

        alerts.add(Map.of(
            "id", 2,
            "sev", "high",
            "text", "Irregular rhythm flagged — Bed 1",
            "suppressed", false,
            "time", "5 min ago"
        ));

        alerts.add(Map.of(
            "id", 3,
            "sev", "medium",
            "text", "Heart rate elevated 10+ min — Bed 2",
            "suppressed", false,
            "time", "12 min ago"
        ));

        alerts.add(Map.of(
            "id", 4,
            "sev", "medium",
            "text", "Repeated low-battery ping — Bed 5",
            "suppressed", true,
            "time", "18 min ago"
        ));

        alerts.add(Map.of(
            "id", 5,
            "sev", "low",
            "text", "Duplicate BP reading — Bed 2",
            "suppressed", true,
            "time", "24 min ago"
        ));

        alerts.add(Map.of(
            "id", 6,
            "sev", "low",
            "text", "Sensor reconnect noise — Bed 7",
            "suppressed", true,
            "time", "30 min ago"
        ));

        alerts.add(Map.of(
            "id", 7,
            "sev", "low",
            "text", "Duplicate SpO₂ reading — Bed 4",
            "suppressed", true,
            "time", "45 min ago"
        ));

        return alerts;
    }
}
