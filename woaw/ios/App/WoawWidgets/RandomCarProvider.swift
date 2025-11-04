import WidgetKit
import SwiftUI
import UIKit

struct RandomCar: Decodable {
    let id: String
    let tipo: String
    let tipoVenta: String
    let titulo: String
    let precio: Double?
    let imageUrl: String?
    let deepLink: String
}

struct RandomCarEntry: TimelineEntry {
    let date: Date
    let car: RandomCar?
    let tipoVenta: TipoVenta
    let image: UIImage?
}

struct RandomCarProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> RandomCarEntry {
        .init(date: .now, car: nil, tipoVenta: .cualquiera, image: nil)
    }

    func snapshot(for configuration: RandomCarConfigurationIntent, in context: Context) async -> RandomCarEntry {
        await entry(for: configuration)
    }

    func timeline(for configuration: RandomCarConfigurationIntent, in context: Context) async -> Timeline<RandomCarEntry> {
        let entry = await entry(for: configuration)
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        return Timeline(entries: [entry], policy: .after(next))
    }

    private func entry(for configuration: RandomCarConfigurationIntent) async -> RandomCarEntry {
        let tipo = configuration.tipoVenta ?? .cualquiera

        var urlString = "https://woaw-backend-507962515113.us-central1.run.app/widgets/random-car"
        if tipo != .cualquiera { urlString += "?tipoVenta=\(tipo.rawValue)" }

        guard let url = URL(string: urlString) else {
            return .init(date: .now, car: nil, tipoVenta: tipo, image: nil)
        }

        do {
            let (data, resp) = try await URLSession.shared.data(from: url)
            guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode), !data.isEmpty else {
                return .init(date: .now, car: nil, tipoVenta: tipo, image: nil)
            }

            let car = try JSONDecoder().decode(RandomCar.self, from: data)

            // Descarga rápida de imagen (más estable que AsyncImage en widgets)
            var uiImage: UIImage? = nil
            if let s = car.imageUrl, let imgURL = URL(string: s) {
                var req = URLRequest(url: imgURL, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 3)
                req.setValue("Mozilla/5.0", forHTTPHeaderField: "User-Agent")
                if let (imgData, r) = try? await URLSession.shared.data(for: req),
                   let http2 = r as? HTTPURLResponse, (200..<300).contains(http2.statusCode),
                   let img = UIImage(data: imgData) {
                    uiImage = img
                }
            }

            return .init(date: .now, car: car, tipoVenta: tipo, image: uiImage)
        } catch {
            return .init(date: .now, car: nil, tipoVenta: tipo, image: nil)
        }
    }
}
