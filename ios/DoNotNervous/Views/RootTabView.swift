import SwiftUI

public struct RootTabView: View {
    public init() {}

    public var body: some View {
        TabView {
            NavigationStack {
                TodayView()
            }
            .tabItem { Label("今日", systemImage: "sun.max.fill") }

            NavigationStack {
                TaskListView()
            }
            .tabItem { Label("任务", systemImage: "checklist") }

            NavigationStack {
                MoodView()
            }
            .tabItem { Label("心情", systemImage: "face.smiling") }

            NavigationStack {
                VaultView()
            }
            .tabItem { Label("金库", systemImage: "gift.fill") }

            NavigationStack {
                ReviewView()
            }
            .tabItem { Label("复盘", systemImage: "chart.xyaxis.line") }
        }
        .tint(DNNColors.sage)
    }
}
