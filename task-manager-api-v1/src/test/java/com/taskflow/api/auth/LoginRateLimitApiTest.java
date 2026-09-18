package com.taskflow.api.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Force brute sur la connexion : 429 après 5 échecs, même avec le bon mot de passe. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LoginRateLimitApiTest {

    @Autowired
    private MockMvc mockMvc;

    private void login(String email, String password, int expectedStatus) throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().is(expectedStatus));
    }

    @Test
    @DisplayName("5 mots de passe faux puis le bon : 429 et Retry-After ; un autre compte n'est pas touché")
    void bruteForceIsThrottled() throws Exception {
        String secret = UUID.randomUUID().toString();
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Cible\",\"email\":\"cible.rl@test.local\",\"password\":\"%s\"}".formatted(secret)))
                .andExpect(status().isCreated());

        for (int attempt = 0; attempt < 5; attempt++) {
            login("cible.rl@test.local", "mauvais-" + attempt, 401);
        }
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "en")
                        .content("{\"email\":\"cible.rl@test.local\",\"password\":\"%s\"}".formatted(secret)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.code").value("TOO_MANY_REQUESTS"))
                .andExpect(jsonPath("$.message").value("Too many sign-in attempts. Try again in 15 min."));

        login("inconnu.rl@test.local", "peu-importe", 401);
    }
}
