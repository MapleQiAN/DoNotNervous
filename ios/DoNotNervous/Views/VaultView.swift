import SwiftData
import SwiftUI

public struct VaultView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \RewardItem.createdAt, order: .reverse) private var rewards: [RewardItem]
    @Query(sort: \CosmeticUnlock.unlockedAt, order: .reverse) private var cosmetics: [CosmeticUnlock]
    @Query private var ledger: [PointLedgerEntry]

    @State private var rewardName = ""
    @State private var rewardCost = 80

    private let starterCosmetics = [
        ("sprout-hat", "小芽帽", CosmeticSlot.hat, 60),
        ("star-room", "星星房间", CosmeticSlot.room, 120),
        ("sparkle-effect", "闪闪特效", CosmeticSlot.effect, 180)
    ]

    public init() {}

    public var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("\(balance) 分")
                        .font(.largeTitle.bold())
                        .foregroundStyle(DNNColors.amber)
                    Text("这些积分只用来好好奖励自己。")
                        .foregroundStyle(DNNColors.muted)
                }
            }

            Section("添加奖励") {
                TextField("奖励名称", text: $rewardName)
                Stepper("需要 \(rewardCost) 分", value: $rewardCost, in: 10...1000, step: 10)
                PrimaryCapsuleButton("加入金库", systemImage: "plus") {
                    addReward()
                }
                .disabled(rewardName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }

            Section("奖励金库") {
                ForEach(rewards) { reward in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(reward.name).font(.headline)
                            Text("\(reward.pointCost) 分")
                                .font(.caption)
                                .foregroundStyle(DNNColors.muted)
                        }
                        Spacer()
                        Button("兑换") {
                            redeem(reward)
                        }
                        .disabled(balance < reward.pointCost)
                    }
                }
            }

            Section("装扮") {
                ForEach(starterCosmetics, id: \.0) { cosmetic in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(cosmetic.1).font(.headline)
                            Text("\(cosmetic.2.title) · \(cosmetic.3) 分")
                                .font(.caption)
                                .foregroundStyle(DNNColors.muted)
                        }
                        Spacer()
                        Button(cosmetics.contains { $0.cosmeticId == cosmetic.0 } ? "已拥有" : "解锁") {
                            unlock(cosmetic)
                        }
                        .disabled(balance < cosmetic.3 || cosmetics.contains { $0.cosmeticId == cosmetic.0 })
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(DNNColors.canvas)
        .navigationTitle("金库")
    }

    private var balance: Int {
        ledger.reduce(0) { $0 + $1.amount }
    }

    private func addReward() {
        let trimmed = rewardName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        modelContext.insert(RewardItem(name: trimmed, pointCost: rewardCost))
        try? modelContext.save()
        rewardName = ""
        rewardCost = 80
    }

    private func redeem(_ reward: RewardItem) {
        guard balance >= reward.pointCost else { return }
        modelContext.insert(PointLedgerEntry(
            amount: -reward.pointCost,
            type: "reward_spent",
            reason: "兑换奖励：\(reward.name)"
        ))
        try? modelContext.save()
    }

    private func unlock(_ cosmetic: (String, String, CosmeticSlot, Int)) {
        guard balance >= cosmetic.3 else { return }
        modelContext.insert(CosmeticUnlock(
            cosmeticId: cosmetic.0,
            name: cosmetic.1,
            slot: cosmetic.2,
            pointCost: cosmetic.3
        ))
        modelContext.insert(PointLedgerEntry(
            amount: -cosmetic.3,
            type: "cosmetic_unlock",
            reason: "解锁装扮：\(cosmetic.1)"
        ))
        try? modelContext.save()
    }
}
