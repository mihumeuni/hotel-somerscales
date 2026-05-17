package repository;

import model.RolePermissionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RolePermissionRepository
        extends JpaRepository<RolePermissionModel, RolePermissionModel.RolePermissionId> {

    @Query("SELECT p.code FROM PermissionModel p, RolePermissionModel rp " +
           "WHERE rp.permissionId = p.id AND rp.roleId = :roleId")
    List<String> findCodesByRoleId(@Param("roleId") Long roleId);

    List<RolePermissionModel> findByRoleId(Long roleId);

    @Modifying
    @Query("DELETE FROM RolePermissionModel rp WHERE rp.roleId = :roleId")
    void deleteByRoleId(@Param("roleId") Long roleId);
}
