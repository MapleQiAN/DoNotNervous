import Foundation
import SwiftData

@MainActor
public final class SyncEngine {
    private let api: APIClient

    public init(api: APIClient = APIClient()) {
        self.api = api
    }

    public func pushLocalSnapshot(context: ModelContext, since lastSyncTimestamp: String) async throws -> SyncResponse {
        let payload: [String: Any] = [
            "lastSyncTimestamp": lastSyncTimestamp,
            "changes": try snapshotChanges(context: context)
        ]
        let body = try JSONSerialization.data(withJSONObject: payload)
        return try await api.request("/sync", method: "POST", body: body, as: SyncResponse.self)
    }

    private func snapshotChanges(context: ModelContext) throws -> [String: [[String: Any]]] {
        let tasks = try context.fetch(FetchDescriptor<DNNTask>()).map { task in
            var payload: [String: Any] = [
                "id": task.id.uuidString,
                "type": "simple",
                "title": task.title,
                "description": task.detail,
                "status": task.status.rawValue,
                "difficulty": task.difficulty.rawValue,
                "category": task.category,
                "sortOrder": task.sortOrder,
                "createdAt": task.createdAt.iso8601String,
                "updatedAt": task.updatedAt.iso8601String
            ]
            if let parentId = task.parentId { payload["parentId"] = parentId.uuidString }
            if let completedAt = task.completedAt { payload["completedAt"] = completedAt.iso8601String }
            if let archivedAt = task.archivedAt { payload["archivedAt"] = archivedAt.iso8601String }
            return payload
        }

        let profiles = try context.fetch(FetchDescriptor<CompanionProfile>()).map { profile in
            [
                "displayName": profile.displayName,
                "level": profile.level,
                "experience": profile.experience,
                "energy": profile.energy,
                "mood": profile.mood.rawValue,
                "activeCosmeticIds": profile.activeCosmeticIds,
                "createdAt": profile.createdAt.iso8601String,
                "updatedAt": profile.updatedAt.iso8601String
            ] as [String: Any]
        }

        let reminders = try context.fetch(FetchDescriptor<ReminderPreference>()).map { reminder in
            var payload: [String: Any] = [
                "enabled": reminder.enabled,
                "hour": reminder.hour,
                "minute": reminder.minute,
                "message": reminder.message,
                "timezone": reminder.timezone,
                "updatedAt": reminder.updatedAt.iso8601String
            ]
            if let lastScheduledAt = reminder.lastScheduledAt {
                payload["lastScheduledAt"] = lastScheduledAt.iso8601String
            }
            return payload
        }

        let syncStates = try context.fetch(FetchDescriptor<SyncState>()).map { state in
            var payload: [String: Any] = [
                "deviceId": state.deviceId,
                "pendingLocalChangeCount": state.pendingLocalChangeCount,
                "updatedAt": state.updatedAt.iso8601String
            ]
            if let lastPulledAt = state.lastPulledAt { payload["lastPulledAt"] = lastPulledAt.iso8601String }
            if let lastPushedAt = state.lastPushedAt { payload["lastPushedAt"] = lastPushedAt.iso8601String }
            return payload
        }

        return [
            "tasks": tasks,
            "companionProfiles": profiles,
            "reminderPreferences": reminders,
            "syncStates": syncStates
        ]
    }
}

private extension Date {
    var iso8601String: String {
        ISO8601DateFormatter().string(from: self)
    }
}
