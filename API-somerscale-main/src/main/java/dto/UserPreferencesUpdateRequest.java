package dto;

import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserPreferencesUpdateRequest {

    @Pattern(regexp = "light|dark|system", message = "Tema inválido")
    private String theme;

    @Pattern(regexp = "es|en", message = "Idioma inválido")
    private String language;
}
