import SwiftData
import SwiftUI

public struct ReviewView: View {
    @Query private var tasks: [DNNTask]
    @Query private var ledger: [PointLedgerEntry]
    @Query(sort: \MoodEntry.createdAt, order: .reverse) private var moods: [MoodEntry]

    public init() {}

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("把努力看见")
                    .font(.largeTitle.bold())
                    .foregroundStyle(DNNColors.ink)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    stat("今日完成", value: "\(completedToday)", color: DNNColors.sage)
                    stat("本周积分", value: "\(pointsThisWeek)", color: DNNColors.amber)
                    stat("心情记录", value: "\(moods.count)", color: DNNColors.sky)
                    stat("连续节奏", value: "\(activeDaysThisWeek)/7", color: DNNColors.lavender)
                }

                DNNCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("最近心情")
                            .font(.headline)
                        if moods.isEmpty {
                            Text("还没有记录。等你愿意时再写就好。")
                                .foregroundStyle(DNNColors.muted)
                        } else {
                            HStack {
                                ForEach(moods.prefix(7)) { mood in
                                    Text(mood.kind.emoji)
                                        .font(.title2)
                                }
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(DNNColors.canvas.ignoresSafeArea())
        .navigationTitle("复盘")
    }

    private var completedToday: Int {
        tasks.filter { task in
            guard let completedAt = task.completedAt else { return false }
            return Calendar.current.isDateInToday(completedAt)
        }.count
    }

    private var pointsThisWeek: Int {
        let start = Calendar.current.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        return ledger
            .filter { $0.createdAt >= start }
            .reduce(0) { $0 + max(0, $1.amount) }
    }

    private var activeDaysThisWeek: Int {
        let start = Calendar.current.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        let days = Set(tasks.compactMap { task -> String? in
            guard let completedAt = task.completedAt, completedAt >= start else { return nil }
            return completedAt.formatted(.iso8601.year().month().day())
        })
        return days.count
    }

    private func stat(_ title: String, value: String, color: Color) -> some View {
        DNNCard {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.caption.bold())
                    .foregroundStyle(DNNColors.muted)
                Text(value)
                    .font(.title.bold())
                    .foregroundStyle(color)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
