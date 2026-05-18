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
        List {
            Section("新任务") {
                TextField("任务名称", text: $title)
                TextField("补充说明", text: $detail, axis: .vertical)
                Picker("难度", selection: $difficulty) {
                    ForEach(TaskDifficulty.allCases, id: \.self) { item in
                        Text(item.title).tag(item)
                    }
                }
                PrimaryCapsuleButton("保存任务", systemImage: "checkmark") {
                    addTask()
                }
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }

            Section("进行中") {
                ForEach(tasks.filter { $0.status == .active }) { task in
                    taskCell(task)
                }
            }

            Section("已完成") {
                ForEach(tasks.filter { $0.status == .completed }) { task in
                    taskCell(task)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(DNNColors.canvas)
        .navigationTitle("任务")
    }

    private func taskCell(_ task: DNNTask) -> some View {
        HStack {
            Button {
                if task.status == .completed {
                    task.status = .active
                    task.completedAt = nil
                    task.updatedAt = Date()
                    try? modelContext.save()
                } else {
                    LocalStoreActions.complete(task, in: modelContext)
                }
            } label: {
                Image(systemName: task.status == .completed ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(task.status == .completed ? DNNColors.sage : DNNColors.muted)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(task.status == .completed ? "标记为未完成" : "完成任务")

            VStack(alignment: .leading) {
                Text(task.title)
                    .font(.headline)
                if !task.detail.isEmpty {
                    Text(task.detail)
                        .font(.caption)
                        .foregroundStyle(DNNColors.muted)
                }
            }

            Spacer()

            Text(task.difficulty.title)
                .font(.caption.bold())
                .foregroundStyle(DNNColors.lavender)
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                modelContext.delete(task)
                try? modelContext.save()
            } label: {
                Label("删除", systemImage: "trash")
            }
        }
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
