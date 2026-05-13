package service.cloudbeds;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class CloudbedsRow {
    // Identity
    private String nombre;
    private String email;
    private String telefono;
    private String movil;
    private String tipoDocumento;
    private String numeroDocumento;

    // Booking identity
    private String numeroReservaCloudbeds;
    private String numeroConfirmacionTerceros;

    // Stay
    private LocalDate fechaLlegada;
    private LocalDate salida;
    private Integer noches;
    private Integer adultos;
    private Integer ninos;
    private String numeroHabitacion;
    private String categoriaHabitacion;
    private String planComidas;
    private String horaEstimadaLlegada;

    // Source / status
    private String fuenteRaw;
    private String fuenteNormalizada;
    private String estadoReserva;
    private String estadoHuesped;
    private String pais;
    private String procedencia;
    private LocalDate fechaReserva;
    private LocalDate fechaCancelacion;

    // Money
    private BigDecimal montoTotal;
    private BigDecimal montoPagado;
    private BigDecimal saldoPendiente;
    private BigDecimal deposito;
    private BigDecimal productosMonto;
    private BigDecimal tarifaCancelacion;
    private String tipoTarjetaCredito;

    // Row context for error messages
    private int rowNumber;
}
