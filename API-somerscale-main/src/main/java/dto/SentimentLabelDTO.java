package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import model.SentimentLabelModel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentLabelDTO {

    private Long id;
    private String code;
    private String labelEs;
    private String emoji;
    private Short ordinal;

    public static SentimentLabelDTO from(SentimentLabelModel m) {
        return SentimentLabelDTO.builder()
                .id(m.getId())
                .code(m.getCode())
                .labelEs(m.getLabelEs())
                .emoji(m.getEmoji())
                .ordinal(m.getOrdinal())
                .build();
    }
}
