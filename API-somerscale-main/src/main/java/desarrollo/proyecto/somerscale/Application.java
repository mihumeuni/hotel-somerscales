package desarrollo.proyecto.somerscale;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

// Production classes live in top-level packages (controller/, service/,
// repository/, model/, config/, security/) instead of under this base
// package, so the default @SpringBootApplication scan misses them all.
// Explicit scan roots register the @Component/@Service/@RestController
// beans, while @EntityScan/@EnableJpaRepositories cover the JPA-specific
// discovery that @ComponentScan does not handle.
@SpringBootApplication(scanBasePackages = {
		"desarrollo.proyecto.somerscale",
		"config",
		"controller",
		"dto",
		"integrations",
		"model",
		"repository",
		"security",
		"service"
})
@EntityScan(basePackages = "model")
@EnableJpaRepositories(basePackages = "repository")
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

}
