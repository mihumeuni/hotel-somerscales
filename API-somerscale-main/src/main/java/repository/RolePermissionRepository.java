package repository;

import model.RolModel;
import model.RolePermissionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RolePermissionRepository
        extends JpaRepository<RolePermissionModel, RolePermissionModel.RolePermissionId> {

    @Query("SELECT p.code FROM PermissionModel p, RolePermissionModel rp " +
           "WHERE rp.permissionId = p.id AND rp.role = :role")
    List<String> findCodesByRole(@Param("role") RolModel role);
}
