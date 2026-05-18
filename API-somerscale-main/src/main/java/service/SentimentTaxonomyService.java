package service;

import dto.SentimentLabelDTO;
import dto.SentimentLabelUpdateRequest;
import lombok.RequiredArgsConstructor;
import model.SentimentLabelModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.SentimentLabelRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SentimentTaxonomyService {

    private final SentimentLabelRepository sentimentLabelRepository;

    @Transactional(readOnly = true)
    public List<SentimentLabelDTO> list() {
        return sentimentLabelRepository.findAllByOrderByOrdinalAsc().stream()
                .map(SentimentLabelDTO::from)
                .toList();
    }

    @Transactional
    public SentimentLabelDTO update(Long id, SentimentLabelUpdateRequest req) {
        SentimentLabelModel m = sentimentLabelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Etiqueta de sentimiento no encontrada"));
        m.setLabelEs(req.getLabelEs());
        m.setEmoji(req.getEmoji());
        return SentimentLabelDTO.from(sentimentLabelRepository.save(m));
    }
}
