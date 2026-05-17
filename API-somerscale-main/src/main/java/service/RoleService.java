package service;

import dto.PermissionDTO;
import dto.RoleDTO;
import dto.RoleUpsertRequest;
import lombok.RequiredArgsConstructor;
import model.PermissionModel;
import model.RoleEntity;
import model.RolePermissionModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.PermissionRepository;
import repository.RolePermissionRepository;
import repository.RoleRepository;
import repository.UsuarioRepository;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    // System-admin role name; backed by V10 seed and is_system_admin=true.
    public static final String SYSTEM_ADMIN_NAME = "ADMIN";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<RoleDTO> listRoles() {
        Map<Long, Long> counts = new HashMap<>();
        usuarioRepository.countMembersGroupedByRole()
                .forEach(row -> counts.put(row.getRoleId(), row.getTotal()));

        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(RoleEntity::getId))
                .map(r -> toDTO(r, counts.getOrDefault(r.getId(), 0L)))
                .toList();
    }

    @Transactional
    public RoleDTO createRole(RoleUpsertRequest req) {
        String name = req.getName().trim();
        if (roleRepository.existsByName(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un rol con ese nombre");
        }
        RoleEntity created = roleRepository.save(RoleEntity.builder()
                .name(name)
                .description(req.getDescription())
                .systemAdmin(false)
                .build());
        return toDTO(created, 0L);
    }

    @Transactional
    public RoleDTO updateRole(Long id, RoleUpsertRequest req) {
        RoleEntity role = loadOrThrow(id);
        String newName = req.getName().trim();
        if (role.isSystemAdmin() && !role.getName().equals(newName)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "El rol de sistema no puede renombrarse");
        }
        if (!role.getName().equals(newName) && roleRepository.existsByName(newName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un rol con ese nombre");
        }
        role.setName(newName);
        role.setDescription(req.getDescription());
        roleRepository.save(role);
        long members = usuarioRepository.countByRoleId(id);
        return toDTO(role, members);
    }

    @Transactional
    public RoleDTO replacePermissions(Long id, List<String> permissionCodes) {
        RoleEntity role = loadOrThrow(id);
        if (role.isSystemAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Los permisos del rol de sistema no pueden modificarse");
        }
        Set<String> requested = permissionCodes == null
                ? Set.of()
                : Set.copyOf(permissionCodes);

        List<PermissionModel> all = permissionRepository.findAll();
        Set<String> known = all.stream().map(PermissionModel::getCode).collect(Collectors.toSet());
        for (String code : requested) {
            if (!known.contains(code)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Permiso desconocido: " + code);
            }
        }

        rolePermissionRepository.deleteByRoleId(id);
        List<RolePermissionModel> rows = all.stream()
                .filter(p -> requested.contains(p.getCode()))
                .map(p -> RolePermissionModel.builder()
                        .roleId(id)
                        .permissionId(p.getId())
                        .build())
                .toList();
        rolePermissionRepository.saveAll(rows);

        long members = usuarioRepository.countByRoleId(id);
        return toDTO(role, members);
    }

    @Transactional
    public void deleteRole(Long id) {
        RoleEntity role = loadOrThrow(id);
        if (role.isSystemAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "El rol de sistema no puede eliminarse");
        }
        long members = usuarioRepository.countByRoleId(id);
        if (members > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar un rol con " + members + " usuario(s) asignado(s)");
        }
        rolePermissionRepository.deleteByRoleId(id);
        roleRepository.delete(role);
    }

    @Transactional(readOnly = true)
    public List<PermissionDTO> listPermissions() {
        return permissionRepository.findAll().stream()
                .sorted(Comparator.comparing(PermissionModel::getCode))
                .map(p -> PermissionDTO.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .description(p.getDescription())
                        .group(groupOf(p.getCode()))
                        .build())
                .toList();
    }

    private RoleEntity loadOrThrow(Long id) {
        return roleRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Rol no encontrado"));
    }

    private RoleDTO toDTO(RoleEntity r, long members) {
        // System-admin role permissions are derived: always the full catalog.
        // Other roles return what's actually stored in role_permissions.
        List<String> perms = r.isSystemAdmin()
                ? permissionRepository.findAll().stream()
                        .map(PermissionModel::getCode)
                        .sorted()
                        .toList()
                : rolePermissionRepository.findCodesByRoleId(r.getId()).stream()
                        .sorted()
                        .toList();
        return RoleDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .description(r.getDescription())
                .systemAdmin(r.isSystemAdmin())
                .memberCount(members)
                .permissions(perms)
                .build();
    }

    private String groupOf(String code) {
        int dot = code.indexOf('.');
        return dot < 0 ? code : code.substring(0, dot);
    }
}
