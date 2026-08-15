package org.nexuxs.gateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI nexusCommerceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("NexusCommerce API")
                        .description("NexusCommerce Microservices Platform — Aggregated API Documentation.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("NexusCommerce Team")
                                .email("dev@nexuxs.org"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
