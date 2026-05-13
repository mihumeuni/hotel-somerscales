package model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import security.EncryptedStringConverter;
import security.HmacUtil;

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

    @Column(length = 20)
    private String tipoDocumento; // DNI, RUT, PASAPORTE — nullable for OTA bookings

    // AES-GCM ciphertext (base64 IV||CT||tag); uniqueness moves to the hmac sidecar
    // because the encrypted value rotates per write. Nullable for OTA bookings whose
    // document is captured later at check-in.
    @Convert(converter = EncryptedStringConverter.class)
    @Column(length = 255)
    private String numeroDocumento;

    @Column(name = "numero_documento_hmac", unique = true, length = 64)
    private String numeroDocumentoHmac;

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

    @PrePersist
    @PreUpdate
    private void syncHmac() {
        // Doc-less OTA guests have no document; leave the HMAC null so the
        // UNIQUE constraint accepts the row (PG allows multiple NULLs).
        this.numeroDocumentoHmac = this.numeroDocumento == null
                ? null
                : HmacUtil.hmacSha256Hex(this.numeroDocumento);
    }
}
