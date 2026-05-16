package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "hotel_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotelConfigModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_rooms", nullable = false)
    private Integer totalRooms;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
