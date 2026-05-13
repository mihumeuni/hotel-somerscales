package service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import model.HuespedModel;
import model.ReservaModel;
import net.datafaker.Faker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import repository.HuespedRepository;
import repository.ReservaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.UUID;

/**
 * Boots a Faker-backed demo dataset (200 guests + 500 bookings) when:
 *   1. {@code app.demo.seed=true} (env: {@code DEMO_SEED}), AND
 *   2. {@code huespedes} count is below the safety threshold (so we never
 *      duplicate a real Cloudbeds import).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoSeeder {

    private static final int SAFETY_THRESHOLD = 50;
    private static final String[] SOURCES =
        { "CLOUDBEDS", "BOOKING", "TRIPADVISOR", "MANUAL", "WEB" };
    private static final String[] TIPOS = { "DNI", "RUT", "PASAPORTE" };
    private static final String[] ESTADOS = { "Confirmado", "Cancelado", "No-show", "Check-in" };

    private final HuespedRepository huespedRepository;
    private final ReservaRepository reservaRepository;

    @Value("${app.demo.seed:false}")
    private boolean enabled;
    @Value("${app.demo.huespedes:200}")
    private int huespedesCount;
    @Value("${app.demo.reservas:500}")
    private int reservasCount;

    @EventListener(ApplicationReadyEvent.class)
    public void seedIfRequested() {
        if (!enabled) return;
        long existing = huespedRepository.count();
        if (existing >= SAFETY_THRESHOLD) {
            log.info("DemoSeeder: skipping — {} huespedes already present (threshold {})",
                     existing, SAFETY_THRESHOLD);
            return;
        }

        Faker faker = new Faker(new Locale("es", "CL"));
        Random rnd = new Random();

        List<HuespedModel> guests = new ArrayList<>(huespedesCount);
        for (int i = 0; i < huespedesCount; i++) {
            boolean otaStyle = rnd.nextInt(10) < 3; // 30% doc-less (Booking.com-style)
            HuespedModel g = HuespedModel.builder()
                    .nombreCompleto(faker.name().fullName())
                    .email(faker.internet().emailAddress())
                    .telefono(faker.phoneNumber().cellPhone())
                    .tipoDocumento(otaStyle ? null : TIPOS[rnd.nextInt(TIPOS.length)])
                    .numeroDocumento(otaStyle ? null : faker.number().digits(9))
                    .build();
            guests.add(g);
        }
        guests = huespedRepository.saveAll(guests);

        List<ReservaModel> reservas = new ArrayList<>(reservasCount);
        LocalDate today = LocalDate.now();
        for (int i = 0; i < reservasCount; i++) {
            HuespedModel g = guests.get(rnd.nextInt(guests.size()));
            int daysAgo = rnd.nextInt(540);
            int nights = 1 + rnd.nextInt(7);
            LocalDate in  = today.minusDays(daysAgo);
            LocalDate out = in.plusDays(nights);
            BigDecimal total = BigDecimal.valueOf(80 + rnd.nextInt(500)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal paid  = total.multiply(BigDecimal.valueOf(rnd.nextDouble())).setScale(2, RoundingMode.HALF_UP);
            String source = SOURCES[i % SOURCES.length];
            ReservaModel r = ReservaModel.builder()
                    .numeroReservaCloudbeds("DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .fechaEntrada(LocalDateTime.of(in, java.time.LocalTime.NOON))
                    .fechaSalida(LocalDateTime.of(out, java.time.LocalTime.of(11, 0)))
                    .noches(nights)
                    .adultos(1 + rnd.nextInt(3))
                    .ninos(rnd.nextInt(3))
                    .numeroHabitacion("H" + (10 + rnd.nextInt(40)))
                    .categoriaHabitacion(rnd.nextBoolean() ? "Doble Vista al Mar" : "Doble Vista a la Montaña")
                    .estadoReserva(ESTADOS[rnd.nextInt(ESTADOS.length)])
                    .pais(faker.country().name())
                    .origenReserva(source)
                    .procedencia(source)
                    .fechaReserva(in.minusDays(7 + rnd.nextInt(60)))
                    .montoTotal(total)
                    .montoPagado(paid)
                    .saldoPendiente(total.subtract(paid))
                    .deposito(BigDecimal.ZERO)
                    .huespedes(List.of(g))
                    .build();
            reservas.add(r);
        }
        reservaRepository.saveAll(reservas);

        log.info("DemoSeeder: inserted {} huespedes + {} reservas (Faker, locale es-CL)",
                 guests.size(), reservas.size());
    }
}
