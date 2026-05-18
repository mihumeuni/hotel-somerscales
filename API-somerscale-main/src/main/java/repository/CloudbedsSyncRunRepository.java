package repository;

import model.CloudbedsSyncRunModel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CloudbedsSyncRunRepository extends JpaRepository<CloudbedsSyncRunModel, Long> {

    List<CloudbedsSyncRunModel> findAllByOrderByStartedAtDesc(Pageable pageable);

    Optional<CloudbedsSyncRunModel> findFirstByStatusOrderByStartedAtDesc(CloudbedsSyncRunModel.SyncStatus status);
}
