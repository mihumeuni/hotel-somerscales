package service;

import dto.ActiveShiftDTO;
import dto.FichaDetailDTO;
import dto.FichaReporteDTO;
import dto.FichaSummaryDTO;
import dto.FichaUpdateRequest;
import lombok.RequiredArgsConstructor;
import model.FichaModel;
import model.FichaReporteModel;
import model.UsuarioModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.FichaRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for the shift-sheets (fichas) feature. One ficha per
 * (fecha, shift), claimed by exactly one operator. Cannot be edited after
 * handoff (locked_at != null).
 *
 * Shift detection uses Santiago local time: MANANA 06:00–18:00, NOCHE
 * otherwise. The 22-row reporte template is seeded at claim time.
 */
@Service
@RequiredArgsConstructor
public class FichaService {

    private static final ZoneId TZ = ZoneId.of("America/Santiago");
    private static final LocalTime MORNING_START = LocalTime.of(6, 0);
    private static final LocalTime MORNING_END = LocalTime.of(18, 0);

    public static final String SHIFT_MANANA = "MANANA";
    public static final String SHIFT_NOCHE = "NOCHE";

    /**
     * Canonical 22-row template seeded into every new ficha. Mirrors the
     * printed sheet vocabulary the operator already uses.
     */
    public static final List<String> REPORTE_LABELS = List.of(
        "Recibí turno de",
        "Caja apertura (CLP)",
        "Caja cierre (CLP)",
        "Check-ins realizados",
        "Check-outs realizados",
        "No-shows",
        "Walk-ins atendidos",
        "Café",
        "Agua mineral (stock)",
        "Estacionamiento",
        "Lavandería · Lavando",
        "Lavandería · Secando",
        "Llamadas atendidas",
        "Quejas recibidas",
        "Pedidos especiales",
        "Mantenimiento · Órdenes nuevas",
        "Mantenimiento · Resueltas",
        "Rondas de seguridad",
        "Incidentes registrados",
        "Objetos olvidados",
        "Llaves perdidas",
        "Entrego turno a"
    );

    /**
     * Quick-pick chip values per row label. The FE shows these as tappable
     * pills under the input; tapping a chip fills the value field.
     */
    private static final Map<String, List<String>> QUICKPICKS = new LinkedHashMap<>() {{
        put("Café", List.of("Hay café fresco", "Falta café", "Solo descafeinado"));
        put("Agua mineral (stock)", List.of("Stock OK", "Falta reponer", "Sin stock"));
        put("Estacionamiento", List.of("Vacío", "Lleno", "Parcial"));
        put("Lavandería · Lavando", List.of("Nada en curso", "1 ciclo", "2 ciclos", "Carga completa"));
        put("Lavandería · Secando", List.of("Nada en curso", "1 ciclo en marcha", "Esperando recoger"));
        put("Recibí turno de", List.of("Sin novedad", "Pendientes documentados", "Ver bitácora"));
        put("Entrego turno a", List.of("Sin novedad", "Pendientes documentados", "Ver bitácora"));
    }};

    private final FichaRepository fichaRepository;

    // ---------------------------------------------------------------------
    // Shift detection
    // ---------------------------------------------------------------------

    public LocalDate today() {
        return LocalDate.now(TZ);
    }

    public String currentShift() {
        LocalTime now = LocalTime.now(TZ);
        boolean morning = !now.isBefore(MORNING_START) && now.isBefore(MORNING_END);
        return morning ? SHIFT_MANANA : SHIFT_NOCHE;
    }

