package repository;

import model.PermissionModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<PermissionModel, Long> {
}
