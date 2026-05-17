package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ficha_reportes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichaReporteModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaModel ficha;

    @Column(name = "row_label", nullable = false, length = 64)
    private String rowLabel;

    @Column(columnDefinition = "TEXT")
    private String value;

    @Column(nullable = false)
    private Short ordinal;
}
