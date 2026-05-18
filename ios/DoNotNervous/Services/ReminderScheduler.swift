import Foundation
import UserNotifications

public struct ReminderDraft: Equatable {
    public let enabled: Bool
    public let hour: Int
    public let minute: Int
    public let message: String

    public init(enabled: Bool, hour: Int, minute: Int, message: String) {
        self.enabled = enabled
        self.hour = hour
        self.minute = minute
        self.message = message
    }
}

public protocol NotificationCentering {
    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool
    func removePendingNotificationRequests(withIdentifiers identifiers: [String])
    func add(_ request: UNNotificationRequest) async throws
}

extension UNUserNotificationCenter: NotificationCentering {}

public final class ReminderScheduler {
    public static let gentleReminderId = "gentle-daily-check-in"

    private let center: NotificationCentering

    public init(center: NotificationCentering = UNUserNotificationCenter.current()) {
        self.center = center
    }

    public func apply(_ reminder: ReminderDraft) async throws {
        center.removePendingNotificationRequests(withIdentifiers: [Self.gentleReminderId])
        guard reminder.enabled else { return }

        let granted = try await center.requestAuthorization(options: [.alert, .sound])
        guard granted else { return }

        var date = DateComponents()
        date.hour = reminder.hour
        date.minute = reminder.minute

        let content = UNMutableNotificationContent()
        content.title = "今天也辛苦了"
        content.body = reminder.message
        content.sound = .default

        let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
        let request = UNNotificationRequest(
            identifier: Self.gentleReminderId,
            content: content,
            trigger: trigger
        )
        try await center.add(request)
    }
}
