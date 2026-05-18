import UserNotifications
import XCTest
@testable import DoNotNervousIOS

final class ReminderSchedulerTests: XCTestCase {
    func testDisabledReminderClearsPendingRequestWithoutPrompting() async throws {
        let center = NotificationCenterSpy()
        let scheduler = ReminderScheduler(center: center)

        try await scheduler.apply(ReminderDraft(
            enabled: false,
            hour: 20,
            minute: 30,
            message: "如果愿意，可以回来看看今天的小进步。"
        ))

        XCTAssertEqual(center.removedIds, [ReminderScheduler.gentleReminderId])
        XCTAssertFalse(center.requestedAuthorization)
        XCTAssertEqual(center.addedRequests.count, 0)
    }

    func testEnabledReminderSchedulesGentleDailyNotification() async throws {
        let center = NotificationCenterSpy()
        let scheduler = ReminderScheduler(center: center)

        try await scheduler.apply(ReminderDraft(
            enabled: true,
            hour: 20,
            minute: 30,
            message: "如果愿意，可以回来看看今天的小进步。"
        ))

        XCTAssertTrue(center.requestedAuthorization)
        XCTAssertEqual(center.addedRequests.first?.identifier, ReminderScheduler.gentleReminderId)
        XCTAssertEqual(center.addedRequests.first?.content.title, "今天也辛苦了")
    }
}

private final class NotificationCenterSpy: NotificationCentering {
    var removedIds: [String] = []
    var addedRequests: [UNNotificationRequest] = []
    var requestedAuthorization = false

    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool {
        requestedAuthorization = true
        return true
    }

    func removePendingNotificationRequests(withIdentifiers identifiers: [String]) {
        removedIds = identifiers
    }

    func add(_ request: UNNotificationRequest) async throws {
        addedRequests.append(request)
    }
}
