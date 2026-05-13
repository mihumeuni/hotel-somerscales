package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(
        name = "reviews_source_external_id_key",
        columnNames = {"source", "external_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewSource source;

    @Column(name = "external_id", nullable = false, length = 120)
    private String externalId;

    @Column(length = 200)
    private String author;

    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(length = 8)
    private String language;

    @Column(name = "raw_text", nullable = false, columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Sentiment sentiment;

    @Column(length = 500)
    private String summary;

    // JSON array of phrases stored as text; Gemini writes here in task 013.
    @Column(name = "key_phrases", columnDefinition = "TEXT")
    private String keyPhrases;

    @PrePersist
    void onInsert() {
        if (this.fetchedAt == null) this.fetchedAt = LocalDateTime.now();
    }
}
