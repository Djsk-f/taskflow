package com.taskflow.api.task;

import com.taskflow.api.common.exception.ApiException;
import com.taskflow.api.common.exception.ErrorCode;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Tri demandé sur une liste de tâches, validé contre une liste blanche (EX-11) : un tri
 * libre exposerait des colonnes internes. L'ordre est construit par
 * {@link TaskSpecifications#orderedBy(TaskSort)} et non par Spring Data, car priorité et
 * statut sont stockés en texte : trié tel quel, on obtiendrait « HIGH, LOW, MEDIUM ».
 */
public record TaskSort(Field field, boolean ascending) {

    public static final TaskSort DEFAULT = new TaskSort(Field.CREATED_AT, false);

    public enum Field {
        CREATED_AT("createdAt"),
        DUE_DATE("dueDate"),
        TITLE("title"),
        PRIORITY("priority"),
        STATUS("status");

        private final String apiName;

        Field(String apiName) {
            this.apiName = apiName;
        }
    }

    /** Lit un paramètre `champ,asc|desc` ; sans direction, l'ordre est décroissant. */
    public static TaskSort parse(String sort) {
        if (sort == null || sort.isBlank()) {
            return DEFAULT;
        }
        String[] parts = sort.split(",");
        String name = parts[0].trim();
        Field field = Arrays.stream(Field.values())
                .filter(candidate -> candidate.apiName.equals(name))
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_ERROR, "error.sort.invalid", name,
                        Arrays.stream(Field.values()).map(value -> value.apiName).collect(Collectors.joining(", "))));
        return new TaskSort(field, parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()));
    }
}
