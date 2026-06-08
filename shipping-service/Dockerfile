FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY common ./common
COPY api-gateway ./api-gateway
COPY user-service ./user-service
COPY product-service ./product-service
COPY order-service ./order-service
COPY cart-service ./cart-service
COPY payment-service ./payment-service
COPY review-service ./review-service
COPY notification-service ./notification-service
COPY shipping-service ./shipping-service
RUN mvn clean package -DskipTests
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/shipping-service/target/*.jar app.jar
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "app.jar"]
