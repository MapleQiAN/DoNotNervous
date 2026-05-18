import Foundation
import SwiftData

public enum TaskStatus: String, Codable, CaseIterable {
    case active
    case completed
    case archived
}

public enum TaskDifficulty: String, Codable, CaseIterable {
    case easy
    case medium
    case hard

    public var title: String {
        switch self {
        case .easy: "轻松"
        case .medium: "专注"
        case .hard: "挑战"
        }
    }
}

public enum MoodKind: String, Codable, CaseIterable {
    case happy
    case calm
    case neutral
    case sad
    case anxious
    case angry
    case excited
    case strong

    public var emoji: String {
        switch self {
        case .happy: "😊"
        case .calm: "😌"
        case .neutral: "😐"
        case .sad: "😔"
        case .anxious: "😰"
        case .angry: "😡"
        case .excited: "🥳"
        case .strong: "💪"
        }
    }

    public var title: String {
        switch self {
        case .happy: "开心"
        case .calm: "平静"
        case .neutral: "平稳"
        case .sad: "低落"
        case .anxious: "焦虑"
        case .angry: "烦躁"
        case .excited: "兴奋"
        case .strong: "有力"
        }
    }
}

public enum CompanionMood: String, Codable, CaseIterable {
    case normal
    case happy
    case celebrating
    case tired
    case proud
}

public enum CosmeticSlot: String, Codable, CaseIterable {
    case hat
    case face
    case body
    case room
    case effect

    public var title: String {
        switch self {
        case .hat: "帽子"
        case .face: "表情"
        case .body: "衣服"
        case .room: "房间"
        case .effect: "特效"
        }
    }
}

@Model
public final class DNNTask: Identifiable {
    @Attribute(.unique) public var id: UUID
    public var parentId: UUID?
    public var title: String
    public var detail: String
    public var statusRaw: String
    public var difficultyRaw: String
    public var category: String
    public var sortOrder: Int
    public var createdAt: Date
    public var completedAt: Date?
    public var archivedAt: Date?
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        parentId: UUID? = nil,
        title: String,
        detail: String = "",
        status: TaskStatus = .active,
        difficulty: TaskDifficulty = .easy,
        category: String = "",
        sortOrder: Int = 0,
        createdAt: Date = Date(),
        completedAt: Date? = nil,
        archivedAt: Date? = nil,
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.parentId = parentId
        self.title = title
        self.detail = detail
        self.statusRaw = status.rawValue
        self.difficultyRaw = difficulty.rawValue
        self.category = category
        self.sortOrder = sortOrder
        self.createdAt = createdAt
        self.completedAt = completedAt
        self.archivedAt = archivedAt
        self.updatedAt = updatedAt
    }

    public var status: TaskStatus {
        get { TaskStatus(rawValue: statusRaw) ?? .active }
        set { statusRaw = newValue.rawValue }
    }

    public var difficulty: TaskDifficulty {
        get { TaskDifficulty(rawValue: difficultyRaw) ?? .easy }
        set { difficultyRaw = newValue.rawValue }
    }
}

@Model
public final class PointLedgerEntry: Identifiable {
    @Attribute(.unique) public var id: UUID
    public var amount: Int
    public var type: String
    public var reason: String
    public var taskId: UUID?
    public var streakLength: Int
    public var multiplier: Int
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        amount: Int,
        type: String,
        reason: String,
        taskId: UUID? = nil,
        streakLength: Int = 0,
        multiplier: Int = 100,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.amount = amount
        self.type = type
        self.reason = reason
        self.taskId = taskId
        self.streakLength = streakLength
        self.multiplier = multiplier
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

@Model
public final class MoodEntry: Identifiable {
    @Attribute(.unique) public var id: UUID
    public var kindRaw: String
    public var journal: String
    public var taskId: UUID?
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        kind: MoodKind,
        journal: String = "",
        taskId: UUID? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.kindRaw = kind.rawValue
        self.journal = journal
        self.taskId = taskId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    public var kind: MoodKind {
        get { MoodKind(rawValue: kindRaw) ?? .calm }
        set { kindRaw = newValue.rawValue }
    }
}

@Model
public final class RewardItem: Identifiable {
    @Attribute(.unique) public var id: UUID
    public var name: String
    public var detail: String
    public var pointCost: Int
    public var icon: String
    public var active: Bool
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        name: String,
        detail: String = "",
        pointCost: Int,
        icon: String = "gift",
        active: Bool = true,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.detail = detail
        self.pointCost = pointCost
        self.icon = icon
        self.active = active
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

@Model
public final class CompanionProfile: Identifiable {
    @Attribute(.unique) public var id: UUID
    public var displayName: String
    public var level: Int
    public var experience: Int
    public var energy: Int
    public var moodRaw: String
    public var activeCosmeticIds: [String]
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        displayName: String = "圆圆",
        level: Int = 1,
        experience: Int = 0,
        energy: Int = 80,
        mood: CompanionMood = .normal,
        activeCosmeticIds: [String] = [],
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.displayName = displayName
        self.level = level
        self.experience = experience
        self.energy = energy
        self.moodRaw = mood.rawValue
        self.activeCosmeticIds = activeCosmeticIds
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    public var mood: CompanionMood {
        get { CompanionMood(rawValue: moodRaw) ?? .normal }
        set { moodRaw = newValue.rawValue }
    }
}

@Model
public final class CosmeticUnlock: Identifiable {
    @Attribute(.unique) public var id: UUID
    public var cosmeticId: String
    public var name: String
    public var slotRaw: String
    public var pointCost: Int
    public var equipped: Bool
    public var unlockedAt: Date
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        cosmeticId: String,
        name: String,
        slot: CosmeticSlot,
        pointCost: Int,
        equipped: Bool = false,
        unlockedAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.cosmeticId = cosmeticId
        self.name = name
        self.slotRaw = slot.rawValue
        self.pointCost = pointCost
        self.equipped = equipped
        self.unlockedAt = unlockedAt
        self.updatedAt = updatedAt
    }

    public var slot: CosmeticSlot {
        get { CosmeticSlot(rawValue: slotRaw) ?? .hat }
        set { slotRaw = newValue.rawValue }
    }
}

@Model
public final class ReminderPreference: Identifiable {
    @Attribute(.unique) public var id: UUID
    public var enabled: Bool
    public var hour: Int
    public var minute: Int
    public var message: String
    public var timezone: String
    public var lastScheduledAt: Date?
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        enabled: Bool = false,
        hour: Int = 20,
        minute: Int = 30,
        message: String = "如果愿意，可以回来看看今天的小进步。",
        timezone: String = "Asia/Shanghai",
        lastScheduledAt: Date? = nil,
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.enabled = enabled
        self.hour = hour
        self.minute = minute
        self.message = message
        self.timezone = timezone
        self.lastScheduledAt = lastScheduledAt
        self.updatedAt = updatedAt
    }
}

@Model
public final class SyncState {
    @Attribute(.unique) public var deviceId: String
    public var lastPulledAt: Date?
    public var lastPushedAt: Date?
    public var pendingLocalChangeCount: Int
    public var updatedAt: Date

    public init(
        deviceId: String = UUID().uuidString,
        lastPulledAt: Date? = nil,
        lastPushedAt: Date? = nil,
        pendingLocalChangeCount: Int = 0,
        updatedAt: Date = Date()
    ) {
        self.deviceId = deviceId
        self.lastPulledAt = lastPulledAt
        self.lastPushedAt = lastPushedAt
        self.pendingLocalChangeCount = pendingLocalChangeCount
        self.updatedAt = updatedAt
    }
}
