package controller;

import dto.PermissionDTO;
import dto.RoleDTO;
import dto.RolePermissionsRequest;
import dto.RoleUpsertRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import service.RoleService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('role.manage')")
    public List<RoleDTO> listRoles() {
        return roleService.listRoles();
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('role.manage')")
    public ResponseEntity<RoleDTO> createRole(@Valid @RequestBody RoleUpsertRequest req) {
        return ResponseEntity.status(201).body(roleService.createRole(req));
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('role.manage')")
    public RoleDTO updateRole(@PathVariable Long id, @Valid @RequestBody RoleUpsertRequest req) {
        return roleService.updateRole(id, req);
    }

    @PutMapping("/roles/{id}/permissions")
    @PreAuthorize("hasAuthority('role.manage')")
    public RoleDTO replacePermissions(@PathVariable Long id,
                                      @RequestBody RolePermissionsRequest req) {
        return roleService.replacePermissions(id, req.getPermissionKeys());
    }

    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('role.manage')")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('role.manage')")
    public List<PermissionDTO> listPermissions() {
        return roleService.listPermissions();
    }
}
