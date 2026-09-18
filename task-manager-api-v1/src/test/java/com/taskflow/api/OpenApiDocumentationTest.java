package com.taskflow.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** La documentation interactive est publique, complète et fidèle au modèle de sécurité. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiDocumentationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("le contrat OpenAPI est public et décrit toutes les familles de routes")
    void apiDocsArePublicAndComplete() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("TaskFlow API"))
                .andExpect(jsonPath("$.paths", hasKey("/api/v1/auth/login")))
                .andExpect(jsonPath("$.paths", hasKey("/api/v1/users/me")))
                .andExpect(jsonPath("$.paths", hasKey("/api/v1/tasks/{taskId}/status")))
                .andExpect(jsonPath("$.paths", hasKey("/api/v1/time-entries")))
                .andExpect(jsonPath("$.components.securitySchemes.bearer.scheme").value("bearer"))
                .andExpect(jsonPath("$.components.schemas", hasKey("ApiErrorResponse")));
    }

    @Test
    @DisplayName("connexion publique, tâches protégées, et jamais de paramètre userId exposé")
    void securityIsFaithful() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.paths['/api/v1/auth/login'].post.security", empty()))
                .andExpect(jsonPath("$.paths['/api/v1/tasks'].get.responses", hasKey("401")))
                .andExpect(jsonPath("$.paths['/api/v1/tasks/{taskId}'].get.responses", hasKey("404")))
                .andExpect(content().string(not(containsString("\"name\":\"userId\""))));
    }

    @Test
    @DisplayName("Swagger UI est accessible sans jeton")
    void swaggerUiIsPublic() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("swagger-ui")));
    }
}
