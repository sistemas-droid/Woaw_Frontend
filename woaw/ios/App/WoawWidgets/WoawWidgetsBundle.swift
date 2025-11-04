import WidgetKit
import SwiftUI

@main
struct WoawWidgetsBundle: WidgetBundle {
    var body: some Widget {
        RandomCarWidget()
    }
}

struct RandomCarWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: "com.woaw.randomcar",
            intent: RandomCarConfigurationIntent.self,
            provider: RandomCarProvider()
        ) { entry in
            RandomCarWidgetView(entry: entry)
        }
        .configurationDisplayName("Random Car")
        .description("Muestra un auto aleatorio por tipo de venta.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
