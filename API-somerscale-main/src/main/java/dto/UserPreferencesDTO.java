package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import model.UserPreferencesModel;

@Getter
@Builder
@AllArgsConstructor
public class UserPreferencesDTO {
    private String theme;
    private String language;
    private boolean hasAvatar;

    public static UserPreferencesDTO from(UserPreferencesModel m) {
        return UserPreferencesDTO.builder()
            .theme(m.getTheme())
            .language(m.getLanguage())
            .hasAvatar(m.getAvatarData() != null && m.getAvatarData().length > 0)
            .build();
    }
}
