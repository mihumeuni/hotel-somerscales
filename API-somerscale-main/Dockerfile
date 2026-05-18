# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Fixture data consumed by MockCloudbedsApiClient, GooglePlacesClient,
# TripAdvisorClient, FichaSeeder. Lives next to src/ in the HF Space repo;
# Dockerfile drops it at /app/tests so the default fixture-dir resolves
# correctly when WORKDIR=/app (../tests = /tests in Docker, hence the
# mock client searches both ../tests and ./tests).
COPY tests /app/tests

# Standard environment variables
ENV PORT=8080
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]