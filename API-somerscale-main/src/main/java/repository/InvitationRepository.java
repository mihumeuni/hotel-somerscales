package repository;

import model.InvitationModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvitationRepository extends JpaRepository<InvitationModel, Long> {
    Optional<InvitationModel> findByTokenHash(String tokenHash);
    Optional<InvitationModel> findByEmail(String email);
}
