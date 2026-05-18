import SwiftData
import SwiftUI

public struct MoodView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \MoodEntry.createdAt, order: .reverse) private var moods: [MoodEntry]

    @State private var selected: MoodKind = .calm
    @State private var journal = ""

    public init() {}

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                DNNCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("现在感觉怎么样？")
                            .font(.title3.bold())

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 10) {
                            ForEach(MoodKind.allCases, id: \.self) { mood in
                                Button {
                                    selected = mood
                                } label: {
                                    VStack(spacing: 4) {
                                        Text(mood.emoji).font(.title2)
                                        Text(mood.title).font(.caption.bold())
                                    }
                                    .frame(maxWidth: .infinity, minHeight: 66)
                                    .background(
                                        selected == mood ? DNNColors.sky.opacity(0.20) : Color.white.opacity(0.64),
                                        in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        TextField("可以写一句，也可以不写", text: $journal, axis: .vertical)
                            .textFieldStyle(.roundedBorder)

                        PrimaryCapsuleButton("记录心情", systemImage: "heart.fill") {
                            LocalStoreActions.logMood(selected, journal: journal, taskId: nil, in: modelContext)
                            journal = ""
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("最近记录")
                        .font(.title3.bold())
                    ForEach(moods.prefix(10)) { mood in
                        DNNCard {
                            HStack {
                                Text(mood.kind.emoji).font(.title2)
                                VStack(alignment: .leading) {
                                    Text(mood.kind.title).font(.headline)
                                    if !mood.journal.isEmpty {
                                        Text(mood.journal)
                                            .font(.caption)
                                            .foregroundStyle(DNNColors.muted)
                                    }
                                }
                                Spacer()
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(DNNColors.canvas.ignoresSafeArea())
        .navigationTitle("心情")
    }
}
