package dto;

import lombok.Data;

import java.util.List;

@Data
public class RolePermissionsRequest {
    private List<String> permissionKeys;
}
