package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reservas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fechaEntrada;
    private LocalDateTime fechaSalida;

    @Column(length = 120)
    private String origenReserva; // normalized: CLOUDBEDS, BOOKING, TRIPADVISOR, MANUAL, WEB

    // --- Cloudbeds-aligned metadata (V6) -----------------------------------

    @Column(name = "numero_reserva_cloudbeds", length = 40, unique = true)
    private String numeroReservaCloudbeds;

    @Column(name = "numero_confirmacion_terceros", length = 60)
    private String numeroConfirmacionTerceros;

    @Column(name = "numero_habitacion", length = 20)
    private String numeroHabitacion;

    @Column(name = "categoria_habitacion", length = 120)
    private String categoriaHabitacion;

    private Integer adultos;
    private Integer ninos;
    private Integer noches;

    @Column(name = "estado_reserva", length = 40)
    private String estadoReserva;

    @Column(name = "estado_huesped", length = 40)
    private String estadoHuesped;

    @Column(length = 80)
    private String pais;

    @Column(name = "fecha_reserva")
    private LocalDate fechaReserva;

    @Column(name = "fecha_cancelacion")
    private LocalDate fechaCancelacion;

    @Column(name = "hora_estimada_llegada", length = 10)
    private String horaEstimadaLlegada;

    @Column(name = "plan_comidas", length = 80)
    private String planComidas;

    @Column(length = 120)
    private String procedencia;

    @Column(name = "monto_total", precision = 12, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "monto_pagado", precision = 12, scale = 2)
    private BigDecimal montoPagado;

    @Column(name = "saldo_pendiente", precision = 12, scale = 2)
    private BigDecimal saldoPendiente;

    @Column(precision = 12, scale = 2)
    private BigDecimal deposito;

    @Column(name = "productos_monto", precision = 12, scale = 2)
    private BigDecimal productosMonto;

    @Column(name = "tarifa_cancelacion", precision = 12, scale = 2)
    private BigDecimal tarifaCancelacion;

    @Column(name = "tipo_tarjeta_credito", length = 40)
    private String tipoTarjetaCredito;

    @ManyToMany
    @JoinTable(
        name = "reserva_huespedes",
        joinColumns = @JoinColumn(name = "reserva_id"),
        inverseJoinColumns = @JoinColumn(name = "huesped_id")
    )
    private List<HuespedModel> huespedes;
}
