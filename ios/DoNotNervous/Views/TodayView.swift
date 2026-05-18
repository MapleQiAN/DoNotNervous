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

    public init() {}

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                companionPanel
                quickAdd
                focusTasks
            }
            .padding(20)
        }
        .background(DNNColors.canvas.ignoresSafeArea())
        .navigationTitle("今日")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showSettings = true
                } label: {
                    Image(systemName: "gearshape")
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

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("慢慢来，今天也有进步")
                .font(.largeTitle.bold())
                .foregroundStyle(DNNColors.ink)
            Text("完成一点点，圆圆就会长大一点。")
                .font(.subheadline)
                .foregroundStyle(DNNColors.muted)
        }
    }

    private var companionPanel: some View {
        DNNCard {
            HStack(spacing: 18) {
                CompanionAvatar(mood: profile.mood)
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text(profile.displayName)
                            .font(.title2.bold())
                        Text("Lv.\(profile.level)")
                            .font(.caption.bold())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(DNNColors.lavender.opacity(0.18), in: Capsule())
                    }
                    ProgressView(value: Double(levelProgress.progress), total: Double(levelProgress.nextLevelExperience))
                        .tint(DNNColors.amber)
                    Text("今日完成 \(completedTodayCount) 项，余额 \(balance) 分")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(DNNColors.muted)
                }
            }
        }
    }

    private var levelProgress: LevelProgress {
        GameEconomy.levelProgress(for: profile.experience)
    }

    private var quickAdd: some View {
        DNNCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("快速添加任务")
                    .font(.headline)
                TextField("写下一个小任务", text: $newTaskTitle)
                    .textFieldStyle(.roundedBorder)
                Picker("难度", selection: $difficulty) {
                    ForEach(TaskDifficulty.allCases, id: \.self) { item in
                        Text(item.title).tag(item)
                    }
                }
                .pickerStyle(.segmented)
                PrimaryCapsuleButton("添加任务", systemImage: "plus") {
                    addTask()
                }
                .disabled(newTaskTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private var focusTasks: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("今日焦点")
                .font(.title3.bold())
                .foregroundStyle(DNNColors.ink)

            if activeTasks.isEmpty {
                DNNCard {
                    Text("还没有任务。先写一个很小的开始吧。")
                        .foregroundStyle(DNNColors.muted)
                }
            } else {
                ForEach(activeTasks.prefix(4)) { task in
                    TaskRow(task: task) {
                        LocalStoreActions.complete(task, in: modelContext)
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
        DNNCard {
            HStack(spacing: 12) {
                Button(action: complete) {
                    Image(systemName: "circle")
                        .font(.title3)
                        .foregroundStyle(DNNColors.sage)
                }
                .accessibilityLabel("完成任务")

                VStack(alignment: .leading, spacing: 4) {
                    Text(task.title)
                        .font(.headline)
                        .foregroundStyle(DNNColors.ink)
                    Text("\(task.difficulty.title) +\(GameEconomy.points(for: task.difficulty)) 分")
                        .font(.caption)
                        .foregroundStyle(DNNColors.muted)
                }

                Spacer()
            }
        }
    }
}
