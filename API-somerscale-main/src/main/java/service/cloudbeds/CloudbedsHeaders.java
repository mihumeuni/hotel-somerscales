package service.cloudbeds;

/**
 * Exact Cloudbeds Spanish column headers as they appear in the .xlsx export.
 * Preserved verbatim — note the trailing space on {@link #ESTADO_RESERVA},
 * which is how Cloudbeds disambiguates it from the address state column.
 */
public final class CloudbedsHeaders {

    private CloudbedsHeaders() {}

    public static final String NOMBRE                            = "Nombre";
    public static final String CORREO                            = "Correo electrónico";
    public static final String TELEFONO                          = "Teléfono";
    public static final String MOVIL                             = "Móvil";
    public static final String GENERO                            = "Género";
    public static final String FECHA_NACIMIENTO                  = "Fecha de nacimiento";
    public static final String NUMERO_RESERVA                    = "Número de la reserva";
    public static final String NUMERO_CONF_TERCEROS              = "Numero de confirmación de terceros";
    public static final String TIPO_DOCUMENTO                    = "Tipo de documento";
    public static final String NUMERO_IDENTIFICACION             = "Número de identificación";
    public static final String FECHA_EMISION_DOCUMENTO           = "Fecha de emisión del documento";
    public static final String PAIS_EMISOR_DOCUMENTO             = "País emisor del documento";
    public static final String FECHA_CADUCIDAD_DOCUMENTO         = "Fecha de caducidad del documento";
    public static final String DIRECCION                         = "Dirección";
    public static final String APARTAMENTO                       = "Apartamento, suite, piso, etc.";
    public static final String CIUDAD                            = "Ciudad";
    public static final String ESTADO_ADDRESS                    = "Estado";
    public static final String CODIGO_POSTAL                     = "Código postal";
    public static final String ADULTOS                           = "Adultos";
    public static final String NINOS                             = "Niños";
    public static final String NUMERO_HABITACION                 = "Número de habitación";
    public static final String TOTAL_HABITACION                  = "Total de la habitación";
    public static final String MONTO_PAGADO                      = "Monto pagado";
    public static final String FECHA_LLEGADA                     = "Fecha de llegada";
    public static final String SALIDA                            = "Salida";
    public static final String NOCHES                            = "Noches";
    public static final String CATEGORIA_HABITACION              = "Categoría de habitación";
    public static final String TOTAL_GENERAL                     = "Total general";
    public static final String DEPOSITO                          = "Depósito";
    public static final String PRODUCTOS                         = "Productos";
    public static final String SALDO_PENDIENTE                   = "Saldo pendiente";
    public static final String TIPO_TARJETA_CREDITO              = "Tipo de tarjeta de crédito";
    public static final String FECHA_RESERVA                     = "Fecha de la reserva";
    public static final String FUENTE                            = "Fuente";
    public static final String PLAN_COMIDAS                      = "Plan de comidas";
    /** Booking status — Cloudbeds emits this header WITH a trailing space. */
    public static final String ESTADO_RESERVA                    = "Estado ";
    public static final String PAIS                              = "País";
    public static final String ESTADO_HUESPED                    = "Estado del huésped";
    public static final String FECHA_CANCELACION                 = "Fecha de cancelación";
    public static final String HORA_ESTIMADA                     = "Hora estimada";
    public static final String PROCEDENCIA                       = "Procedencia";
    public static final String TARIFA_CANCELACION                = "Tarifa de cancelación";
    public static final String CANCELADO_POR                     = "Cancelado por";
    public static final String NOMBRE_EMPRESA                    = "Nombre de la empresa";
    public static final String NIF_EMPRESA                       = "Número de identificación fiscal de la empresa";
    public static final String NIF_HUESPED                       = "Número de identificación fiscal del huésped";

    public static final String[] REQUIRED = {
        NOMBRE, NUMERO_RESERVA, FECHA_LLEGADA, SALIDA
    };
}
