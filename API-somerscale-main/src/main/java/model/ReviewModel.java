package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

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

    // task031: replaces the legacy single-enum sentiment column. Each row in
    // review_sentiment_labels is one applicable label_code, so a review can
    // count as positive AND complaint at the same time.
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "review_sentiment_labels",
            joinColumns = @JoinColumn(name = "review_id")
    )
    @Column(name = "label_code", length = 16, nullable = false)
    @Builder.Default
    private Set<String> labels = new LinkedHashSet<>();

    @Column(length = 500)
    private String summary;

    // JSON array of phrases stored as text; Gemini writes here in task 013.
    @Column(name = "key_phrases", columnDefinition = "TEXT")
    private String keyPhrases;

    // task031: raw Gemini JSON response, doubles as the "classified yet?"
    // marker. NULL → still in the classifier backlog.
    @Column(name = "classification_raw", columnDefinition = "TEXT")
    private String classificationRaw;

    @PrePersist
    void onInsert() {
        if (this.fetchedAt == null) this.fetchedAt = LocalDateTime.now();
    }
}
