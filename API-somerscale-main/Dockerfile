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
# Dockerfile drops it at /app/tests.
COPY tests /app/tests

# Pin the review fixture dirs to the absolute in-container path. With
# WORKDIR=/app the default relative `../tests` resolves to `/tests`, which
# does not exist here, so GooglePlacesClient/TripAdvisorClient silently read
# zero reviews (they use the single configured dir, not a ./ + ../ search).
# Point them at the real location so fixture-mode review sync works in prod.
ENV GOOGLE_PLACES_FIXTURE_DIR=/app/tests \
    TRIPADVISOR_FIXTURE_DIR=/app/tests

# Standard environment variables
ENV PORT=8080
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]