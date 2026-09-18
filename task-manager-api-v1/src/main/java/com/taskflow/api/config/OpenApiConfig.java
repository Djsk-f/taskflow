package com.taskflow.api.config;

import com.taskflow.api.common.exception.ApiErrorResponse;
import com.taskflow.api.security.CurrentUser;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.core.converter.ResolvedSchema;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentation interactive de l'API (springdoc) : /swagger-ui.html, contrat brut sur
 * /v3/api-docs. Le bouton « Authorize » de Swagger UI accepte le jeton renvoyé par
 * /auth/login ; toutes les routes l'exigent, sauf celles marquées publiques.
 */
@Configuration
public class OpenApiConfig {

    static final String BEARER = "bearer";
    private static final String ERROR_SCHEMA = "ApiErrorResponse";

    static {
        // L'utilisateur vient du jeton, jamais de la requête : ce n'est pas un paramètre.
        SpringDocUtils.getConfig().addAnnotationsToIgnore(CurrentUser.class);
    }

    @Bean
    public OpenAPI taskflowOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("TaskFlow API")
                        .version("v1")
                        .description("""
                                API REST de TaskFlow : comptes, tâches, feuilles de temps.

                                1. Créer un compte (`POST /auth/register`) ou se connecter (`POST /auth/login`).
                                2. Copier `accessToken`, cliquer sur **Authorize** et le coller.
                                3. Toutes les routes sont alors utilisables : chaque utilisateur ne voit que ses données.

                                Erreurs : format unique `ApiErrorResponse`. Langue des messages : `Accept-Language` (fr par défaut, en)."""))
                .components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Jeton renvoyé par /api/v1/auth/login ou /register (valable 24 h).")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER))
                // Ordre d'affichage des groupes dans Swagger UI : celui du parcours utilisateur.
                .addTagsItem(new Tag().name("Authentification").description("Inscription et connexion : routes publiques qui délivrent le jeton JWT."))
                .addTagsItem(new Tag().name("Profil").description("Profil de l'utilisateur du jeton (jamais un identifiant passé dans l'URL)."))
                .addTagsItem(new Tag().name("Tâches").description("Tâches de l'utilisateur du jeton. La tâche d'un autre utilisateur est introuvable (404), jamais « interdite »."))
                .addTagsItem(new Tag().name("Feuilles de temps").description("Temps passé par tâche et par jour. Une saisie ne peut viser qu'une tâche de l'utilisateur."));
    }

    /**
     * Réponses d'erreur standard ajoutées à chaque route, au format commun, plutôt que
     * répétées en annotations sur chaque méthode : 401 sur les routes protégées, 404 sur
     * les routes à identifiant (ressource absente ou appartenant à autrui), 400 sur les écritures.
     */
    @Bean
    public OpenApiCustomizer standardErrorResponses() {
        return openApi -> {
            ResolvedSchema resolved = ModelConverters.getInstance()
                    .resolveAsResolvedSchema(new AnnotatedType(ApiErrorResponse.class));
            openApi.getComponents().addSchemas(ERROR_SCHEMA, resolved.schema);
            resolved.referencedSchemas.forEach(openApi.getComponents()::addSchemas);

            openApi.getPaths().forEach((path, item) -> item.readOperationsMap().forEach((method, operation) -> {
                boolean isPublic = operation.getSecurity() != null && operation.getSecurity().isEmpty();
                if (!isPublic) {
                    addError(operation, "401", "Jeton absent, expiré ou invalide (UNAUTHORIZED).");
                }
                if (path.contains("{")) {
                    addError(operation, "404", "Ressource introuvable, ou appartenant à un autre utilisateur (RESOURCE_NOT_FOUND).");
                }
                if (method == PathItem.HttpMethod.POST || method == PathItem.HttpMethod.PUT
                        || method == PathItem.HttpMethod.PATCH) {
                    addError(operation, "400", "Corps invalide : `fieldErrors` détaille chaque champ (VALIDATION_ERROR).");
                }
            }));
        };
    }

    private static void addError(Operation operation, String status, String description) {
        if (operation.getResponses().containsKey(status)) {
            return;
        }
        operation.getResponses().addApiResponse(status, new ApiResponse()
                .description(description)
                .content(new Content().addMediaType("application/json",
                        new MediaType().schema(new Schema<>().$ref("#/components/schemas/" + ERROR_SCHEMA)))));
    }
}
