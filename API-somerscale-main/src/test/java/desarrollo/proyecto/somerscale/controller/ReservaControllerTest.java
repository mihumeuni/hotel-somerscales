package desarrollo.proyecto.somerscale.controller;

import controller.ReservaController;
import model.HuespedModel;
import model.ReservaModel;
import service.ReservaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class ReservaControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReservaService reservaService;

    private ReservaModel reserva1;
    private ReservaModel reserva2;
    private ReservaModel reserva3;
    private ReservaModel reserva4;
    private ReservaModel reserva5;

    @BeforeEach
    void setUp() {
        ReservaController reservaController = new ReservaController(reservaService);
        mockMvc = MockMvcBuilders.standaloneSetup(reservaController).build();

        HuespedModel huesped1 = HuespedModel.builder()
                .id(1L)
                .tipoDocumento("DNI")
                .numeroDocumento("12345678")
                .nombreCompleto("Juan Pérez")
                .email("juan@example.com")
                .telefono("123456789")
                .datoExtra("VIP")
                .build();

        HuespedModel huesped2 = HuespedModel.builder()
                .id(2L)
                .tipoDocumento("RUT")
                .numeroDocumento("98765432")
                .nombreCompleto("María García")
                .email("maria@example.com")
                .telefono("987654321")
                .datoExtra("Frecuente")
                .build();

        reserva1 = ReservaModel.builder()
                .id(1L)
                .fechaEntrada(LocalDateTime.of(2023, 10, 1, 14, 0))
                .fechaSalida(LocalDateTime.of(2023, 10, 5, 12, 0))
                .origenReserva("WEB")
                .huespedes(Arrays.asList(huesped1))
                .build();

        reserva2 = ReservaModel.builder()
                .id(2L)
                .fechaEntrada(LocalDateTime.of(2023, 11, 1, 15, 0))
                .fechaSalida(LocalDateTime.of(2023, 11, 3, 11, 0))
                .origenReserva("EXCEL")
                .huespedes(Arrays.asList(huesped2))
                .build();

        reserva3 = ReservaModel.builder()
                .id(3L)
                .fechaEntrada(LocalDateTime.of(2023, 12, 1, 16, 0))
                .fechaSalida(LocalDateTime.of(2023, 12, 7, 10, 0))
                .origenReserva("MANUAL")
                .huespedes(Arrays.asList(huesped1, huesped2))
                .build();

        reserva4 = ReservaModel.builder()
                .id(4L)
                .fechaEntrada(LocalDateTime.of(2024, 1, 1, 13, 0))
                .fechaSalida(LocalDateTime.of(2024, 1, 4, 9, 0))
                .origenReserva("WEB")
                .huespedes(Arrays.asList(huesped1))
                .build();

        reserva5 = ReservaModel.builder()
                .id(5L)
                .fechaEntrada(LocalDateTime.of(2024, 2, 1, 17, 0))
                .fechaSalida(LocalDateTime.of(2024, 2, 10, 8, 0))
                .origenReserva("EXCEL")
                .huespedes(Arrays.asList(huesped2))
                .build();
    }

    @Test
    void testGetAllReservas() throws Exception {
        List<ReservaModel> reservas = Arrays.asList(reserva1, reserva2, reserva3, reserva4, reserva5);
        Mockito.when(reservaService.getAllReservas()).thenReturn(reservas);

        mockMvc.perform(get("/api/reservas"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(5));
    }

    @Test
    void testCreateReserva() throws Exception {
        ReservaModel newReserva = ReservaModel.builder()
                .fechaEntrada(LocalDateTime.of(2024, 3, 1, 14, 0))
                .fechaSalida(LocalDateTime.of(2024, 3, 5, 12, 0))
                .origenReserva("WEB")
                .huespedes(Arrays.asList(HuespedModel.builder()
                        .tipoDocumento("PASAPORTE")
                        .numeroDocumento("ABC123456")
                        .nombreCompleto("Carlos López")
                        .email("carlos@example.com")
                        .telefono("555123456")
                        .datoExtra("Nuevo")
                        .build()))
                .build();

        ReservaModel savedReserva = new ReservaModel();
        savedReserva.setId(6L);
        savedReserva.setFechaEntrada(newReserva.getFechaEntrada());
        savedReserva.setFechaSalida(newReserva.getFechaSalida());
        savedReserva.setOrigenReserva(newReserva.getOrigenReserva());
        savedReserva.setHuespedes(newReserva.getHuespedes());

        Mockito.when(reservaService.createReserva(any(ReservaModel.class))).thenReturn(savedReserva);

        String reservaJson = """
                {
                    "fechaEntrada": "2024-03-01T14:00:00",
                    "fechaSalida": "2024-03-05T12:00:00",
                    "origenReserva": "WEB",
                    "huespedes": [
                        {
                            "tipoDocumento": "PASAPORTE",
                            "numeroDocumento": "ABC123456",
                            "nombreCompleto": "Carlos López",
                            "email": "carlos@example.com",
                            "telefono": "555123456",
                            "datoExtra": "Nuevo"
                        }
                    ]
                }
                """;

        mockMvc.perform(post("/api/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservaJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(6))
                .andExpect(jsonPath("$.origenReserva").value("WEB"));
    }

    @Test
    void testGetReservaById() throws Exception {
        Mockito.when(reservaService.getReservaById(eq(1L))).thenReturn(reserva1);

        mockMvc.perform(get("/api/reservas/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.origenReserva").value("WEB"));
    }

    @Test
    void testGetReservaByIdNotFound() {
        Mockito.when(reservaService.getReservaById(eq(999L))).thenThrow(new RuntimeException("Reserva not found"));

        Exception exception = assertThrows(Exception.class, () ->
                mockMvc.perform(get("/api/reservas/999"))
        );
        assertThrows(RuntimeException.class, () -> { throw exception.getCause(); });
    }
}