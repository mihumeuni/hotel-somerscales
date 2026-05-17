package service;

import dto.ActiveShiftDTO;
import dto.FichaDetailDTO;
import dto.FichaParkingDTO;
import dto.FichaReporteDTO;
import dto.FichaSummaryDTO;
import dto.FichaUpdateRequest;
import lombok.RequiredArgsConstructor;
import model.FichaModel;
import model.FichaParkingModel;
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
import java.util.Set;

/**
 * Service for the shift-sheets (fichas) feature. One ficha per
 * (fecha, shift), claimed by exactly one operator. Cannot be edited after
 * handoff (locked_at != null).
 *
 * Shift detection uses Santiago local time: MANANA 06:00–18:00, NOCHE
 * otherwise. The 21-row reporte template (task032) mirrors the printed
 * paper sheet and tags each row with a domain category for FE grouping
 * and downstream analytics.
 *
 * The "Estacionamiento" row is special: instead of a free-text value, it
 * captures structured (room, lot) pairs in the ficha_parking table so we
 * can later chart parking demand by lot/day/month.
 */
@Service
@RequiredArgsConstructor
public class FichaService {

    private static final ZoneId TZ = ZoneId.of("America/Santiago");
    private static final LocalTime MORNING_START = LocalTime.of(6, 0);
    private static final LocalTime MORNING_END = LocalTime.of(18, 0);

    public static final String SHIFT_MANANA = "MANANA";
    public static final String SHIFT_NOCHE = "NOCHE";

    public static final String CAT_RECEPCION = "recepcion";
    public static final String CAT_GASTRONOMIA = "gastronomia";
    public static final String CAT_BEDDING = "bedding";
    public static final String CAT_ADMIN = "admin";
    public static final String CAT_ESTACIONAMIENTO = "estacionamiento";
    public static final String CAT_REQUERIMIENTOS = "requerimientos";
    public static final String CAT_RECLAMOS = "reclamos";

    /**
     * Canonical 21-row template matching the printed Somerscales paper
     * sheet. Order is preserved as the FE ordinal axis. "Recibí turno" is
     * intentionally absent — it is the handoff button at the bottom of
     * the editor, not a data row.
     */
    public static final List<String> REPORTE_LABELS = List.of(
        "Check in",
        "Check out",
        "Late check out",
        "Early check in",
        "Desayunos",
        "Agua",
        "Café",
        "Secando",
        "Lavando",
        "Cama extra",
        "Lavandería",
        "Ventas",
        "Dinero recibido en caja chica",
        "Dinero recibido de ventas en efectivo",
        "Registro de compras recibidas",
        "Registro de correspondencia o encomiendas recibidas",
        "Registro de pertenencias de pasajeros olvidadas",
        "Mails",
        "Estacionamiento",
        "Requerimientos",
        "Reclamos"
    );

    /**
     * Parallel to {@link #REPORTE_LABELS}: category code per row, used by
     * the FE to group rows visually and by future analytics queries to
     * aggregate without label matching.
     */
    public static final List<String> CATEGORIES = List.of(
        CAT_RECEPCION,       // Check in
        CAT_RECEPCION,       // Check out
        CAT_RECEPCION,       // Late check out
        CAT_RECEPCION,       // Early check in
        CAT_GASTRONOMIA,     // Desayunos
        CAT_GASTRONOMIA,     // Agua
        CAT_GASTRONOMIA,     // Café
        CAT_BEDDING,         // Secando
        CAT_BEDDING,         // Lavando
        CAT_BEDDING,         // Cama extra
        CAT_BEDDING,         // Lavandería
        CAT_ADMIN,           // Ventas
        CAT_ADMIN,           // Dinero caja chica
        CAT_ADMIN,           // Dinero ventas efectivo
        CAT_ADMIN,           // Registro compras
        CAT_ADMIN,           // Registro correspondencia
        CAT_ADMIN,           // Registro pertenencias
        CAT_ADMIN,           // Mails
        CAT_ESTACIONAMIENTO, // Estacionamiento (special editor)
        CAT_REQUERIMIENTOS,  // Requerimientos
        CAT_RECLAMOS         // Reclamos
    );

    private static final Set<String> VALID_LOTS = Set.of("E-Hotel", "E-Capilla");
    private static final Set<String> VALID_ROOMS = Set.of(
        "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10"
    );

