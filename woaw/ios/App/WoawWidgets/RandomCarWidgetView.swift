import SwiftUI
import WidgetKit

fileprivate let currencyMX: NumberFormatter = {
    let f = NumberFormatter()
    f.numberStyle = .currency
    f.locale = Locale(identifier: "es_MX")
    f.maximumFractionDigits = 0
    return f
}()

struct RandomCarWidgetView: View {
    let entry: RandomCarEntry

    var body: some View {
        if #available(iOS 17.0, *) {
            content.containerBackground(for: .widget) { }
        } else {
            content.background(Color(.systemBackground))
        }
    }

    private var content: some View {
        Group {
            if let car = entry.car {
                VStack(alignment: .leading, spacing: 6) {

                    if let img = entry.image {
                        Image(uiImage: img)
                            .resizable()
                            .scaledToFill()
                            .frame(maxWidth: .infinity, maxHeight: 90)
                            .clipped()
                            .cornerRadius(8)
                    } else {
                        Rectangle()
                            .opacity(0.08)
                            .frame(height: 90)
                            .cornerRadius(8)
                    }

                    Text(car.titulo)
                        .font(.headline)
                        .lineLimit(1)

                    if let p = car.precio {
                        Text(currencyMX.string(from: NSNumber(value: p)) ?? "$\(Int(p))")
                            .font(.subheadline).bold()
                    } else {
                        Text("Precio no disponible")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    Text(car.tipoVenta.capitalized)
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Spacer(minLength: 0)
                }
                .widgetURL(URL(string: car.deepLink))
                .padding(10)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    Text("WOAW").font(.headline)
                    Text("Sin resultados ahora")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(10)
            }
        }
    }
}
