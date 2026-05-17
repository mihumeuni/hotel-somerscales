package model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "role_permissions")
@IdClass(RolePermissionModel.RolePermissionId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolePermissionModel {

    @Id
    @Column(name = "role_id", nullable = false)
    private Long roleId;

    @Id
    @Column(name = "permission_id", nullable = false)
    private Long permissionId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissionId implements Serializable {

        private Long roleId;
        private Long permissionId;

        @Override
        public boolean equals(Object other) {
            if (this == other) return true;
            if (!(other instanceof RolePermissionId that)) return false;
            return Objects.equals(roleId, that.roleId)
                    && Objects.equals(permissionId, that.permissionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roleId, permissionId);
        }
    }
}
