import SwiftData
import SwiftUI

public struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \DNNTask.createdAt, order: .reverse) private var tasks: [DNNTask]
    @Query private var profiles: [CompanionProfile]
    @Query private var ledger: [PointLedgerEntry]

    @State private var newTaskTitle = ""
    @State private var difficulty: TaskDifficulty = .easy
    @State private var showSettings = false

    private let horizontalInset: CGFloat = 28

    public init() {}

    public var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                hero
                quickAdd
                focusTasks
            }
            .padding(.horizontal, horizontalInset)
            .padding(.top, 14)
            .padding(.bottom, 112)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(DNNBackground())
        .navigationTitle("今日")
        .inlineNavigationTitleOnIOS()
        .toolbar {
            ToolbarItem(placement: settingsToolbarPlacement) {
                Button {
                    showSettings = true
                } label: {
                    Image(systemName: "gearshape.fill")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(DNNColors.ink)
                        .frame(width: 36, height: 36)
                        .background(DNNColors.surfaceStrong, in: Circle())
                }
                .accessibilityLabel("设置")
            }
        }
        .sheet(isPresented: $showSettings) {
            NavigationStack {
                SettingsView()
            }
        }
        .task {
            _ = LocalStoreActions.ensureCompanion(in: modelContext)
        }
    }

    private var settingsToolbarPlacement: ToolbarItemPlacement {
        #if os(iOS)
        .topBarTrailing
        #else
        .automatic
        #endif
    }

    private var profile: CompanionProfile {
        profiles.first ?? CompanionProfile()
    }

    private var activeTasks: [DNNTask] {
        tasks.filter { $0.status == .active }
    }

    private var completedTodayCount: Int {
        let calendar = Calendar.current
        return tasks.filter {
            $0.status == .completed &&
            $0.completedAt.map { calendar.isDateInToday($0) } == true
        }.count
    }

    private var balance: Int {
        ledger.reduce(0) { $0 + $1.amount }
    }

    private var levelProgress: LevelProgress {
        GameEconomy.levelProgress(for: profile.experience)
    }

    private var hero: some View {
        DNNCard(cornerRadius: 34, padding: 0) {
            VStack(alignment: .leading, spacing: 18) {
                ZStack(alignment: .topLeading) {
                    HomeHeroIllustration()

                    LinearGradient(
                        colors: [DNNColors.surfaceStrong.opacity(0.92), DNNColors.surfaceStrong.opacity(0.72), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: 220)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("慢慢来，\n也在进步")
                            .font(.system(.largeTitle, design: .rounded).weight(.black))
                            .foregroundStyle(DNNColors.ink)
                            .lineLimit(3)
                            .minimumScaleFactor(0.82)

                        Text("把任务拆小，把奖励变近。圆圆会陪你把一天走稳。")
                            .font(.system(.subheadline, design: .rounded).weight(.medium))
                            .foregroundStyle(DNNColors.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(width: 178, alignment: .leading)
                    .padding(20)
                }
                .frame(height: 236)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(profile.displayName)
                                .font(.system(.title3, design: .rounded).weight(.black))
                                .foregroundStyle(DNNColors.ink)
                            Text("Lv.\(profile.level) 成长中")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(DNNColors.muted)
                        }

                        Spacer()

                        Text("\(levelProgress.progress)/\(levelProgress.nextLevelExperience)")
                            .font(.caption.weight(.black))
                            .foregroundStyle(DNNColors.amber)
                    }

                    ProgressView(
                        value: Double(levelProgress.progress),
                        total: Double(levelProgress.nextLevelExperience)
                    )
                    .tint(DNNColors.amber)
                    .scaleEffect(x: 1, y: 1.25, anchor: .center)
                }

                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                    DNNMetricTile(title: "今日完成", value: "\(completedTodayCount)", systemImage: "checkmark.seal.fill", tint: DNNColors.sage)
                    DNNMetricTile(title: "积分余额", value: "\(balance)", systemImage: "sparkles", tint: DNNColors.amber)
                    DNNMetricTile(title: "进行中", value: "\(activeTasks.count)", systemImage: "scope", tint: DNNColors.lavender)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
    }

    private var quickAdd: some View {
        DNNCard {
            ZStack(alignment: .topTrailing) {
                DNNIllustrationView(.sidebarPlant)
                    .frame(width: 96)
                    .opacity(0.22)
                    .offset(x: 18, y: -22)

                VStack(alignment: .leading, spacing: 16) {
                    DNNSectionHeader("写下一个小开始", subtitle: "只需要足够小，今天就会更容易动起来。")

                    VStack(spacing: 12) {
                        TextField("例如：整理桌面五分钟", text: $newTaskTitle)
                            .font(.system(.body, design: .rounded).weight(.semibold))
                            .foregroundStyle(DNNColors.ink)
                            .padding(.horizontal, 16)
                            .frame(minHeight: 54)
                            .background(DNNColors.surfaceStrong, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .strokeBorder(DNNColors.sage.opacity(0.16), lineWidth: 1)
                            )

                        Picker("难度", selection: $difficulty) {
                            ForEach(TaskDifficulty.allCases, id: \.self) { item in
                                Text(item.title).tag(item)
                            }
                        }
                        .pickerStyle(.segmented)

                        difficultyNote
                    }

                    PrimaryCapsuleButton("添加任务", systemImage: "plus") {
                        addTask()
                    }
                    .disabled(newTaskTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private var difficultyNote: some View {
        HStack(spacing: 10) {
            Image(systemName: difficultyIcon)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(difficultyTint)
                .frame(width: 30, height: 30)
                .background(difficultyTint.opacity(0.14), in: Circle())

            Text(difficultyCopy)
                .font(.caption.weight(.semibold))
                .foregroundStyle(DNNColors.muted)

            Spacer()
        }
        .padding(10)
        .background(difficultyTint.opacity(0.08), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var difficultyIcon: String {
        switch difficulty {
        case .easy: "leaf.fill"
        case .medium: "timer"
        case .hard: "flame.fill"
        }
    }

    private var difficultyTint: Color {
        switch difficulty {
        case .easy: DNNColors.sage
        case .medium: DNNColors.amber
        case .hard: DNNColors.coral
        }
    }

    private var difficultyCopy: String {
        switch difficulty {
        case .easy: "轻松任务适合启动，完成后获得 \(GameEconomy.points(for: .easy)) 分。"
        case .medium: "专注任务需要一点沉浸，完成后获得 \(GameEconomy.points(for: .medium)) 分。"
        case .hard: "挑战任务留给能量更足的时候，完成后获得 \(GameEconomy.points(for: .hard)) 分。"
        }
    }

    private var focusTasks: some View {
        VStack(alignment: .leading, spacing: 14) {
            DNNSectionHeader("今日焦点", subtitle: activeTasks.isEmpty ? "先放一个很小的任务进来。" : "不用全做完，先完成最顺手的一项。")

            if activeTasks.isEmpty {
                DNNEmptyState(
                    title: "还没有任务",
                    message: "写一个能在五分钟内开始的小动作就好。",
                    systemImage: "moon.stars.fill"
                )
            } else {
                VStack(spacing: 12) {
                    ForEach(activeTasks.prefix(5)) { task in
                        TaskRow(task: task) {
                            LocalStoreActions.complete(task, in: modelContext)
                        }
                    }
                }
            }
        }
    }

    private func addTask() {
        let title = newTaskTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        modelContext.insert(DNNTask(title: title, difficulty: difficulty))
        try? modelContext.save()
        newTaskTitle = ""
        difficulty = .easy
    }
}

private struct TaskRow: View {
    let task: DNNTask
    let complete: () -> Void

    var body: some View {
        DNNCard(cornerRadius: 24, padding: 16) {
            HStack(spacing: 14) {
                Button(action: complete) {
                    Image(systemName: "circle")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(DNNColors.sage)
                        .frame(width: 42, height: 42)
                        .background(DNNColors.sage.opacity(0.10), in: Circle())
                }
                .accessibilityLabel("完成任务")

                VStack(alignment: .leading, spacing: 6) {
                    Text(task.title)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(DNNColors.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("\(task.difficulty.title) · +\(GameEconomy.points(for: task.difficulty)) 分")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(DNNColors.muted)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(DNNColors.muted.opacity(0.6))
            }
        }
    }
}

private struct HomeHeroIllustration: View {
    var body: some View {
        GeometryReader { proxy in
            DNNIllustrationView(.homeHero)
                .frame(width: min(proxy.size.width * 0.96, 344))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .offset(x: 22, y: 16)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 236)
        .clipped()
        .accessibilityHidden(true)
    }
}

private extension View {
    @ViewBuilder
    func inlineNavigationTitleOnIOS() -> some View {
        #if os(iOS)
        navigationBarTitleDisplayMode(.inline)
        #else
        self
        #endif
    }
}
