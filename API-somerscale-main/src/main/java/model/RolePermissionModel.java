package model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    private RolModel role;

    @Id
    @Column(name = "permission_id", nullable = false)
    private Long permissionId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissionId implements Serializable {

        private RolModel role;
        private Long permissionId;

        @Override
        public boolean equals(Object other) {
            if (this == other) return true;
            if (!(other instanceof RolePermissionId that)) return false;
            return role == that.role && Objects.equals(permissionId, that.permissionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(role, permissionId);
        }
    }
}
