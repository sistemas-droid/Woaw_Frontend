import AppIntents
import Foundation

enum TipoVenta: String, AppEnum, CaseDisplayRepresentable, Codable {
    case cualquiera, nuevo, seminuevo, usado

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Tipo de venta"
    static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
        .cualquiera: "Cualquiera",
        .nuevo: "Nuevo",
        .seminuevo: "Seminuevo",
        .usado: "Usado"
    ]
}

enum Transmision: String, AppEnum, CaseDisplayRepresentable, Codable {
    case cualquiera, manual, automatica

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Transmisión"
    static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
        .cualquiera: "Cualquiera",
        .manual: "Manual",
        .automatica: "Automática"
    ]
}

struct BuscarVehiculoIntent: AppIntent {
    static var title: LocalizedStringResource = "Buscar vehículos"
    static var description = IntentDescription("Busca vehículos en WOAW y abre la vista de resultados.")

    @Parameter(
        title: "Palabras clave",
        requestValueDialog: "¿Qué estás buscando? (marca/modelo, año, ciudad, etc.)"
    )
    var keywords: String

    @Parameter(title: "Tipo de venta")
    var tipoVenta: TipoVenta?

    @Parameter(title: "Transmisión")
    var transmision: Transmision?

    static var parameterSummary: some ParameterSummary {
        Summary("Buscar \(\.$keywords) \(\.$tipoVenta) \(\.$transmision)")
    }

    func buildQuery() -> String {
        var comps = URLComponents()
        comps.scheme = "https"
        comps.host = "woaw.mx"
        comps.path = "/search/vehiculos"

        var items: [URLQueryItem] = []
        let kw = keywords.trimmingCharacters(in: .whitespacesAndNewlines)
        if !kw.isEmpty { items.append(URLQueryItem(name: "keywords", value: kw)) }
        if let tv = tipoVenta, tv != .cualquiera {
            items.append(URLQueryItem(name: "tipoVenta", value: tv.rawValue))
        }
        if let tr = transmision, tr != .cualquiera {
            items.append(URLQueryItem(name: "transmision", value: tr == .automatica ? "automatica" : "manual"))
        }

        comps.queryItems = items.isEmpty ? nil : items
        return comps.string ?? "https://woaw.mx/search/vehiculos"
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        let url = URL(string: buildQuery())!
        return .result(value: url)
    }
}
