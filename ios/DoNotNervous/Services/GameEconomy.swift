import Foundation
import SwiftData

public struct LevelProgress: Equatable {
    public let level: Int
    public let progress: Int
    public let nextLevelExperience: Int
}

public enum GameEconomy {
    public static func points(for difficulty: TaskDifficulty) -> Int {
        switch difficulty {
        case .easy: 10
        case .medium: 25
        case .hard: 50
        }
    }

    public static func companionExperience(for difficulty: TaskDifficulty) -> Int {
        switch difficulty {
        case .easy: 12
        case .medium: 28
        case .hard: 55
        }
    }

    public static func levelProgress(for experience: Int) -> LevelProgress {
        var level = 1
        var remaining = max(0, experience)
        var threshold = 100

        while remaining >= threshold {
            remaining -= threshold
            level += 1
            threshold = level * 100
        }

        return LevelProgress(level: level, progress: remaining, nextLevelExperience: threshold)
    }
}

@MainActor
public enum LocalStoreActions {
    public static func ensureCompanion(in context: ModelContext) -> CompanionProfile {
        let descriptor = FetchDescriptor<CompanionProfile>()
        if let existing = try? context.fetch(descriptor).first {
            return existing
        }

        let profile = CompanionProfile()
        context.insert(profile)
        try? context.save()
        return profile
    }

    public static func pointBalance(in context: ModelContext) -> Int {
        let descriptor = FetchDescriptor<PointLedgerEntry>()
        let entries = (try? context.fetch(descriptor)) ?? []
        return entries.reduce(0) { $0 + $1.amount }
    }

    public static func complete(_ task: DNNTask, in context: ModelContext) {
        guard task.status != .completed else { return }

        let now = Date()
        let points = GameEconomy.points(for: task.difficulty)
        let experience = GameEconomy.companionExperience(for: task.difficulty)
        let profile = ensureCompanion(in: context)
        let levelInfo = GameEconomy.levelProgress(for: profile.experience + experience)

        task.status = .completed
        task.completedAt = now
        task.updatedAt = now

        context.insert(PointLedgerEntry(
            amount: points,
            type: "task_complete",
            reason: "完成任务：\(task.title)",
            taskId: task.id,
            createdAt: now,
            updatedAt: now
        ))

        profile.experience += experience
        profile.level = levelInfo.level
        profile.energy = min(100, profile.energy + 5)
        profile.mood = .celebrating
        profile.updatedAt = now

        try? context.save()
    }

    public static func logMood(_ mood: MoodKind, journal: String, taskId: UUID?, in context: ModelContext) {
        context.insert(MoodEntry(kind: mood, journal: journal, taskId: taskId))
        let profile = ensureCompanion(in: context)
        profile.mood = mood == .happy || mood == .excited || mood == .strong ? .happy : .normal
        profile.updatedAt = Date()
        try? context.save()
    }
}