    /**
     * Quick-pick chip values per row label. The FE shows these inside a
     * 4-col chip grid modal when the operator taps a row; tapping a chip
     * fills the value and saves.
     */
    private static final Map<String, List<String>> QUICKPICKS = new LinkedHashMap<>() {{
        put("Check in", List.of("Sin novedad", "Pendiente documentación", "Pago al ingreso"));
        put("Check out", List.of("Sin novedad", "Llave devuelta", "Cobro extra pendiente"));
        put("Late check out", List.of("Sin solicitudes", "Hasta 14:00", "Hasta 16:00"));
        put("Early check in", List.of("Sin solicitudes", "Pasajero esperó", "Habitación lista temprano"));
        put("Desayunos", List.of("Sin novedad", "Stock OK", "Reponer pan", "Reponer fruta"));
        put("Agua", List.of("Stock OK", "Reponer", "Sin stock"));
        put("Café", List.of("Hay café fresco", "Reponer", "Solo descafeinado"));
        put("Secando", List.of("Nada en curso", "1 ciclo", "Esperando recoger"));
        put("Lavando", List.of("Nada en curso", "1 ciclo", "2 ciclos", "Carga completa"));
        put("Cama extra", List.of("Sin solicitudes", "1 cama armada", "2 camas armadas"));
        put("Lavandería", List.of("Sin pedidos", "Entrega pendiente", "Retiro pendiente"));
        put("Ventas", List.of("Sin ventas", "Tarjeta", "Efectivo", "Transferencia"));
        put("Mails", List.of("Sin novedad", "Respondidos al día", "Pendientes"));
        put("Requerimientos", List.of("Sin requerimientos", "Mantenimiento", "Limpieza", "Recepción"));
        put("Reclamos", List.of("Sin reclamos", "Ruido", "Limpieza", "Servicio"));
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
            .parkingEntries(new ArrayList<>())
            .build();
        // Seed the 21-row template with both label + category.
        for (short i = 0; i < REPORTE_LABELS.size(); i++) {
            FichaReporteModel r = FichaReporteModel.builder()
                .ficha(ficha)
                .rowLabel(REPORTE_LABELS.get(i))
                .category(CATEGORIES.get(i))
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
        ensureEditable(current, ficha);
        if (body.getNotes() != null) {
            ficha.setNotes(body.getNotes().isBlank() ? null : body.getNotes());
        }
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

    @Transactional
    public FichaDetailDTO addParking(UsuarioModel current, Long fichaId, String room, String lot) {
        FichaModel ficha = mustFind(fichaId);
        ensureEditable(current, ficha);
        String normRoom = normalizeRoom(room);
        String normLot = normalizeLot(lot);
        short nextPosition = (short) (ficha.getParkingEntries().stream()
            .mapToInt(p -> p.getPosition() == null ? 0 : p.getPosition().intValue())
            .max()
            .orElse(0) + 1);
        FichaParkingModel entry = FichaParkingModel.builder()
            .ficha(ficha)
            .room(normRoom)
            .lot(normLot)
            .position(nextPosition)
            .build();
        ficha.getParkingEntries().add(entry);
        return toDetail(fichaRepository.save(ficha));
    }

    @Transactional
    public FichaDetailDTO removeParking(UsuarioModel current, Long fichaId, Long parkingId) {
        FichaModel ficha = mustFind(fichaId);
        ensureEditable(current, ficha);
        boolean removed = ficha.getParkingEntries().removeIf(p -> p.getId() != null && p.getId().equals(parkingId));
        if (!removed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Entrada de estacionamiento no encontrada");
        }
        return toDetail(fichaRepository.save(ficha));
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private FichaModel mustFind(Long id) {
        return fichaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Ficha no encontrada"));
    }

    private void ensureEditable(UsuarioModel current, FichaModel ficha) {
        if (ficha.getLockedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La ficha ya fue entregada y no se puede editar");
        }
        if (current == null || !ficha.getOwner().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Solo el dueño del turno puede editar esta ficha");
        }
    }

    private static String normalizeRoom(String room) {
        if (room == null || !VALID_ROOMS.contains(room.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Habitación inválida (use H1–H10)");
        }
        return room.trim();
    }

    private static String normalizeLot(String lot) {
        if (lot == null || !VALID_LOTS.contains(lot.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Estacionamiento inválido (use E-Hotel o E-Capilla)");
        }
        return lot.trim();
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
                .category(r.getCategory())
                .value(r.getValue())
                .ordinal(r.getOrdinal())
                .build())
            .toList();
        List<FichaParkingDTO> parking = f.getParkingEntries().stream()
            .map(p -> FichaParkingDTO.builder()
                .id(p.getId())
                .room(p.getRoom())
                .lot(p.getLot())
                .position(p.getPosition())
                .createdAt(p.getCreatedAt())
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
            .parkingEntries(parking)
            .build();
    }
}
