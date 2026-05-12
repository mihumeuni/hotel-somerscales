package model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "huespedes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HuespedModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false, length = 20)
    private String tipoDocumento; // DNI, RUT, PASAPORTE

    @Column(unique = true, nullable = false, length = 64)
    private String numeroDocumento;

    @NotNull
    @Column(nullable = false, length = 200)
    private String nombreCompleto;

    @Email
    @Column(length = 200)
    private String email;

    @Column(length = 40)
    private String telefono;

    @Column(columnDefinition = "TEXT")
    private String datoExtra;
}
