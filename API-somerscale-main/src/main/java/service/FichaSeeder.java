package service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import model.FichaModel;
import model.FichaParkingModel;
import model.FichaReporteModel;
import model.UsuarioModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import repository.FichaRepository;
import repository.UsuarioRepository;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * One-shot seeder for the 3 sample shift sheets stored in
 * {@code tests/fichas-sample.json}. Runs once on startup if the fichas table is
 * empty so the operator demo has data without manual claiming. Skips silently
 * if any fichas already exist (preserves work across restarts).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FichaSeeder {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final FichaRepository fichaRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${integrations.cloudbeds.fixture-dir:../tests}")
    private String fixtureDir;

    @Value("${app.fichas.seed-file:fichas-sample.json}")
    private String fixtureFile;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedIfEmpty() {
        if (fichaRepository.count() > 0) {
            log.info("[FichaSeeder] skip — {} fichas already present", fichaRepository.count());
            return;
        }
        Path fixture = resolveFixture();
        if (fixture == null) {
            log.warn("[FichaSeeder] fixture missing: tried {} and ./tests/{}",
                     Path.of(fixtureDir).resolve(fixtureFile).toAbsolutePath(), fixtureFile);
            return;
        }
        try {
            List<FichaFixture> samples = MAPPER.readValue(
                fixture.toFile(),
                MAPPER.getTypeFactory().constructCollectionType(List.class, FichaFixture.class)
            );
            int inserted = 0;
            for (FichaFixture sample : samples) {
                UsuarioModel owner = resolveOwner(sample.ownerUsername);
                if (owner == null) {
                    log.warn("[FichaSeeder] skip ficha {}/{} — owner user '{}' not found",
                             sample.fecha, sample.shift, sample.ownerUsername);
                    continue;
                }
                FichaModel ficha = FichaModel.builder()
                    .fecha(LocalDate.parse(sample.fecha))
                    .shift(sample.shift)
                    .owner(owner)
                    .claimedAt(Instant.now())
                    .lockedAt(Boolean.TRUE.equals(sample.locked) ? Instant.now() : null)
                    .notes(sample.notes)
                    .reportes(new ArrayList<>())
                    .parkingEntries(new ArrayList<>())
                    .build();

                short ordinal = 0;
                for (FichaReporteFixture r : sample.reportes) {
                    int idx = FichaService.REPORTE_LABELS.indexOf(r.rowLabel);
                    String category = idx >= 0 ? FichaService.CATEGORIES.get(idx) : null;
                    ficha.getReportes().add(FichaReporteModel.builder()
                        .ficha(ficha)
                        .rowLabel(r.rowLabel)
                        .category(category)
                        .value(r.value)
                        .ordinal(ordinal++)
                        .build());
                }
                short pos = 0;
                if (sample.parking != null) {
                    for (FichaParkingFixture p : sample.parking) {
                        ficha.getParkingEntries().add(FichaParkingModel.builder()
                            .ficha(ficha)
                            .room(p.room)
                            .lot(p.lot)
                            .position(pos++)
                            .build());
                    }
                }
                fichaRepository.save(ficha);
                inserted++;
            }
            log.info("[FichaSeeder] inserted {} fichas from {}", inserted, fixture);
        } catch (Exception e) {
            log.error("[FichaSeeder] failed to load fixture path={}: {}",
                      fixture, e.getMessage(), e);
        }
    }

    private Path resolveFixture() {
        Path primary = Path.of(fixtureDir).resolve(fixtureFile);
        if (Files.exists(primary)) return primary;
        Path docker = Path.of("./tests").resolve(fixtureFile);
        if (Files.exists(docker)) return docker;
        return null;
    }

    private UsuarioModel resolveOwner(String username) {
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).orElseGet(() ->
            // Graceful fallback: pick the first admin-like user so the demo
            // never crashes if the seed username doesn't exist in this env.
            usuarioRepository.findAll().stream().findFirst().orElse(null)
        );
    }

    // --- JSON fixture shapes ---------------------------------------------------

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class FichaFixture {
        public String fecha;
        public String shift;
        public String ownerUsername;
        public Boolean locked;
        public String notes;
        public List<FichaReporteFixture> reportes;
        public List<FichaParkingFixture> parking;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class FichaReporteFixture {
        public String rowLabel;
        public String value;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class FichaParkingFixture {
        public String room;
        public String lot;
    }
}