    // ---------------------------------------------------------------------
    // Queries
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<FichaSummaryDTO> list(LocalDate from, LocalDate to) {
        return fichaRepository.findInRange(from, to).stream()
            .map(FichaService::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public FichaDetailDTO get(Long id) {
        FichaModel ficha = mustFind(id);
        return toDetail(ficha);
    }

    @Transactional(readOnly = true)
    public ActiveShiftDTO active(UsuarioModel current) {
        LocalDate fecha = today();
        String shift = currentShift();
        var existing = fichaRepository.findByFechaAndShift(fecha, shift);
        if (existing.isEmpty()) {
            return ActiveShiftDTO.builder()
                .fecha(fecha)
                .shift(shift)
                .status("UNCLAIMED")
                .locked(false)
                .build();
        }
        FichaModel ficha = existing.get();
        boolean mine = current != null && ficha.getOwner().getId().equals(current.getId());
        return ActiveShiftDTO.builder()
            .fecha(fecha)
            .shift(shift)
            .status(mine ? "CLAIMED_BY_ME" : "CLAIMED_BY_OTHER")
            .fichaId(ficha.getId())
            .locked(ficha.getLockedAt() != null)
            .ownerUserId(ficha.getOwner().getId())
            .ownerName(ownerLabel(ficha.getOwner()))
            .build();
    }

    public Map<String, List<String>> quickpicks() {
        return QUICKPICKS;
    }

    // ---------------------------------------------------------------------
    // Commands
    // ---------------------------------------------------------------------

    @Transactional
    public FichaDetailDTO claim(UsuarioModel owner, String overrideShift) {
        LocalDate fecha = today();
        String shift = normalizeShift(overrideShift, currentShift());
        if (fichaRepository.findByFechaAndShift(fecha, shift).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ya hay una ficha abierta para este turno");
        }
        FichaModel ficha = FichaModel.builder()
            .fecha(fecha)
            .shift(shift)
            .owner(owner)
            .claimedAt(Instant.now())
            .reportes(new ArrayList<>())
            .build();
        // Seed 22 empty reportes with the canonical labels.
        for (short i = 0; i < REPORTE_LABELS.size(); i++) {
            FichaReporteModel r = FichaReporteModel.builder()
                .ficha(ficha)
                .rowLabel(REPORTE_LABELS.get(i))
                .ordinal(i)
                .value(null)
                .build();
            ficha.getReportes().add(r);
        }
        FichaModel saved = fichaRepository.save(ficha);
        return toDetail(saved);
    }

    @Transactional
    public FichaDetailDTO update(UsuarioModel current, Long id, FichaUpdateRequest body) {
        FichaModel ficha = mustFind(id);
        if (ficha.getLockedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La ficha ya fue entregada y no se puede editar");
        }
        if (current == null || !ficha.getOwner().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Solo el dueño del turno puede editar esta ficha");
        }
        // Notes is replaced wholesale (including clearing on null/blank).
        if (body.getNotes() != null) {
            ficha.setNotes(body.getNotes().isBlank() ? null : body.getNotes());
        }
        // Reportes are upserted by ordinal. Unknown ordinals are ignored to
        // keep the canonical 22-row shape intact.
        if (body.getReportes() != null) {
            Map<Short, FichaReporteModel> byOrdinal = new LinkedHashMap<>();
            for (FichaReporteModel r : ficha.getReportes()) {
                byOrdinal.put(r.getOrdinal(), r);
            }
            for (FichaUpdateRequest.FichaReporteUpsert upsert : body.getReportes()) {
                if (upsert.getOrdinal() == null) continue;
                FichaReporteModel target = byOrdinal.get(upsert.getOrdinal());
                if (target == null) continue;
                target.setValue(blankToNull(upsert.getValue()));
            }
        }
        return toDetail(fichaRepository.save(ficha));
    }

    @Transactional
    public FichaDetailDTO handoff(UsuarioModel current, Long id) {
        FichaModel ficha = mustFind(id);
        if (current == null || !ficha.getOwner().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Solo el dueño del turno puede entregarlo");
        }
        if (ficha.getLockedAt() == null) {
            ficha.setLockedAt(Instant.now());
            fichaRepository.save(ficha);
        }
        return toDetail(ficha);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private FichaModel mustFind(Long id) {
        return fichaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Ficha no encontrada"));
    }

    private static String normalizeShift(String requested, String fallback) {
        if (requested == null || requested.isBlank()) return fallback;
        String s = requested.toUpperCase();
        if (!SHIFT_MANANA.equals(s) && !SHIFT_NOCHE.equals(s)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Shift inválido: " + requested);
        }
        return s;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private static String ownerLabel(UsuarioModel u) {
        if (u == null) return null;
        return u.getNombre() != null && !u.getNombre().isBlank()
            ? u.getNombre()
            : u.getUsername();
    }

    private static FichaSummaryDTO toSummary(FichaModel f) {
        return FichaSummaryDTO.builder()
            .id(f.getId())
            .fecha(f.getFecha())
            .shift(f.getShift())
            .ownerUserId(f.getOwner().getId())
            .ownerName(ownerLabel(f.getOwner()))
            .locked(f.getLockedAt() != null)
            .claimedAt(f.getClaimedAt())
            .lockedAt(f.getLockedAt())
            .reporteCount(f.getReportes() == null ? 0 : f.getReportes().size())
            .hasNotes(f.getNotes() != null && !f.getNotes().isBlank())
            .build();
    }

    private static FichaDetailDTO toDetail(FichaModel f) {
        List<FichaReporteDTO> reportes = f.getReportes().stream()
            .map(r -> FichaReporteDTO.builder()
                .id(r.getId())
                .label(r.getRowLabel())
                .value(r.getValue())
                .ordinal(r.getOrdinal())
                .build())
            .toList();
        return FichaDetailDTO.builder()
            .id(f.getId())
            .fecha(f.getFecha())
            .shift(f.getShift())
            .ownerUserId(f.getOwner().getId())
            .ownerName(ownerLabel(f.getOwner()))
            .locked(f.getLockedAt() != null)
            .claimedAt(f.getClaimedAt())
            .lockedAt(f.getLockedAt())
            .updatedAt(f.getUpdatedAt())
            .notes(f.getNotes())
            .reportes(reportes)
            .build();
    }
}
