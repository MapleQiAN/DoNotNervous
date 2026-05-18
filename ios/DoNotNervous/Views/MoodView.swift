import SwiftData
import SwiftUI

public struct MoodView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \MoodEntry.createdAt, order: .reverse) private var moods: [MoodEntry]

    @State private var selected: MoodKind = .calm
    @State private var journal = ""

    public init() {}

    public var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                moodCard
                recentMoods
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 112)
        }
        .background(DNNBackground())
        .navigationTitle("心情")
    }

    private var header: some View {
        DNNIllustratedHeader(
            title: "先承认感觉，\n再安排今天",
            subtitle: "记录不需要解释自己，一句话也很好。",
            illustration: .moodHero,
            tint: DNNColors.sky,
            imageWidth: 220
        )
    }

    private var moodCard: some View {
        DNNCard(cornerRadius: 34, padding: 18) {
            ZStack(alignment: .topTrailing) {
                DNNIllustrationView(.heartPlant)
                    .frame(width: 112)
                    .opacity(0.20)
                    .offset(x: 18, y: -20)

                VStack(alignment: .leading, spacing: 16) {
                    DNNSectionHeader("现在感觉怎么样？", subtitle: selected.titlePrompt)

                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
                        ForEach(MoodKind.allCases, id: \.self) { mood in
                            MoodChoice(mood: mood, isSelected: selected == mood) {
                                selected = mood
                            }
                        }
                    }

                    TextField("可以写一句，也可以不写", text: $journal, axis: .vertical)
                        .lineLimit(3...5)
                        .font(.system(.body, design: .rounded).weight(.medium))
                        .foregroundStyle(DNNColors.ink)
                        .padding(16)
                        .frame(minHeight: 92, alignment: .topLeading)
                        .background(DNNColors.surfaceStrong, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .strokeBorder(selected.tint.opacity(0.16), lineWidth: 1)
                        )

                    PrimaryCapsuleButton("记录心情", systemImage: "heart.fill") {
                        LocalStoreActions.logMood(selected, journal: journal, taskId: nil, in: modelContext)
                        journal = ""
                    }
                }
            }
        }
    }

    private var recentMoods: some View {
        VStack(alignment: .leading, spacing: 14) {
            DNNSectionHeader("最近记录", subtitle: moods.isEmpty ? "等你愿意时再写就好。" : "这些记录会帮你看见自己的节奏。")

            if moods.isEmpty {
                DNNEmptyState(title: "还没有心情记录", message: "选择一个状态，留下一句今天的注脚。", systemImage: "heart.text.square.fill")
            } else {
                VStack(spacing: 12) {
                    ForEach(moods.prefix(10)) { mood in
                        MoodHistoryRow(mood: mood)
                    }
                }
            }
        }
    }
}

private struct MoodChoice: View {
    let mood: MoodKind
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 7) {
                Text(mood.emoji)
                    .font(.system(size: 26))
                Text(mood.title)
                    .font(.caption.weight(.black))
                    .foregroundStyle(isSelected ? DNNColors.ink : DNNColors.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.74)
            }
            .frame(maxWidth: .infinity, minHeight: 78)
            .background(
                isSelected ? mood.tint.opacity(0.20) : DNNColors.surfaceStrong.opacity(0.72),
                in: RoundedRectangle(cornerRadius: 20, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(isSelected ? mood.tint.opacity(0.55) : Color.white.opacity(0.64), lineWidth: 1)
            )
            .scaleEffect(isSelected ? 1.03 : 1)
            .animation(.spring(response: 0.28, dampingFraction: 0.72), value: isSelected)
        }
        .buttonStyle(.plain)
    }
}

private struct MoodHistoryRow: View {
    let mood: MoodEntry

    var body: some View {
        DNNCard(cornerRadius: 24, padding: 16) {
            HStack(spacing: 14) {
                Text(mood.kind.emoji)
                    .font(.title2)
                    .frame(width: 44, height: 44)
                    .background(mood.kind.tint.opacity(0.16), in: Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text(mood.kind.title)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(DNNColors.ink)
                    if !mood.journal.isEmpty {
                        Text(mood.journal)
                            .font(.subheadline)
                            .foregroundStyle(DNNColors.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        Text(mood.createdAt.formatted(date: .abbreviated, time: .shortened))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(DNNColors.muted)
                    }
                }

                Spacer()
            }
        }
    }
}

private extension MoodKind {
    var tint: Color {
        switch self {
        case .happy, .excited: DNNColors.amber
        case .calm, .strong: DNNColors.sage
        case .neutral: DNNColors.sky
        case .sad: DNNColors.lavender
        case .anxious: DNNColors.coral
        case .angry: DNNColors.rose
        }
    }

    var titlePrompt: String {
        switch self {
        case .happy: "把好的部分记下来，它值得被看见。"
        case .calm: "保持这点平静，今天可以轻一点。"
        case .neutral: "平稳也很好，不必强行振奋。"
        case .sad: "先把难过放下，不急着解决全部。"
        case .anxious: "把焦虑写小一点，它就没那么占地方。"
        case .angry: "先给情绪留出口，再决定下一步。"
        case .excited: "趁能量在，把它用在一件具体小事上。"
        case .strong: "这份有力可以带你完成一个清楚动作。"
        }
    }
}
