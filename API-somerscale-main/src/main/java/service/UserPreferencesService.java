package service;

import dto.UserPreferencesDTO;
import dto.UserPreferencesUpdateRequest;
import lombok.RequiredArgsConstructor;
import model.UserPreferencesModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.UserPreferencesRepository;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserPreferencesService {

    private static final int AVATAR_SIZE = 256;
    private static final long MAX_UPLOAD_BYTES = 2L * 1024 * 1024;
    private static final Set<String> ALLOWED_MIMES = Set.of("image/jpeg", "image/png");

    private final UserPreferencesRepository repo;

    @Transactional
    public UserPreferencesModel getOrCreate(Long userId) {
        return repo.findByUserId(userId).orElseGet(() -> {
            UserPreferencesModel m = UserPreferencesModel.builder()
                .userId(userId)
                .theme("system")
                .language("es")
                .build();
            return repo.save(m);
        });
    }

    @Transactional(readOnly = true)
    public UserPreferencesDTO read(Long userId) {
        return UserPreferencesDTO.from(getOrCreate(userId));
    }

    @Transactional
    public UserPreferencesDTO update(Long userId, UserPreferencesUpdateRequest req) {
        UserPreferencesModel m = getOrCreate(userId);
        if (req.getTheme() != null) m.setTheme(req.getTheme());
        if (req.getLanguage() != null) m.setLanguage(req.getLanguage());
        return UserPreferencesDTO.from(repo.save(m));
    }

    @Transactional
    public UserPreferencesDTO setAvatar(Long userId, byte[] sourceBytes, String mime) {
        if (sourceBytes == null || sourceBytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Archivo vacío");
        }
        if (sourceBytes.length > MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "Imagen mayor a 2 MB");
        }
        if (mime == null || !ALLOWED_MIMES.contains(mime.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Solo se aceptan JPEG o PNG");
        }
        byte[] resized = resizeToJpeg(sourceBytes);

        UserPreferencesModel m = getOrCreate(userId);
        m.setAvatarData(resized);
        m.setAvatarMime("image/jpeg");
        return UserPreferencesDTO.from(repo.save(m));
    }

    @Transactional
    public void clearAvatar(Long userId) {
        UserPreferencesModel m = getOrCreate(userId);
        m.setAvatarData(null);
        m.setAvatarMime(null);
        repo.save(m);
    }

    @Transactional(readOnly = true)
    public byte[] readAvatar(Long userId) {
        return repo.findByUserId(userId)
            .map(UserPreferencesModel::getAvatarData)
            .orElse(null);
    }

    private byte[] resizeToJpeg(byte[] source) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(source));
            if (original == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se pudo leer la imagen");
            }
            int side = Math.min(original.getWidth(), original.getHeight());
            int sx = (original.getWidth() - side) / 2;
            int sy = (original.getHeight() - side) / 2;
            BufferedImage cropped = original.getSubimage(sx, sy, side, side);

            BufferedImage out = new BufferedImage(AVATAR_SIZE, AVATAR_SIZE, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = out.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING,
                RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(cropped, 0, 0, AVATAR_SIZE, AVATAR_SIZE, null);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(out, "jpg", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Imagen inválida", e);
        }
    }
}
