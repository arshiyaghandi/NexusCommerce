package org.nexuxs.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;

@SpringBootTest
class AuthApplicationTests {

	@MockBean
	private ReactiveClientRegistrationRepository clientRegistrationRepository;

	@Test
	void contextLoads() {
	}

}
