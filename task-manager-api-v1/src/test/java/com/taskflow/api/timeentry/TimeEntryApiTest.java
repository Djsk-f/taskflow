package com.taskflow.api.timeentry;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Feuilles de temps de bout en bout : routes fermées, saisies isolées, validation. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TimeEntryApiTest {

    @Autowired
    private MockMvc mockMvc;

    private String alice;
    private String bob;
    private long aliceTaskId;

    @BeforeAll
    void prepare() throws Exception {
        alice = "Bearer " + register("alice.timesheet@test.local");
        bob = "Bearer " + register("bob.timesheet@test.local");
        String created = mockMvc.perform(post("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, alice)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Rapport mensuel\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        aliceTaskId = ((Number) JsonPath.read(created, "$.id")).longValue();
    }

    private String register(String email) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Test\",\"email\":\"%s\",\"password\":\"Secret123\"}".formatted(email)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private String entryJson(long taskId, String date, int minutes) {
        return "{\"taskId\":%d,\"workDate\":\"%s\",\"durationMinutes\":%d,\"note\":\"Rédaction\"}"
                .formatted(taskId, date, minutes);
    }

    @Test
    @DisplayName("sans jeton, les routes de temps répondent 401")
    void routesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/time-entries?from=2026-09-14&to=2026-09-20")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/time-entries").contentType(MediaType.APPLICATION_JSON)
                .content(entryJson(aliceTaskId, "2026-09-14", 60))).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/tasks/" + aliceTaskId + "/time-entries")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("saisie, total de la tâche, puis isolation : Bob ne voit, ne modifie ni ne supprime rien")
    void entriesAreOwnedAndIsolated() throws Exception {
        String created = mockMvc.perform(post("/api/v1/time-entries").header(HttpHeaders.AUTHORIZATION, alice)
                        .contentType(MediaType.APPLICATION_JSON).content(entryJson(aliceTaskId, "2026-09-15", 90)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.taskTitle").value("Rapport mensuel"))
                .andExpect(jsonPath("$.durationMinutes").value(90))
                .andReturn().getResponse().getContentAsString();
        long entryId = ((Number) JsonPath.read(created, "$.id")).longValue();

        mockMvc.perform(get("/api/v1/tasks/" + aliceTaskId).header(HttpHeaders.AUTHORIZATION, alice))
                .andExpect(jsonPath("$.timeSpentMinutes").value(90));

        // Bob : sa semaine est vide, la tâche et la saisie d'Alice lui sont introuvables
        mockMvc.perform(get("/api/v1/time-entries?from=2026-09-14&to=2026-09-20").header(HttpHeaders.AUTHORIZATION, bob))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(post("/api/v1/time-entries").header(HttpHeaders.AUTHORIZATION, bob)
                        .contentType(MediaType.APPLICATION_JSON).content(entryJson(aliceTaskId, "2026-09-15", 30)))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/v1/time-entries/" + entryId).header(HttpHeaders.AUTHORIZATION, bob)
                        .contentType(MediaType.APPLICATION_JSON).content(entryJson(aliceTaskId, "2026-09-15", 1)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/time-entries/" + entryId).header(HttpHeaders.AUTHORIZATION, bob))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/tasks/" + aliceTaskId + "/time-entries").header(HttpHeaders.AUTHORIZATION, bob))
                .andExpect(status().isNotFound());

        // Alice : sa saisie est intacte, modifiable puis supprimable
        mockMvc.perform(put("/api/v1/time-entries/" + entryId).header(HttpHeaders.AUTHORIZATION, alice)
                        .contentType(MediaType.APPLICATION_JSON).content(entryJson(aliceTaskId, "2026-09-16", 45)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workDate").value("2026-09-16"))
                .andExpect(jsonPath("$.durationMinutes").value(45));
        mockMvc.perform(delete("/api/v1/time-entries/" + entryId).header(HttpHeaders.AUTHORIZATION, alice))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("durée hors bornes et période invalide : 400 avec le message traduit")
    void validationErrors() throws Exception {
        mockMvc.perform(post("/api/v1/time-entries").header(HttpHeaders.AUTHORIZATION, alice)
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "en")
                        .contentType(MediaType.APPLICATION_JSON).content(entryJson(aliceTaskId, "2026-09-15", 1441)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("durationMinutes"))
                .andExpect(jsonPath("$.fieldErrors[0].message").value("Duration must be between 1 minute and 24 hours."));
        mockMvc.perform(get("/api/v1/time-entries?from=2026-09-20&to=2026-09-14").header(HttpHeaders.AUTHORIZATION, alice))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
