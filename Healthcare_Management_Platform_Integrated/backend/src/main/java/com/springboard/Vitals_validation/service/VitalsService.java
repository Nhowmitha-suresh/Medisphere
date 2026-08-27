package com.springboard.Vitals_validation.service;

import com.springboard.Vitals_validation.VitalsRepository.VitalsRepository;
import com.springboard.Vitals_validation.model.Vitalsmodel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Service
public class VitalsService {
    @Autowired
    private VitalsRepository vitalrepo;




    public Vitalsmodel vitalsave(Vitalsmodel vitals) {
        // Heart Rate
        if (vitals.getHeartRate() < 60) {
            vitals.setHeartRateStatus("LOW");
        } else if (vitals.getHeartRate() > 100) {
            vitals.setHeartRateStatus("HIGH");
        } else {
            vitals.setHeartRateStatus("NORMAL");
        }

        // SpO2
        if (vitals.getSpo2() < 95) {
            vitals.setSpo2Status("LOW");
        } else {
            vitals.setSpo2Status("NORMAL");
        }

        // Temperature
        if (vitals.getTemperature() < 36.1) {
            vitals.setTemperatureStatus("LOW");
        } else if (vitals.getTemperature() > 37.2) {
            vitals.setTemperatureStatus("HIGH");
        } else {
            vitals.setTemperatureStatus("NORMAL");
        }

        // Respiratory Rate
        if (vitals.getRespiratoryRate() < 12) {
            vitals.setRespiratoryRateStatus("LOW");
        } else if (vitals.getRespiratoryRate() > 20) {
            vitals.setRespiratoryRateStatus("HIGH");
        } else {
            vitals.setRespiratoryRateStatus("NORMAL");
        }

        // Blood Pressure
        if (vitals.getSystolicBp() < 90 || vitals.getDiastolicBp() < 60) {
            vitals.setBloodpressureStatus("low");
        } else if (vitals.getSystolicBp() > 120 || vitals.getDiastolicBp() > 80) {
            vitals.setBloodpressureStatus("HIGH");
        } else {
            vitals.setBloodpressureStatus("NORMAL");
        }
        return vitalrepo.save(vitals);
    }

    public List<Vitalsmodel> findall() {
        return vitalrepo.findAll();
    }

    public void deleteall() {
        vitalrepo.deleteAll();
    }
}
