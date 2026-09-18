package com.taskflow.api;

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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Test d'intégration de la chaîne complète (sécurité incluse) : il vérifie les deux
 * promesses du produit qu'aucun test unitaire ne peut prouver seul — les routes sont
 * fermées par défaut, et une ressource d'autrui est introuvable sur tous les verbes.
 *
 * <p>Nommé *Test et non *IT volontairement : sans plugin Failsafe configuré, un *IT est
 * silencieusement ignoré par `mvn test` comme par `mvn verify`. Un test de sécurité qui
 * ne s'exécute pas est pire qu'absent, puisqu'il donne l'illusion d'une couverture.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TaskApiSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    private String tokenAlice;
    private String tokenBob;
    private long aliceTaskId;

    @BeforeAll
    void prepareTwoUsersAndOneTask() throws Exception {
        tokenAlice = register("alice.it@test.local");
        tokenBob = register("bob.it@test.local");

        String created = mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Tâche d'Alice\",\"priority\":\"HIGH\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        aliceTaskId = ((Number) JsonPath.read(created, "$.id")).longValue();
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

    @Test
    @DisplayName("sans jeton, chaque route de tâches répond 401 au format de l'API")
    void allTaskRoutesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/tasks")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/api/v1/tasks"));
        mockMvc.perform(post("/api/v1/tasks").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/tasks/" + aliceTaskId)).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/v1/tasks/" + aliceTaskId).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"x\"}")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/v1/tasks/" + aliceTaskId)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("la tâche d'Alice est introuvable pour Bob en lecture, modification et suppression")
    void foreignTaskIsNotFoundOnEveryVerb() throws Exception {
        String bearerBob = "Bearer " + tokenBob;

        mockMvc.perform(get("/api/v1/tasks/" + aliceTaskId).header(HttpHeaders.AUTHORIZATION, bearerBob))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
        mockMvc.perform(put("/api/v1/tasks/" + aliceTaskId).header(HttpHeaders.AUTHORIZATION, bearerBob)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Piraté\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/tasks/" + aliceTaskId).header(HttpHeaders.AUTHORIZATION, bearerBob))
                .andExpect(status().isNotFound());

        // La tâche d'Alice est toujours là, intacte.
        mockMvc.perform(get("/api/v1/tasks/" + aliceTaskId).header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Tâche d'Alice"));
    }

    @Test
    @DisplayName("la liste de Bob ne contient aucune tâche d'Alice")
    void listIsScopedToRequester() throws Exception {
        mockMvc.perform(get("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    @DisplayName("les erreurs conservent leur statut et le format unique de l'API")
    void errorsKeepTheirStatusAndFormat() throws Exception {
        String bearerAlice = "Bearer " + tokenAlice;

        // Corps JSON illisible
        mockMvc.perform(post("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, bearerAlice)
                        .contentType(MediaType.APPLICATION_JSON).content("{ceci n'est pas du json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        // Méthode non autorisée : 405 conservé, pas transformé en 500
        mockMvc.perform(put("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, bearerAlice)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\"}"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"))
                .andExpect(jsonPath("$.status").value(405));

        // Type de média refusé : 415 conservé
        mockMvc.perform(post("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, bearerAlice)
                        .contentType(MediaType.TEXT_PLAIN).content("titre"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));

        // Validation : fieldErrors présents
        mockMvc.perform(post("/api/v1/tasks").header(HttpHeaders.AUTHORIZATION, bearerAlice)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("title"));

        // Valeur d'enum inconnue : 400 et non 500
        mockMvc.perform(get("/api/v1/tasks?status=FOO").header(HttpHeaders.AUTHORIZATION, bearerAlice))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
