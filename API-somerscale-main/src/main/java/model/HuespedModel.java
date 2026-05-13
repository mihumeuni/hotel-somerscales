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

    @NotNull
    @Column(nullable = false, length = 20)
    private String tipoDocumento; // DNI, RUT, PASAPORTE

    // AES-GCM ciphertext (base64 IV||CT||tag); uniqueness moves to the hmac sidecar
    // because the encrypted value rotates per write.
    @Convert(converter = EncryptedStringConverter.class)
    @Column(nullable = false, length = 255)
    private String numeroDocumento;

    @Column(name = "numero_documento_hmac", unique = true, nullable = false, length = 64)
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
        this.numeroDocumentoHmac = HmacUtil.hmacSha256Hex(this.numeroDocumento);
    }
}
