package service;

import model.HuespedModel;
import repository.HuespedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HuespedService {

    private final HuespedRepository huespedRepository;

    public List<HuespedModel> getAllHuespedes() {
        return huespedRepository.findAll();
    }

    public HuespedModel createHuesped(HuespedModel huesped) {

        huespedRepository.findByNumeroDocumento(huesped.getNumeroDocumento())
                .ifPresent(g -> {
                    throw new RuntimeException("El huésped ya existe");
                });

        return huespedRepository.save(huesped);
    }

    public HuespedModel updateHuesped(Long id, HuespedModel updatedHuesped) {

        HuespedModel huesped = huespedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Huésped no encontrado"));

        huesped.setNombreCompleto(updatedHuesped.getNombreCompleto());
        huesped.setEmail(updatedHuesped.getEmail());
        huesped.setTelefono(updatedHuesped.getTelefono());
        huesped.setDatoExtra(updatedHuesped.getDatoExtra());

        return huespedRepository.save(huesped);
    }
}
