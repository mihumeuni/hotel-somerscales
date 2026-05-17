package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "ficha_parking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichaParkingModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaModel ficha;

    @Column(nullable = false, length = 8)
    private String room;

    @Column(nullable = false, length = 16)
    private String lot;

    @Column(nullable = false)
    private Short position;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
