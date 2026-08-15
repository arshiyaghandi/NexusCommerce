# NexusCommerce

A production-grade microservices e-commerce platform built with **Spring Boot 3.2** (Java 21) and **React** (Vite).

## Architecture

NexusCommerce follows a **reactive microservices** architecture. All backend services use **Spring WebFlux + R2DBC** (non-blocking), discover each other via **Eureka**, route traffic through a **Spring Cloud Gateway**, authenticate with **Keycloak** (OAuth2 JWT), and coordinate order fulfillment through a **choreographed Saga over Kafka**.

```
┌─────────────┐      ┌──────────────┐      ┌───────────────────────────────────┐
│   React UI  │─────▶│  API Gateway │─────▶│  Microservices (via Eureka)      │
│  (Vite)     │      │  :8080       │      │                                   │
└─────────────┘      └──────────────┘      │  auth-service         :8091      │
                            │               │  order-service        :8082      │
                     ┌──────┴──────┐       │  inventory-service    :8083      │
                     │  Keycloak   │       │  product-service      :8085      │
                     │  :8081      │       │  cart-service         :8086      │
                     └─────────────┘       │  payment-service      :8087      │
                                           │  notification-service :8088      │
                     ┌─────────────┐       │  finance-service      :8089      │
                     │    Kafka    │◀──────│  messaging-service    :8084      │
                     │   :9092     │       └───────────────────────────────────┘
                     └─────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
        ┌─────────┐  ┌───────────┐  ┌──────────┐
        │Postgres │  │   Redis   │  │   ELK    │
        │ :5433   │  │  :6379    │  │ :9200    │
        └─────────┘  └───────────┘  └──────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| **discovery-service** | 8761 | Eureka service registry |
| **api-gateway** | 8080 | Spring Cloud Gateway with rate limiting & circuit breaker |
| **auth-service** | 8091 | Authentication via Keycloak (OAuth2 client + resource server) |
| **order-service** | 8082 | Order management, Saga coordinator (reactive) |
| **inventory-service** | 8083 | Stock management with reservation & compensation |
| **product-service** | 8085 | Product catalog with categories |
| **cart-service** | 8086 | Redis-backed shopping cart |
| **payment-service** | 8087 | Payment processing |
| **notification-service** | 8088 | WebSocket push notifications |
| **finance-service** | 8089 | Transaction ledger |
| **messaging-service** | 8084 | Kafka event broker + shared contracts |

## Order Fulfillment Saga

The platform uses a **choreography-based Saga** (no central orchestrator). Each service reacts to events and emits the next:

```
POST /api/orders
    │
    ▼
┌─────────────┐    OrderCreatedEvent    ┌───────────────────┐
│ order-svc   │ ──────────────────────▶ │ inventory-svc     │
│ (PENDING)   │                         │ reserve stock     │
└─────────────┘                         └────────┬──────────┘
                                                 │
                              InventoryReservedEvent
                                                 │
                                                 ▼
                                        ┌───────────────────┐
                                        │ payment-svc       │
                                        │ process payment   │
                                        └────────┬──────────┘
                                                 │
                              PaymentCompletedEvent
                                                 │
                                                 ▼
                                        ┌───────────────────┐
                                        │ order-svc         │
                                        │ (COMPLETED)       │
                                        └───────────────────┘
```

**Compensation paths:**
- `InventoryFailedEvent` → order moves to `REJECTED`
- `PaymentFailedEvent` → order `CANCELLED` + inventory releases reserved stock (idempotent via `processed_compensations` table)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2.5, Java 21, WebFlux, R2DBC |
| Frontend | React 19, Vite, TypeScript, Framer Motion, TailwindCSS |
| Database | PostgreSQL 18 (one DB per service) |
| Cache | Redis 7 |
| Auth | Keycloak 24 (OAuth2 / JWT) |
| Messaging | Apache Kafka (KRaft mode) |
| Service Discovery | Netflix Eureka |
| API Gateway | Spring Cloud Gateway |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack (Elasticsearch, Logstash, Kibana) |
| CI/CD | Jenkins (Jenkinsfile included) |
| API Docs | SpringDoc OpenAPI (Swagger UI) |

## Prerequisites

- **Docker Desktop** (or Docker Engine with Compose v2)
- **Java 21** (for local development)
- **Maven 3.9+** (wrapper `./mvnw` is included)
- **Node.js 20+** and npm

## Quick Start

### 1. Start Infrastructure

```bash
# Clone the repository
git clone https://github.com/arshiyaghandi/NexusCommerce.git
cd NexusCommerce

