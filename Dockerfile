# Build & Runtime stage for LAZAROPH E-Commerce Platform
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Copy source and webapp assets
COPY src ./src

# Compile Java source code
RUN mkdir -p bin && \
    find src/main/java -name "*.java" > sources.txt && \
    javac -encoding UTF-8 -d bin @sources.txt && \
    rm sources.txt

# Final lightweight production image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy compiled classes and webapp static assets
COPY --from=build /app/bin ./bin
COPY src/main/webapp ./src/main/webapp

# Port configuration (supports Google Cloud Run $PORT or defaults to 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["java", "-cp", "bin", "com.lazaroph.Main", "8080"]
