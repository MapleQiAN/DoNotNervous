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
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                balanceHero
                addRewardCard
                rewardSection
                cosmeticSection
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 112)
        }
        .background(DNNBackground())
        .navigationTitle("金库")
    }

    private var balanceHero: some View {
        DNNCard(cornerRadius: 34, padding: 0) {
            ZStack(alignment: .bottomTrailing) {
                LinearGradient(
                    colors: [Color.white.opacity(0.9), DNNColors.honey.opacity(0.20), DNNColors.rose.opacity(0.14)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                VStack(alignment: .leading, spacing: 12) {
                    Text("\(balance) 分")
                        .font(.system(size: 54, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [DNNColors.amber, DNNColors.coral],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)

                    Text("这些积分只用来好好奖励自己。")
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(DNNColors.ink)

                    Text("先完成，再兑换。奖励不是偷懒，是让明天更愿意回来。")
                        .font(.subheadline)
                        .foregroundStyle(DNNColors.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(22)

                DNNIllustrationView(.rewardPig)
                    .frame(width: 180)
                    .offset(x: 26, y: 26)
            }
            .frame(minHeight: 220)
            .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
        }
    }

    private var addRewardCard: some View {
        DNNCard {
            ZStack(alignment: .topTrailing) {
                DNNIllustrationView(.coinJar)
                    .frame(width: 112)
                    .opacity(0.22)
                    .offset(x: 22, y: -20)

                VStack(alignment: .leading, spacing: 14) {
                    DNNSectionHeader("添加奖励", subtitle: "把想要的休息、体验或小礼物放进金库。")

                    TextField("奖励名称", text: $rewardName)
                        .font(.system(.body, design: .rounded).weight(.semibold))
                        .foregroundStyle(DNNColors.ink)
                        .padding(.horizontal, 16)
                        .frame(minHeight: 54)
                        .background(DNNColors.surfaceStrong, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .strokeBorder(DNNColors.amber.opacity(0.18), lineWidth: 1)
                        )

                    Stepper(value: $rewardCost, in: 10...1000, step: 10) {
                        HStack {
                            Text("需要积分")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(DNNColors.muted)
                            Spacer()
                            Text("\(rewardCost)")
                                .font(.system(.title3, design: .rounded).weight(.black))
                                .foregroundStyle(DNNColors.amber)
                        }
                    }
                    .padding(14)
                    .background(DNNColors.surfaceStrong.opacity(0.76), in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                    PrimaryCapsuleButton("加入金库", systemImage: "plus") {
                        addReward()
                    }
                    .disabled(rewardName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private var rewardSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            DNNSectionHeader("奖励金库", subtitle: rewards.isEmpty ? "先放入一个值得期待的小奖励。" : "攒够时，就认真兑换它。")

            if rewards.isEmpty {
                DNNEmptyState(title: "还没有奖励", message: "添加一个真实想要的东西，积分会更有方向。", systemImage: "sparkles")
            } else {
                VStack(spacing: 12) {
                    ForEach(rewards) { reward in
                        RewardRow(
                            title: reward.name,
                            subtitle: "\(reward.pointCost) 分",
                            systemImage: reward.icon,
                            tint: DNNColors.amber,
                            actionTitle: "兑换",
                            isDisabled: balance < reward.pointCost
                        ) {
                            redeem(reward)
                        }
                    }
                }
            }
        }
    }

    private var cosmeticSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            DNNSectionHeader("装扮", subtitle: "给圆圆换一点新的心情。")

            VStack(spacing: 12) {
                ForEach(starterCosmetics, id: \.0) { cosmetic in
                    let owned = cosmetics.contains { $0.cosmeticId == cosmetic.0 }
                    RewardRow(
                        title: cosmetic.1,
                        subtitle: "\(cosmetic.2.title) · \(cosmetic.3) 分",
                        systemImage: cosmetic.2.systemImage,
                        tint: cosmetic.2.tint,
                        actionTitle: owned ? "已拥有" : "解锁",
                        isDisabled: balance < cosmetic.3 || owned
                    ) {
                        unlock(cosmetic)
                    }
                }
            }
        }
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

private struct RewardRow: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let tint: Color
    let actionTitle: String
    let isDisabled: Bool
    let action: () -> Void

    var body: some View {
        DNNCard(cornerRadius: 24, padding: 16) {
            HStack(spacing: 14) {
                Image(systemName: systemImage)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(tint)
                    .frame(width: 46, height: 46)
                    .background(tint.opacity(0.14), in: Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(DNNColors.ink)
                    Text(subtitle)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(DNNColors.muted)
                }

                Spacer()

                Button(actionTitle, action: action)
                    .font(.caption.weight(.black))
                    .foregroundStyle(isDisabled ? DNNColors.muted : .white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(isDisabled ? DNNColors.muted.opacity(0.12) : tint, in: Capsule())
                    .disabled(isDisabled)
            }
        }
    }
}

private extension CosmeticSlot {
    var systemImage: String {
        switch self {
        case .hat: "crown.fill"
        case .face: "face.smiling.fill"
        case .body: "tshirt.fill"
        case .room: "house.fill"
        case .effect: "sparkle"
        }
    }

    var tint: Color {
        switch self {
        case .hat: DNNColors.sage
        case .face: DNNColors.rose
        case .body: DNNColors.sky
        case .room: DNNColors.lavender
        case .effect: DNNColors.amber
        }
    }
}
