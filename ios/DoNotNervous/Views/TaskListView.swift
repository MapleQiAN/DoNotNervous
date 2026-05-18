import SwiftData
import SwiftUI

public struct TaskListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \DNNTask.createdAt, order: .reverse) private var tasks: [DNNTask]

    @State private var title = ""
    @State private var detail = ""
    @State private var difficulty: TaskDifficulty = .medium

    public init() {}

    public var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                composer
                taskSection(
                    title: "进行中",
                    subtitle: "把注意力留给最靠近完成的那一件。",
                    items: activeTasks,
                    emptyTitle: "现在很安静",
                    emptyMessage: "添加一个任务后，它会出现在这里。"
                )
                taskSection(
                    title: "已完成",
                    subtitle: "这些不是小事，它们正在把节奏铺起来。",
                    items: completedTasks,
                    emptyTitle: "还没有完成记录",
                    emptyMessage: "完成第一项后，这里会留下一点证据。"
                )
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 112)
        }
        .background(DNNBackground())
        .navigationTitle("任务")
    }

    private var activeTasks: [DNNTask] {
        tasks.filter { $0.status == .active }
    }

    private var completedTasks: [DNNTask] {
        tasks.filter { $0.status == .completed }
    }

    private var header: some View {
        DNNIllustratedHeader(
            title: "任务不是\n压力清单",
            subtitle: "它只是把下一步放到更容易看见的位置。",
            illustration: .taskHero,
            tint: DNNColors.amber,
            imageWidth: 218
        )
    }

    private var composer: some View {
        DNNCard(cornerRadius: 32, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                DNNSectionHeader("新任务", subtitle: "短一点、具体一点，会更容易开始。")

                VStack(spacing: 12) {
                    TextField("任务名称", text: $title)
                        .taskTextFieldStyle()

                    TextField("补充说明", text: $detail, axis: .vertical)
                        .lineLimit(2...4)
                        .taskTextFieldStyle(minHeight: 68)

                    Picker("难度", selection: $difficulty) {
                        ForEach(TaskDifficulty.allCases, id: \.self) { item in
                            Text(item.title).tag(item)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                PrimaryCapsuleButton("保存任务", systemImage: "checkmark") {
                    addTask()
                }
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private func taskSection(
        title: String,
        subtitle: String,
        items: [DNNTask],
        emptyTitle: String,
        emptyMessage: String
    ) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            DNNSectionHeader(title, subtitle: subtitle)

            if items.isEmpty {
                DNNEmptyState(title: emptyTitle, message: emptyMessage, systemImage: "tray.fill")
            } else {
                VStack(spacing: 12) {
                    ForEach(items) { task in
                        TaskListRow(task: task, toggle: { toggle(task) }, delete: { delete(task) })
                    }
                }
            }
        }
    }

    private func toggle(_ task: DNNTask) {
        if task.status == .completed {
            task.status = .active
            task.completedAt = nil
            task.updatedAt = Date()
            try? modelContext.save()
        } else {
            LocalStoreActions.complete(task, in: modelContext)
        }
    }

    private func delete(_ task: DNNTask) {
        modelContext.delete(task)
        try? modelContext.save()
    }

    private func addTask() {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        modelContext.insert(DNNTask(title: trimmed, detail: detail, difficulty: difficulty))
        try? modelContext.save()
        title = ""
        detail = ""
        difficulty = .medium
    }
}

private struct TaskListRow: View {
    let task: DNNTask
    let toggle: () -> Void
    let delete: () -> Void

    var body: some View {
        DNNCard(cornerRadius: 24, padding: 16) {
            HStack(alignment: .top, spacing: 14) {
                Button(action: toggle) {
                    Image(systemName: task.status == .completed ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 25, weight: .semibold))
                        .foregroundStyle(task.status == .completed ? DNNColors.sage : DNNColors.muted)
                        .frame(width: 42, height: 42)
                        .background(DNNColors.surfaceStrong, in: Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(task.status == .completed ? "标记为未完成" : "完成任务")

                VStack(alignment: .leading, spacing: 7) {
                    Text(task.title)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(task.status == .completed ? DNNColors.muted : DNNColors.ink)
                        .strikethrough(task.status == .completed, color: DNNColors.muted.opacity(0.6))
                        .fixedSize(horizontal: false, vertical: true)

                    if !task.detail.isEmpty {
                        Text(task.detail)
                            .font(.subheadline)
                            .foregroundStyle(DNNColors.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Text("\(task.difficulty.title) · +\(GameEconomy.points(for: task.difficulty)) 分")
                        .font(.caption.weight(.black))
                        .foregroundStyle(difficultyTint)
                }

                Spacer()

                Menu {
                    Button(role: .destructive, action: delete) {
                        Label("删除", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 17, weight: .black))
                        .foregroundStyle(DNNColors.muted)
                        .frame(width: 36, height: 36)
                        .background(DNNColors.muted.opacity(0.10), in: Circle())
                }
            }
        }
    }

    private var difficultyTint: Color {
        switch task.difficulty {
        case .easy: DNNColors.sage
        case .medium: DNNColors.amber
        case .hard: DNNColors.coral
        }
    }
}

private extension View {
    func taskTextFieldStyle(minHeight: CGFloat = 54) -> some View {
        self
            .font(.system(.body, design: .rounded).weight(.semibold))
            .foregroundStyle(DNNColors.ink)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(minHeight: minHeight)
            .background(DNNColors.surfaceStrong, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(DNNColors.sage.opacity(0.14), lineWidth: 1)
            )
    }
}
