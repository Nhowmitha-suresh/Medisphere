# Healthcare Management Platform for Clinical Operations — Integration Guide

This document provides complete instructions on how the integrated **Spring Boot Backend (Java 21)** and **Clinical Operations Frontend (HTML5 / Vanilla JS / CSS3)** operate together, complete with API specifications, validation logic, database persistence, and testing procedures.

---

## 1. System Architecture & Component Flow

```
[Clinician Interface] ──(HTTP JSON)──> [Spring Boot REST API] ──(JPA)──> [H2/PostgreSQL DB]
   index.html                              vitalscontroller                 vitals table
   vitals-range-validation.html            AnomalyController
   alert-fatigue-prevention.html           AlertsController
   anomaly-detection-precision.html
```

### End-to-End Vitals Range Validation Flow
1. **Patient Selection / Entry**: The clinician searches or enters a Patient ID (e.g., `P1001`) and vital readings in `vitals-range-validation.html`.
2. **REST Request**: On form submission, `script.js` sends an asynchronous `POST` request to `http://localhost:8080/api/vitals` containing the vitals payload.
3. **Backend Validation**: `VitalsService.java` validates each reading against standard clinical thresholds and dynamically populates status attributes:
   - `heartRateStatus` (`NORMAL`, `LOW`, `HIGH`)
   - `spo2Status` (`NORMAL`, `LOW`)
   - `temperatureStatus` (`NORMAL`, `LOW`, `HIGH`)
   - `respiratoryRateStatus` (`NORMAL`, `LOW`, `HIGH`)
   - `bloodpressureStatus` (`NORMAL`, `LOW`, `HIGH`)
4. **Automatic Timestamping & Persistence**: JPA generates an `Instant.now()` timestamp (`recordedAt`) via `@PrePersist` and stores the entity in the H2 / PostgreSQL database.
5. **Immediate UI Update**: The REST response returns the persisted entity to update the **Current Vitals** gauge. The frontend then calls `GET /api/getvitals` to refresh the **Patient History** table.

---

## 2. Configured Clinical Range Thresholds

| Vital Metric | Normal Limits | Status Low | Status High |
| :--- | :--- | :--- | :--- |
| **Heart Rate** | `60 – 100 bpm` | `< 60 bpm` | `> 100 bpm` |
| **SpO₂** | `95 – 100 %` | `< 95 %` | N/A |
| **Temperature** | `36.1 – 37.2 °C` | `< 36.1 °C` | `> 37.2 °C` |
| **Respiratory Rate** | `12 – 20 /min` | `< 12 /min` | `> 20 /min` |
| **Systolic BP** | `90 – 120 mmHg` | `< 90 mmHg` | `> 120 mmHg` |
| **Diastolic BP** | `60 – 80 mmHg` | `< 60 mmHg` | `> 80 mmHg` |

*Note: The backend service remains the single source of truth for validation rules; the frontend visual indicators match these thresholds.*

---

## 3. Endpoints & API Contract Reference

The frontend defaults to `http://localhost:8080`. To override the base URL, set `window.VITALS_API_BASE` before `script.js` is loaded:
```html
<script>
  window.VITALS_API_BASE = "http://localhost:8080";
</script>
<script src="script.js"></script>
```

### Endpoints
- **`POST /api/vitals`**: Validates and saves vitals entity.
- **`GET /api/getvitals`**: Returns all recorded vitals entities.
- **`GET /api/vitals/current`**: Returns current patient vitals (bootstraps demo dataset if DB is empty).
- **`POST /api/anomaly/detect`**: Executes Isolation Forest model decision function on vitals payload.
- **`GET /api/anomaly/precision`**: Returns batch anomaly detection precision metrics (227 TP / 23 FP = 90.8% precision).
- **`GET /api/alerts/recent`**: Returns recent alert stream with severity tags and suppression flags.

---

## 4. How to Run & Test

### Running Automated Tests
To run the automated suite of 9 integration and unit tests:
```bash
# In backend directory
.\mvnw.cmd test
```

### Running the Backend Application
To start the live Spring Boot server on port `8080`:
```bash
# In backend directory
.\mvnw.cmd spring-boot:run
```

### Running the Frontend
Open `index.html` or any `.html` page in a web browser. The pages automatically connect to `http://localhost:8080` to display live data, validate inputs, and update history in real-time.
