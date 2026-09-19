package com.taskflow.api.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** Chrono « En cours » et statut « Terminé » définitif, par l'API. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskLifecycleApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepository;

    private String bearer;

    @BeforeEach
    void register() throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Chrono\",\"email\":\"chrono.%s@test.local\",\"password\":\"Secret123\"}"
                                .formatted(System.nanoTime())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        bearer = "Bearer " + JsonPath.read(body, "$.accessToken");
    }

    @Test
    @DisplayName("quitter « En cours » enregistre le temps écoulé et arrête le chrono")
    void leavingInProgressRecordsElapsedTime() throws Exception {
        long id = create("IN_PROGRESS");
        mockMvc.perform(get("/api/v1/tasks/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(jsonPath("$.timerStartedAt").exists());
        shiftTimer(id, Duration.ofMinutes(90));

        changeStatus(id, "IN_REVIEW")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timerStartedAt").doesNotExist())
                .andExpect(jsonPath("$.timeSpentMinutes").value(90));
        mockMvc.perform(get("/api/v1/tasks/" + id + "/time-entries").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].durationMinutes").value(90))
                .andExpect(jsonPath("$[0].note").value("Chrono « En cours »"));
    }

    @Test
    @DisplayName("moins d'une minute : rien n'est enregistré ; plus de 24 h : plafonné")
    void shortAndLongTimers() throws Exception {
        long quick = create("IN_PROGRESS");
        changeStatus(quick, "TODO").andExpect(jsonPath("$.timeSpentMinutes").value(0));

        long forgotten = create("IN_PROGRESS");
        shiftTimer(forgotten, Duration.ofHours(30));
        changeStatus(forgotten, "IN_REVIEW").andExpect(jsonPath("$.timeSpentMinutes").value(TaskLifecycle.MAX_MINUTES));
    }

    @Test
    @DisplayName("« Terminé » est définitif, en PATCH comme en PUT ; le reste reste modifiable")
    void completedTaskCannotChangeStatus() throws Exception {
        long id = create("TODO");
        changeStatus(id, "DONE").andExpect(status().isOk());
        expireUndoWindow(id);

        changeStatus(id, "TODO")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TASK_COMPLETED"));
        mockMvc.perform(put("/api/v1/tasks/" + id).header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Rouverte\",\"status\":\"TODO\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/v1/tasks/" + id).header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Titre corrigé\",\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Titre corrigé"));
    }

    @Test
    @DisplayName("annulation juste après « Terminé » : autorisée, et le chrono repart")
    void undoRightAfterCompletion() throws Exception {
        long id = create("IN_PROGRESS");
        changeStatus(id, "DONE").andExpect(status().isOk());

        changeStatus(id, "IN_PROGRESS")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timerStartedAt").exists());
    }

    private long create(String status) throws Exception {
        String body = mockMvc.perform(post("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Tâche %s\",\"status\":\"%s\"}".formatted(status, status)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private ResultActions changeStatus(long id, String status) throws Exception {
        return mockMvc.perform(patch("/api/v1/tasks/" + id + "/status").header(HttpHeaders.AUTHORIZATION, bearer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"%s\"}".formatted(status)));
    }

    /** Fait comme si le chrono tournait depuis `elapsed`. */
    private void shiftTimer(long id, Duration elapsed) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setTimerStartedAt(Instant.now().minus(elapsed));
        taskRepository.saveAndFlush(task);
        assertThat(taskRepository.findById(id).orElseThrow().getTimerStartedAt()).isNotNull();
    }

    private void expireUndoWindow(long id) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setCompletedAt(Instant.now().minus(TaskLifecycle.UNDO_WINDOW).minusSeconds(1));
        taskRepository.saveAndFlush(task);
    }
}
