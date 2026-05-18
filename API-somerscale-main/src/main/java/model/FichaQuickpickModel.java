package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ficha_quickpicks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichaQuickpickModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "row_label", nullable = false, length = 64)
    private String rowLabel;

    @Column(nullable = false, length = 64)
    private String value;

    @Column(nullable = false)
    private Short ordinal;
}
