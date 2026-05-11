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
    private String tipoDocumento; // DNI, RUT, PASAPORTE

    @Column(unique = true, nullable = false)
    private String numeroDocumento;

    @NotNull
    private String nombreCompleto;

    @Email
    private String email;
    private String telefono;
    private String datoExtra;
}
