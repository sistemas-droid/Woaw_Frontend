import AppIntents

enum TipoVenta: String, AppEnum, CaseDisplayRepresentable, Codable {
    case cualquiera, nuevo, seminuevo, usado

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Tipo de venta"

    static var caseDisplayRepresentations: [TipoVenta: DisplayRepresentation] = [
        .cualquiera: "Cualquiera",
        .nuevo: "Nuevo",
        .seminuevo: "Seminuevo",
        .usado: "Usado"
    ]
}

struct RandomCarConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configurar Random Car"
    static var description = IntentDescription("Elige el tipo de venta para el widget.")

    // Debe ser opcional en AppIntents
    @Parameter(title: "Tipo de venta")
    var tipoVenta: TipoVenta?

    static var parameterSummary: some ParameterSummary {
        Summary("Mostrar un auto \(\.$tipoVenta)")
    }
}
