import SwiftData
import SwiftUI

@main
struct DoNotNervousApp: App {
    var body: some Scene {
        WindowGroup {
            RootTabView()
        }
        .modelContainer(for: [
            DNNTask.self,
            PointLedgerEntry.self,
            MoodEntry.self,
            RewardItem.self,
            CompanionProfile.self,
            CosmeticUnlock.self,
            ReminderPreference.self,
            SyncState.self
        ])
    }
}
