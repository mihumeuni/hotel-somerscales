package repository;

import model.UserPreferencesModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPreferencesRepository extends JpaRepository<UserPreferencesModel, Long> {
    Optional<UserPreferencesModel> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