# Start all infrastructure services
docker compose up -d
```

This launches PostgreSQL, Redis, Keycloak, Kafka, Kafka-UI, ELK stack, Prometheus, and Grafana.

### 2. Build & Run Backend

```bash
# Build all services
./mvnw clean install

# Or build a specific service
./mvnw -pl order-service/order-service -am compile

# Run a specific service
./mvnw -pl order-service/order-service spring-boot:run
```

Alternatively, use the provided scripts:
- **Windows**: `run_services.bat` or `start_all.ps1`

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`.

### 4. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |
| Keycloak Admin | http://localhost:8081 |
| Kafka UI | http://localhost:8090 |
| Kibana | http://localhost:5601 |
| Grafana | http://localhost:3000 *(default: admin/admin)* |
| Prometheus | http://localhost:9090 |
| Swagger UI | http://localhost:{port}/swagger-ui.html |

### 5. Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Customer | `customer` | `customer` |
| Admin | `admin` | `admin` |

## Database Setup

`init.sql` creates one database per service on startup:

| Database | Service |
|----------|---------|
| `order_db` | order-service |
| `inventory_db` | inventory-service |
| `payment_db` | payment-service |
| `finance_db` | finance-service |
| `product_db` | product-service |
| `keycloak_db` | Keycloak |

Each service runs its own `schema.sql` via a `ConnectionFactoryInitializer` on startup.

## Testing

```bash
# Run all tests
./mvnw clean verify

# Run tests for a specific service
./mvnw -pl payment-service/payment-service test

# Run a specific test class
./mvnw -pl order-service/order-service test -Dtest=OrderApplicationTests

# Frontend tests
cd frontend && npm test
```

Kafka consumers and beans are annotated with `@Profile("!test")` so tests run without a broker.

## Monitoring & Observability

- **Metrics**: All services expose Prometheus metrics via Spring Boot Actuator (`/actuator/prometheus`)
- **Dashboards**: Grafana is pre-configured with a NexusCommerce overview dashboard
- **Logging**: JSON-structured logs via Logstash Logback Encoder → Logstash → Elasticsearch → Kibana
- **Notifications**: Real-time order status updates via WebSocket

## CI/CD

### Jenkins (included)

The `Jenkinsfile` provides a basic pipeline:
1. **Checkout** source code
2. **Build & Test Backend** via Maven
3. **Build Frontend** via npm

### GitHub Actions (recommended)

For GitHub-hosted CI, create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18-alpine
        env:
          POSTGRES_USER: admin
          POSTGRES_PASSWORD: admin
        ports: [5432:5432]
        options: >-
          --health-cmd "pg_isready -U admin"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'
      - run: ./mvnw clean verify
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
        working-directory: ./frontend
      - run: npm run build
        working-directory: ./frontend
```

## Project Structure

```
NexusCommerce/
├── api-gateway/gateway/          # Spring Cloud Gateway
├── auth-service/auth/            # Keycloak integration
├── cart-service/cart-service/     # Redis-backed cart
├── discovery-service/discovery/  # Eureka server
├── finance-service/finance-service/
├── frontend/                     # React + Vite + TypeScript
├── inventory-service/inventory-service/
├── messaging-service/
│   ├── messaging-contracts/      # Shared Kafka event DTOs
│   └── messaging-service/        # Event broker
├── monitoring/
│   ├── grafana/                  # Provisioned dashboards
│   ├── logstash/                 # Pipeline config
│   └── prometheus/               # Scrape config
├── notification-service/notification-service/
├── order-service/order-service/
├── payment-service/payment-service/
├── product-service/product-service/
├── recommendation-service/
├── docker-compose.yml
├── pom.xml                       # Maven parent POM
├── Jenkinsfile
└── init.sql                      # Database initialization
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with descriptive messages
4. Open a Pull Request
5. Ensure all CI checks pass

## License

This project is released under the **MIT License**.
