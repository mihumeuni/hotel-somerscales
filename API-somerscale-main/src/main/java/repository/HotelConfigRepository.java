package repository;

import model.HotelConfigModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HotelConfigRepository extends JpaRepository<HotelConfigModel, Long> {
}
