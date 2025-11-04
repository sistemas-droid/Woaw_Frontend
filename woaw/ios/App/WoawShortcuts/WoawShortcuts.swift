//
//  WoawShortcuts.swift
//  WoawShortcuts
//
//  Created by Hector Cervantes Yañez  on 31/10/25.
//

import AppIntents

struct WoawShortcuts: AppIntent {
    static var title: LocalizedStringResource { "WoawShortcuts" }
    
    func perform() async throws -> some IntentResult {
        return .result()
    }
}
