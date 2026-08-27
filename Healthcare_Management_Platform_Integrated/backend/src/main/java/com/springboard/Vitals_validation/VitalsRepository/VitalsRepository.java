package com.springboard.Vitals_validation.VitalsRepository;

import com.springboard.Vitals_validation.model.Vitalsmodel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VitalsRepository extends JpaRepository<Vitalsmodel, Long> {

}
