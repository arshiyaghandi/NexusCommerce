package org.nexuxs.gateway.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration for the API Gateway.
 * <p>
 * The gateway serves as the aggregation point for all service Swagger specs.
 * It also exposes its own OpenAPI spec (api-docs for gateway-level endpoints).
 * <p>
 * Keycloak OAuth2 security scheme is configured so authenticated endpoints
 * can be tested directly from Swagger UI using the "Authorize" button.
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:http://localhost:8081/realms/nexus-realm}")
    private String keycloakIssuerUri;

    @Bean
    public OpenAPI nexusCommerceOpenAPI() {
        String keycloakTokenUrl = keycloakIssuerUri + "/protocol/openid-connect/token";
        String keycloakAuthUrl = keycloakIssuerUri + "/protocol/openid-connect/auth";

        return new OpenAPI()
                .info(new Info()
                        .title("NexusCommerce API")
                        .description("""
                                NexusCommerce Microservices Platform — Aggregated API Documentation.
                                
                                This Swagger UI aggregates API specs from all downstream services:
                                - **order-service** — Order lifecycle management
                                - **inventory-service** — Stock reservation and management
                                - **product-service** — Product catalog
                                - **cart-service** — Shopping cart (Redis-backed)
                                - **payment-service** — Payment processing (Saga)
                                - **finance-service** — Financial transaction records
                                - **messaging-service** — Event broker
                                - **auth-service** — Authentication via Keycloak
                                
                                Click **Authorize** and use your Keycloak credentials to test protected endpoints.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("NexusCommerce Team")
                                .email("dev@nexuxs.org"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .components(new Components()
                        .addSecuritySchemes("keycloak-oauth2", new SecurityScheme()
                                .type(SecurityScheme.Type.OAUTH2)
                                .description("Authenticate via Keycloak (nexus-realm). Use client_id: nexus-client")
                                .flows(new OAuthFlows()
                                        .password(new OAuthFlow()
                                                .tokenUrl(keycloakTokenUrl))
                                        .authorizationCode(new OAuthFlow()
                                                .authorizationUrl(keycloakAuthUrl)
                                                .tokenUrl(keycloakTokenUrl))))
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste your Keycloak JWT access token here")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
