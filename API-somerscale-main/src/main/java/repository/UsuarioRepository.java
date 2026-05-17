package repository;

import model.UsuarioModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<UsuarioModel, Long> {
    Optional<UsuarioModel> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    long countByRoleId(Long roleId);

    @Query("SELECT u.role.id AS roleId, COUNT(u) AS total " +
           "FROM UsuarioModel u GROUP BY u.role.id")
    List<RoleMemberCount> countMembersGroupedByRole();

    interface RoleMemberCount {
        Long getRoleId();
        Long getTotal();
    }
}
