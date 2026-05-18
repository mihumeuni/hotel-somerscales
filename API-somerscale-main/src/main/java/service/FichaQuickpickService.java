package service;

import dto.FichaQuickpickDTO;
import dto.FichaQuickpickUpsertRequest;
import lombok.RequiredArgsConstructor;
import model.FichaQuickpickModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.FichaQuickpickRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FichaQuickpickService {

    private final FichaQuickpickRepository repo;

    @Transactional(readOnly = true)
    public Map<String, List<String>> asMap() {
        Map<String, List<String>> out = new LinkedHashMap<>();
        for (FichaQuickpickModel m : repo.findAllByOrderByRowLabelAscOrdinalAsc()) {
            out.computeIfAbsent(m.getRowLabel(), k -> new java.util.ArrayList<>())
                    .add(m.getValue());
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<FichaQuickpickDTO> list() {
        return repo.findAllByOrderByRowLabelAscOrdinalAsc().stream()
                .map(FichaQuickpickDTO::from)
                .toList();
    }

    public List<String> labels() {
        return FichaService.QUICKPICKABLE_LABELS;
    }

    @Transactional
    public FichaQuickpickDTO create(FichaQuickpickUpsertRequest req) {
        Short ordinal = nextOrdinal(req.getRowLabel());
        FichaQuickpickModel m = FichaQuickpickModel.builder()
                .rowLabel(req.getRowLabel().trim())
                .value(req.getValue().trim())
                .ordinal(ordinal)
                .build();
        return FichaQuickpickDTO.from(repo.save(m));
    }

    @Transactional
    public FichaQuickpickDTO update(Long id, FichaQuickpickUpsertRequest req) {
        FichaQuickpickModel m = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Quick-pick no encontrado"));
        m.setValue(req.getValue().trim());
        return FichaQuickpickDTO.from(repo.save(m));
    }

    @Transactional
    public void delete(Long id) {
        FichaQuickpickModel m = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Quick-pick no encontrado"));
        String rowLabel = m.getRowLabel();
        repo.delete(m);
        compactOrdinals(rowLabel);
    }

    private Short nextOrdinal(String rowLabel) {
        List<FichaQuickpickModel> existing = repo.findByRowLabelOrderByOrdinalAsc(rowLabel);
        if (existing.isEmpty()) return 0;
        return (short) (existing.get(existing.size() - 1).getOrdinal() + 1);
    }

    private void compactOrdinals(String rowLabel) {
        List<FichaQuickpickModel> remaining = repo.findByRowLabelOrderByOrdinalAsc(rowLabel);
        short next = 0;
        for (FichaQuickpickModel m : remaining) {
            if (!m.getOrdinal().equals(next)) {
                m.setOrdinal(next);
                repo.save(m);
            }
            next++;
        }
    }
}
