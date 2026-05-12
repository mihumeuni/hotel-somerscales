package controller;

import dto.InvitationRequest;
import dto.SignupFinishRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import service.InvitationService;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/invite")
    @PreAuthorize("hasAuthority('user.invite')")
    public ResponseEntity<Map<String, String>> invite(@Valid @RequestBody InvitationRequest req) {
        String email = invitationService.inviteUser(req);
        return ResponseEntity.accepted().body(Map.of("email", email));
    }

    @PostMapping("/signup-finish")
    public ResponseEntity<Void> signupFinish(@Valid @RequestBody SignupFinishRequest req) {
        invitationService.consume(req.getToken(), req.getPassword());
        return ResponseEntity.noContent().build();
    }
}
