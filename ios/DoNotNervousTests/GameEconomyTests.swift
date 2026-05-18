import XCTest
@testable import DoNotNervousIOS

final class GameEconomyTests: XCTestCase {
    func testDifficultyPointsMatchProductEconomy() {
        XCTAssertEqual(GameEconomy.points(for: .easy), 10)
        XCTAssertEqual(GameEconomy.points(for: .medium), 25)
        XCTAssertEqual(GameEconomy.points(for: .hard), 50)
    }

    func testCompanionExperienceScalesWithDifficulty() {
        XCTAssertLessThan(
            GameEconomy.companionExperience(for: .easy),
            GameEconomy.companionExperience(for: .hard)
        )
    }

    func testLevelProgressCarriesRemainingExperience() {
        let progress = GameEconomy.levelProgress(for: 125)
        XCTAssertEqual(progress.level, 2)
        XCTAssertEqual(progress.progress, 25)
        XCTAssertEqual(progress.nextLevelExperience, 200)
    }
}
