import SwiftData
import SwiftUI

public struct ReviewView: View {
    @Query private var tasks: [DNNTask]
    @Query private var ledger: [PointLedgerEntry]
    @Query(sort: \MoodEntry.createdAt, order: .reverse) private var moods: [MoodEntry]

    public init() {}

    public var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                statsGrid
                weeklyRhythm
                recentMoodCard
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 112)
        }
        .background(DNNBackground())
        .navigationTitle("复盘")
    }

    private var header: some View {
        DNNIllustratedHeader(
            title: "把努力\n看见",
            subtitle: "复盘不是审判，是把已经做到的部分收回来。",
            illustration: .sofa,
            tint: DNNColors.rose,
            imageWidth: 214
        )
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            ReviewStatTile(title: "今日完成", value: "\(completedToday)", systemImage: "checkmark.seal.fill", tint: DNNColors.sage)
            ReviewStatTile(title: "本周积分", value: "\(pointsThisWeek)", systemImage: "bolt.fill", tint: DNNColors.amber)
            ReviewStatTile(title: "心情记录", value: "\(moods.count)", systemImage: "heart.fill", tint: DNNColors.rose)
            ReviewStatTile(title: "连续节奏", value: "\(activeDaysThisWeek)/7", systemImage: "waveform.path.ecg", tint: DNNColors.lavender)
        }
    }

    private var weeklyRhythm: some View {
        DNNCard(cornerRadius: 32, padding: 18) {
            VStack(alignment: .leading, spacing: 16) {
                DNNSectionHeader("本周节奏", subtitle: activeDaysThisWeek == 0 ? "还没开始也没关系，从今天补一格。" : "有完成的日子会亮起来。")

                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(weekDays, id: \.date) { item in
                        VStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(item.isActive ? item.tint : DNNColors.muted.opacity(0.13))
                                .frame(height: item.isActive ? 74 : 34)
                                .overlay(alignment: .top) {
                                    if item.isToday {
                                        Circle()
                                            .fill(Color.white.opacity(0.86))
                                            .frame(width: 8, height: 8)
                                            .padding(.top, 8)
                                    }
                                }

                            Text(item.label)
                                .font(.caption2.weight(.black))
                                .foregroundStyle(item.isToday ? DNNColors.ink : DNNColors.muted)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 116, alignment: .bottom)
            }
        }
    }

    private var recentMoodCard: some View {
        DNNCard(cornerRadius: 32, padding: 18) {
            VStack(alignment: .leading, spacing: 16) {
                DNNSectionHeader("最近心情", subtitle: moods.isEmpty ? "等你留下第一条记录。" : "情绪会变化，但它们都可以被温柔放下。")

                if moods.isEmpty {
                    Text("还没有记录。等你愿意时再写就好。")
                        .font(.subheadline)
                        .foregroundStyle(DNNColors.muted)
                } else {
                    HStack(spacing: 10) {
                        ForEach(moods.prefix(7)) { mood in
                            VStack(spacing: 6) {
                                Text(mood.kind.emoji)
                                    .font(.system(size: 24))
                                    .frame(width: 44, height: 44)
                                    .background(moodTint(mood.kind).opacity(0.16), in: Circle())
                                Text(mood.kind.title)
                                    .font(.caption2.weight(.black))
                                    .foregroundStyle(DNNColors.muted)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
            }
        }
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
        Set(activeCompletionDays.map { Calendar.current.startOfDay(for: $0) }).count
    }

    private var activeCompletionDays: [Date] {
        let start = Calendar.current.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        return tasks.compactMap { task in
            guard let completedAt = task.completedAt, completedAt >= start else { return nil }
            return completedAt
        }
    }

    private var weekDays: [WeekDayState] {
        let calendar = Calendar.current
        let start = calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        let activeDays = Set(activeCompletionDays.map { calendar.startOfDay(for: $0) })
        let symbols = calendar.veryShortWeekdaySymbols

        return (0..<7).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: offset, to: start) else { return nil }
            let day = calendar.component(.weekday, from: date) - 1
            return WeekDayState(
                date: date,
                label: symbols.indices.contains(day) ? symbols[day] : "\(offset + 1)",
                isActive: activeDays.contains(calendar.startOfDay(for: date)),
                isToday: calendar.isDateInToday(date),
                tint: offset % 2 == 0 ? DNNColors.sage : DNNColors.amber
            )
        }
    }

    private func moodTint(_ mood: MoodKind) -> Color {
        switch mood {
        case .happy, .excited: DNNColors.amber
        case .calm, .strong: DNNColors.sage
        case .neutral: DNNColors.sky
        case .sad: DNNColors.lavender
        case .anxious: DNNColors.coral
        case .angry: DNNColors.rose
        }
    }
}

private struct ReviewStatTile: View {
    let title: String
    let value: String
    let systemImage: String
    let tint: Color

    var body: some View {
        DNNCard(cornerRadius: 26, padding: 16) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Image(systemName: systemImage)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(tint)
                        .frame(width: 32, height: 32)
                        .background(tint.opacity(0.14), in: Circle())
                    Spacer()
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(value)
                        .font(.system(.largeTitle, design: .rounded).weight(.black))
                        .foregroundStyle(tint)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(title)
                        .font(.caption.weight(.black))
                        .foregroundStyle(DNNColors.muted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct WeekDayState {
    let date: Date
    let label: String
    let isActive: Bool
    let isToday: Bool
    let tint: Color
}
