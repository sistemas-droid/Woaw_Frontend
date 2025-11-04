import AppIntents

struct WoawShortcutsProvider: AppShortcutsProvider {
    static var shortcutTileColor: ShortcutTileColor = .red

    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: BuscarVehiculoIntent(),
            phrases: [
                AppShortcutPhrase("Buscar coches en \(.applicationName)"),
                AppShortcutPhrase("Buscar en \(.applicationName)"),
                AppShortcutPhrase("Encontrar vehículos en \(.applicationName)")
            ],
            shortTitle: "Buscar coches",
            systemImageName: "car.fill"
        )
    }
}
