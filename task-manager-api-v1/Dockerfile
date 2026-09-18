# syntax=docker/dockerfile:1

# ---- Build : dépendances d'abord (couche mise en cache), puis sources ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src/ src/
# Les tests tournent en intégration continue et via `./mvnw test`, pas dans l'image.
RUN mvn -B -q package -DskipTests && cp target/*.jar app.jar

# ---- Exécution : JRE seul, utilisateur non root ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/app.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
