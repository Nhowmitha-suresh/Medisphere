package com.springboard.Vitals_validation.controller;

import com.springboard.Vitals_validation.model.Vitalsmodel;
import com.springboard.Vitals_validation.service.VitalsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class vitalscontroller {
    @Autowired
    private VitalsService vitalservice;

    @PostMapping("/vitals")
    public Vitalsmodel postvitals(@Valid @RequestBody Vitalsmodel vitals)
    {

        return vitalservice.vitalsave(vitals);
    }
    @GetMapping("/getvitals")
    public List<Vitalsmodel> getvitals()
    {

        return vitalservice.findall();
    }

    @GetMapping("/vitals/current")
    public List<Vitalsmodel> getcurrentvitals()
    {
        List<Vitalsmodel> all = vitalservice.findall();
        if (all.isEmpty()) {
            // Provide an initial sample vital reading for dashboard bootstrap
            Vitalsmodel sample = new Vitalsmodel();
            sample.setPatientId("P1001");
            sample.setHeartRate(72.0);
            sample.setSpo2(98.0);
            sample.setTemperature(36.8);
            sample.setRespiratoryRate(16.0);
            sample.setSystolicBp(120.0);
            sample.setDiastolicBp(80.0);
            return List.of(vitalservice.vitalsave(sample));
        }
        return all;
    }
//    @DeleteMapping("/delete")
//    public String deleteall()
//    {
//        vitalservice.deleteall();
//        return "deleted";
//    }

}
