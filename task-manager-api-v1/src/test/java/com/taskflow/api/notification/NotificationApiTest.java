package com.taskflow.api.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Bout en bout HTTP : routes fermées, cloisonnement, lu / tout lu, nettoyage à la modification. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NotificationGenerator generator;

    @Autowired
    private NotificationStream notificationStream;

    @Test
    @DisplayName("sans jeton, les routes de notifications répondent 401")
    void routesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/notifications")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/notifications/unread-count")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/notifications/read-all")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("le propriétaire voit et lit son rappel ; un autre ne le voit pas et reçoit 404")
    void ownerReadsOwnNotificationOnly() throws Exception {
        String alice = bearer(register("alice.notif@test.local"));
        String bob = bearer(register("bob.notif@test.local"));
        long taskId = createTask(alice, "Rendre le rapport", Instant.now().plus(Duration.ofMinutes(30)));

        generator.generate(Instant.now());

        String list = mockMvc.perform(get("/api/v1/notifications").header(HttpHeaders.AUTHORIZATION, alice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].type").value("DUE_IN_1H"))
                .andExpect(jsonPath("$.content[0].taskId").value(taskId))
                .andExpect(jsonPath("$.content[0].taskTitle").value("Rendre le rapport"))
                .andExpect(jsonPath("$.content[0].read").value(false))
                .andReturn().getResponse().getContentAsString();
        long notificationId = ((Number) JsonPath.read(list, "$.content[0].id")).longValue();

        mockMvc.perform(get("/api/v1/notifications/unread-count").header(HttpHeaders.AUTHORIZATION, bob))
                .andExpect(jsonPath("$.count").value(0));
        mockMvc.perform(patch("/api/v1/notifications/" + notificationId + "/read").header(HttpHeaders.AUTHORIZATION, bob))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));

        mockMvc.perform(patch("/api/v1/notifications/" + notificationId + "/read").header(HttpHeaders.AUTHORIZATION, alice))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/notifications/unread-count").header(HttpHeaders.AUTHORIZATION, alice))
                .andExpect(jsonPath("$.count").value(0));
        mockMvc.perform(post("/api/v1/notifications/read-all").header(HttpHeaders.AUTHORIZATION, alice))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("repousser l'échéance d'une tâche retire le rappel devenu faux")
    void movingTheDueDateDiscardsTheReminder() throws Exception {
        String carol = bearer(register("carol.notif@test.local"));
        long taskId = createTask(carol, "Payer la facture", Instant.now().plus(Duration.ofMinutes(45)));
        generator.generate(Instant.now());
        mockMvc.perform(get("/api/v1/notifications/unread-count").header(HttpHeaders.AUTHORIZATION, carol))
                .andExpect(jsonPath("$.count").value(1));

        mockMvc.perform(put("/api/v1/tasks/" + taskId).header(HttpHeaders.AUTHORIZATION, carol)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Payer la facture\",\"dueDate\":\"%s\"}"
                                .formatted(Instant.now().plus(Duration.ofDays(10)))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/notifications").header(HttpHeaders.AUTHORIZATION, carol))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("préférences : défauts, modification, et corps incomplet refusé")
    void preferencesCanBeReadAndChanged() throws Exception {
        String dave = bearer(register("dave.notif@test.local"));
        mockMvc.perform(get("/api/v1/users/me/notification-preferences").header(HttpHeaders.AUTHORIZATION, dave))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueIn24h").value(true))
                .andExpect(jsonPath("$.dailyTimeReminder").value(false))
                .andExpect(jsonPath("$.emailDigest").value(false))
                .andExpect(jsonPath("$.language").value("fr"));

        mockMvc.perform(put("/api/v1/users/me/notification-preferences").header(HttpHeaders.AUTHORIZATION, dave)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dueIn24h\":false,\"dueIn1h\":true,\"overdue\":true,\"dailyTimeReminder\":true,"
                                + "\"emailDigest\":true,\"language\":\"en\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueIn24h").value(false))
                .andExpect(jsonPath("$.dailyTimeReminder").value(true))
                .andExpect(jsonPath("$.emailDigest").value(true))
                .andExpect(jsonPath("$.language").value("en"));

        mockMvc.perform(put("/api/v1/users/me/notification-preferences").header(HttpHeaders.AUTHORIZATION, dave)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"dueIn24h\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mockMvc.perform(get("/api/v1/users/me/notification-preferences"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("flux temps réel : fermé sans jeton, ouvert avec, et refermé à la fin")
    void streamIsProtectedAndOpens() throws Exception {
        mockMvc.perform(get("/api/v1/notifications/stream")).andExpect(status().isUnauthorized());

        String eve = bearer(register("eve.notif@test.local"));
        int before = notificationStream.openStreams();
        var async = mockMvc.perform(get("/api/v1/notifications/stream").header(HttpHeaders.AUTHORIZATION, eve))
                .andExpect(request().asyncStarted())
                .andReturn();

        assertThat(notificationStream.openStreams()).isEqualTo(before + 1);
        assertThat(async.getResponse().getContentAsString()).contains("connected");

        // Fin de la requête asynchrone : le flux doit se retirer du registre.
        async.getRequest().getAsyncContext().complete();
        assertThat(notificationStream.openStreams()).isEqualTo(before);
    }

    private long createTask(String bearer, String title, Instant dueDate) throws Exception {
        String body = mockMvc.perform(post("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"%s\",\"dueDate\":\"%s\"}".formatted(title, dueDate)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private String register(String email) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Utilisateur Test\",\"email\":\"%s\",\"password\":\"Secret123\"}"
                                .formatted(email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
