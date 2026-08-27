package com.springboard.Vitals_validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboard.Vitals_validation.model.Vitalsmodel;
import com.springboard.Vitals_validation.service.VitalsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VitalsValidationApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private VitalsService vitalsService;

	@Autowired
	private ObjectMapper objectMapper;

	@BeforeEach
	void setUp() {
		vitalsService.deleteall();
	}

	@Test
	void contextLoads() {
		assertNotNull(vitalsService);
	}

	@Test
	void testVitalsServiceValidationNormal() {
		Vitalsmodel model = new Vitalsmodel();
		model.setPatientId("P100");
		model.setHeartRate(72.0);
		model.setSpo2(98.0);
		model.setTemperature(36.8);
		model.setRespiratoryRate(16.0);
		model.setSystolicBp(120.0);
		model.setDiastolicBp(80.0);

		Vitalsmodel saved = vitalsService.vitalsave(model);
		assertEquals("NORMAL", saved.getHeartRateStatus());
		assertEquals("NORMAL", saved.getSpo2Status());
		assertEquals("NORMAL", saved.getTemperatureStatus());
		assertEquals("NORMAL", saved.getRespiratoryRateStatus());
		assertEquals("NORMAL", saved.getBloodpressureStatus());
		assertNotNull(saved.getRecordedAt());
	}

	@Test
	void testVitalsServiceValidationAbnormal() {
		Vitalsmodel model = new Vitalsmodel();
		model.setPatientId("P101");
		model.setHeartRate(120.0);
		model.setSpo2(92.0);
		model.setTemperature(38.5);
		model.setRespiratoryRate(25.0);
		model.setSystolicBp(145.0);
		model.setDiastolicBp(95.0);

		Vitalsmodel saved = vitalsService.vitalsave(model);
		assertEquals("HIGH", saved.getHeartRateStatus());
		assertEquals("LOW", saved.getSpo2Status());
		assertEquals("HIGH", saved.getTemperatureStatus());
		assertEquals("HIGH", saved.getRespiratoryRateStatus());
		assertEquals("HIGH", saved.getBloodpressureStatus());
	}

	@Test
	void testPostVitalsEndpoint() throws Exception {
		Vitalsmodel model = new Vitalsmodel();
		model.setPatientId("P200");
		model.setHeartRate(75.0);
		model.setSpo2(99.0);
		model.setTemperature(36.6);
		model.setRespiratoryRate(15.0);
		model.setSystolicBp(115.0);
		model.setDiastolicBp(75.0);

		mockMvc.perform(post("/api/vitals")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(model)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.patientId", is("P200")))
				.andExpect(jsonPath("$.heartRateStatus", is("NORMAL")))
				.andExpect(jsonPath("$.spo2Status", is("NORMAL")));
	}

	@Test
	void testGetVitalsEndpoint() throws Exception {
		Vitalsmodel model = new Vitalsmodel();
		model.setPatientId("P300");
		model.setHeartRate(80.0);
		model.setSpo2(97.0);
		model.setTemperature(36.9);
		model.setRespiratoryRate(14.0);
		model.setSystolicBp(118.0);
		model.setDiastolicBp(78.0);
		vitalsService.vitalsave(model);

		mockMvc.perform(get("/api/getvitals"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].patientId", is("P300")));
	}

	@Test
	void testGetCurrentVitalsEndpointWhenEmpty() throws Exception {
		mockMvc.perform(get("/api/vitals/current"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].patientId", is("P1001")));
	}

	@Test
	void testAnomalyDetectionEndpoint() throws Exception {
		Map<String, Object> payload = Map.of(
				"heart_rate", 120.0,
				"systolic_bp", 160.0,
				"diastolic_bp", 100.0,
				"temperature", 39.0,
				"spo2", 89.0,
				"respiratory_rate", 28.0
		);

		mockMvc.perform(post("/api/anomaly/detect")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.anomalyDetected", is(true)))
				.andExpect(jsonPath("$.prediction", is(-1)))
				.andExpect(jsonPath("$.status", is("SUCCESS")));
	}

	@Test
	void testAnomalyPrecisionEndpoint() throws Exception {
		mockMvc.perform(get("/api/anomaly/precision"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tp", is(227)))
				.andExpect(jsonPath("$.fp", is(23)))
				.andExpect(jsonPath("$.total", is(250)));
	}

	@Test
	void testAlertsRecentEndpoint() throws Exception {
		mockMvc.perform(get("/api/alerts/recent"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(greaterThan(0))))
				.andExpect(jsonPath("$[0].sev", notNullValue()));
	}
}

