package com.springboard.Vitals_validation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="vitals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vitalsmodel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotNull(message = "Heart rate is required")
    @Min(value = 0, message = "Heart rate cannot be negative")
    @Max(value = 250, message = "Heart rate cannot exceed 250")
    private Double heartRate;
    private String heartRateStatus;

    @NotNull(message = "SpO2 is required")
    @Min(value = 0, message = "SpO2 cannot be below 0")
    @Max(value = 100, message = "SpO2 cannot exceed 100")
    private Double spo2;
    private String spo2Status;

    @NotNull(message = "Temperature is required")
    @Min(value = 25, message = "Temperature is too low")
    @Max(value = 45, message = "Temperature is too high")
    private Double temperature;
    private String temperatureStatus;

    @NotNull(message = "Respiratory rate is required")
    @Min(value = 0, message = "Respiratory rate cannot be negative")
    @Max(value = 100, message = "Respiratory rate is too high")
    private Double respiratoryRate;
    private String respiratoryRateStatus;

    @NotNull(message = "Systolic BP is required")
    @Min(value = 0, message = "Systolic BP cannot be negative")
    @Max(value = 300, message = "Systolic BP is too high")
    private Double systolicBp;

    @NotNull(message = "Diastolic BP is required")
    @Min(value = 0, message = "Diastolic BP cannot be negative")
    @Max(value = 200, message = "Diastolic BP is too high")
    private Double diastolicBp;
    private String bloodpressureStatus;

    @Column(name = "recorded_at")
    private Instant recordedAt;

    @PrePersist
    public void setRecordedAt() {
        if (recordedAt == null) {
            recordedAt = Instant.now();
        }
    }


}
