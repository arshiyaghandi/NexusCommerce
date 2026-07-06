# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NexusCommerce is a Spring Boot 3.2.5 / Java 21 microservices e-commerce platform. Services are **reactive** (Spring WebFlux + R2DBC, not servlet/JPA), discover each other through Eureka, route through a Spring Cloud Gateway, authenticate via Keycloak (OAuth2 JWT resource servers), and coordinate order fulfillment through a **choreographed Saga over Kafka**.

## Build & Run

Maven multi-module reactor; each service has its own wrapper (`mvnw` / `mvnw.cmd`). The Spring Boot parent supplies dependency versions.

```bash
# Build everything from the repo root
./mvnw clean install

# Build one service plus the modules it depends on (e.g. messaging-contracts)
./mvnw -pl order-service/order-service -am compile

# Run a service
./mvnw -pl order-service/order-service spring-boot:run

# All tests for a module
./mvnw -pl payment-service/payment-service test

# A single test class / method
./mvnw -pl order-service/order-service test -Dtest=OrderApplicationTests
./mvnw -pl order-service/order-service test -Dtest=OrderApplicationTests#methodName
```

Infrastructure (Postgres, Redis, Keycloak, Kafka, Kafka-UI) runs via Docker:

```bash
docker compose up -d
```

- Postgres is exposed on host port **5433** (→ container 5432); `init.sql` creates one database per service (`order_db`, `inventory_db`, `payment_db`, `finance_db`, `product_db`) plus `keycloak_db`.
- Keycloak is on **8081** (realm `nexus-realm`), Kafka on **9092**, Kafka-UI on **8090**, Redis on **6379**.
- Each R2DBC service runs its own `schema.sql` on startup via a `DataBaseConfig` `ConnectionFactoryInitializer` (guarded by `@Profile("!test")`).

### Service topology (Eureka service-id → port)

`discovery-service` 8761 · `api-gateway` 8080 · `order-service` 8082 · `inventory-service` 8083 · `messaging-service` 8084 · `product-service` 8085 · `cart-service` 8086 · `payment-service` 8087 · `notification-service` 8088 · `finance-service` 8089.

All external traffic enters through the gateway on **8080**, which load-balances (`lb://…`) by Eureka service-id and relays the JWT downstream (`TokenRelay`). The order route additionally has a Redis-backed rate limiter and a circuit breaker.

## Architecture

### Repository layout
Each service lives in a nested `service-name/service-name/` directory (e.g. `order-service/order-service/`). Within a service, the package convention under `org.nexuxs.<svc>` is: `api` (REST controllers), `service` (business logic), `data/{model,dto,repository}`, `config`, `consumer` (Kafka listeners), `messaging` (Kafka publishers), `client` (WebClient calls to other services).

`messaging-service/` is itself a parent module with two children:
- **`messaging-contracts`** — the shared library of Kafka event records (`org.nexuxs.messaging.contracts.event.*`) and the central `NexusTopics` registry. Every service that produces or consumes events depends on this artifact. **Event shape changes must happen here** and ripple to all producers/consumers.
- **`messaging-service`** — a broker/observer service that also consumes some events.

### The order-fulfillment Saga (choreography, not orchestration)

There is no central coordinator. Each service reacts to an event and emits the next one. Happy path:

```
order-service:     POST /api/orders → save Order(PENDING) → publish OrderCreatedEvent
inventory-service: reserve stock → publish InventoryReservedEvent (or InventoryFailedEvent)
payment-service:   process payment → publish PaymentCompletedEvent (or PaymentFailedEvent)
order-service:     PaymentCompleted → Order COMPLETED ; finance-service records a Transaction
```

Compensation paths:
- **InventoryFailedEvent** → order-service moves the order to `REJECTED` (stock was never decremented, nothing to release).
- **PaymentFailedEvent** → order-service cancels the order (`CANCELLED`) **and** inventory-service releases the reserved stock. Stock release is made idempotent via a `processed_compensations` table keyed by `order_id` (insert-as-dedup-gate), because Kafka delivery is at-least-once.

Order state transitions go through an idempotent helper that no-ops on already-terminal orders — apply the same guard for any new Saga reaction.

### Kafka conventions (important, easy to get wrong)
- Topic names are **only** defined in `NexusTopics`. Note the inconsistency: some are dotted-namespaced (`nexus.order.created`, `nexus.inventory.reserved`, `nexus.payment.completed`) and the two failure topics are `inventory.failed.topic` / `payment.failed.topic`. Always reference the constants, never string literals.
- **Producers disable type headers** (`spring.json.add.type.headers: false`). Consequently consumers **cannot** infer the payload type from the record and must pin it explicitly with `new JsonDeserializer<>(EventType.class, false)` + `addTrustedPackages("org.nexuxs.messaging.contracts.event")`.
- Two consumer-wiring styles coexist: an **explicit** `ConsumerFactory` + `ConcurrentKafkaListenerContainerFactory` bean per event (order-service, inventory-service — required when there's no `spring.kafka.consumer` block in `application.yml`), and a **bare** `@KafkaListener` relying on `application.yml` consumer props + Boot autoconfig (messaging-service, notification-service, finance-service). When adding a listener, match the style the target service already uses.
- Kafka publishers/consumers are gated by `@ConditionalOnProperty(prefix = "nexus.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)` and Kafka beans/consumers are typically `@Profile("!test")` so tests run without a broker.

### Reactive & data-access notes
- Everything returns `Mono`/`Flux`. Publishing to Kafka is wrapped in `Mono.fromRunnable(...).subscribeOn(Schedulers.boundedElastic())` since `KafkaTemplate.send` is blocking.
- Persistence is **Spring Data R2DBC** (`ReactiveCrudRepository`), not JPA. There are no JPA annotations or `@Transactional` entity managers. Use `@Table`/`@Id` from `org.springframework.data.relational`/`org.springframework.data.annotation`.
- R2DBC `save()` decides INSERT vs UPDATE by whether `@Id` is null. To **force** an insert (e.g. an idempotency marker with a pre-set id), use `R2dbcEntityTemplate.insert(...)` and treat `DuplicateKeyException`/`DataIntegrityViolationException` as the "already processed" signal.
- The authenticated user id is the JWT subject, read reactively via `ReactiveSecurityContextHolder` (see `OrderService.currentUserId()`); inter-service calls forward the bearer token (see `order-service` `InventoryClient`).

### Frontend
`frontend/` is a Vite + React app (see its own `package.json`): `npm install`, `npm run dev`, `npm run build`. It talks to the gateway and stores tokens client-side (`src/services/`).
