import SwiftData
import SwiftUI

public struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var preferences: [ReminderPreference]
    @Query private var syncStates: [SyncState]

    @State private var reminderEnabled = false
    @State private var reminderDate = Calendar.current.date(bySettingHour: 20, minute: 30, second: 0, of: Date()) ?? Date()
    @State private var reminderMessage = "如果愿意，可以回来看看今天的小进步。"
    @State private var syncMessage = "未同步"
    @State private var email = ""
    @State private var password = ""
    @State private var authMessage = "未登录也可以继续本地使用"

    private let scheduler = ReminderScheduler()
    private let syncEngine = SyncEngine()
    private let authService = AuthService()

    public init() {}

    public var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                header
                authCard
                reminderCard
                syncCard
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 42)
        }
        .background(DNNBackground())
        .navigationTitle("设置")
        .toolbar {
            ToolbarItem(placement: doneToolbarPlacement) {
                Button("完成") { dismiss() }
                    .font(.system(.body, design: .rounded).weight(.bold))
                    .foregroundStyle(DNNColors.sage)
            }
        }
        .onAppear(perform: hydrate)
    }

    private var header: some View {
        DNNIllustratedHeader(
            title: "把节奏\n调成自己的",
            subtitle: "登录、提醒和同步都可以慢慢来，本地记录会一直保留。",
            illustration: .window,
            tint: DNNColors.sky,
            imageWidth: 196
        )
    }

    private var authCard: some View {
        DNNCard(cornerRadius: 30, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                DNNSectionHeader("可选登录", subtitle: authMessage)

                VStack(spacing: 12) {
                    emailField
                        .settingsFieldStyle()

                    SecureField("密码", text: $password)
                        .settingsFieldStyle()
                }

                HStack(spacing: 10) {
                    Button {
                        authenticate(register: false)
                    } label: {
                        Label("登录", systemImage: "person.crop.circle.badge.checkmark")
                            .frame(maxWidth: .infinity)
                    }
                    .settingsActionStyle(tint: DNNColors.sage, filled: true)

                    Button {
                        authenticate(register: true)
                    } label: {
                        Label("创建账户", systemImage: "plus.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .settingsActionStyle(tint: DNNColors.lavender, filled: false)
                }
            }
        }
    }

    private var reminderCard: some View {
        DNNCard(cornerRadius: 30, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                DNNSectionHeader("温和提醒", subtitle: "只在你允许时，轻轻提醒一次。")

                Toggle("开启每日轻提醒", isOn: $reminderEnabled)
                    .font(.system(.body, design: .rounded).weight(.bold))
                    .tint(DNNColors.sage)
                    .padding(14)
                    .background(DNNColors.surfaceStrong, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                DatePicker("提醒时间", selection: $reminderDate, displayedComponents: .hourAndMinute)
                    .font(.system(.body, design: .rounded).weight(.bold))
                    .padding(14)
                    .background(DNNColors.surfaceStrong, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                TextField("提醒文案", text: $reminderMessage, axis: .vertical)
                    .lineLimit(2...4)
                    .settingsFieldStyle(minHeight: 78)

                PrimaryCapsuleButton("保存提醒", systemImage: "bell.badge.fill") {
                    saveReminder()
                }
            }
        }
    }

    private var syncCard: some View {
        DNNCard(cornerRadius: 30, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                DNNSectionHeader("同步", subtitle: syncMessage)

                Button {
                    syncLocalData()
                } label: {
                    Label("登录后同步本机数据", systemImage: "arrow.triangle.2.circlepath")
                        .frame(maxWidth: .infinity)
                }
                .settingsActionStyle(tint: DNNColors.sky, filled: true)

                Text("当前实现会把本机快照推送到现有 Hono `/sync` 接口；未登录或无网络时，本地数据继续可用。")
                    .font(.caption)
                    .foregroundStyle(DNNColors.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var emailField: some View {
        let field = TextField("邮箱", text: $email)
        #if os(iOS)
        return field
            .textInputAutocapitalization(.never)
            .keyboardType(.emailAddress)
        #else
        return field
        #endif
    }

    private var doneToolbarPlacement: ToolbarItemPlacement {
        #if os(iOS)
        .topBarTrailing
        #else
        .automatic
        #endif
    }

    private func hydrate() {
        if let preference = preferences.first {
            reminderEnabled = preference.enabled
            reminderMessage = preference.message
            reminderDate = Calendar.current.date(
                bySettingHour: preference.hour,
                minute: preference.minute,
                second: 0,
                of: Date()
            ) ?? reminderDate
        }
    }

    private func saveReminder() {
        let components = Calendar.current.dateComponents([.hour, .minute], from: reminderDate)
        let preference = preferences.first ?? ReminderPreference()
        preference.enabled = reminderEnabled
        preference.hour = components.hour ?? 20
        preference.minute = components.minute ?? 30
        preference.message = reminderMessage
        preference.updatedAt = Date()

        if preferences.isEmpty {
            modelContext.insert(preference)
        }
        try? modelContext.save()

        Task { @MainActor in
            try? await scheduler.apply(ReminderDraft(
                enabled: reminderEnabled,
                hour: preference.hour,
                minute: preference.minute,
                message: reminderMessage
            ))
        }
    }

    private func syncLocalData() {
        let state = syncStates.first ?? SyncState()
        if syncStates.isEmpty {
            modelContext.insert(state)
        }

        Task { @MainActor in
            do {
                let response = try await syncEngine.pushLocalSnapshot(
                    context: modelContext,
                    since: state.lastPulledAt?.ISO8601Format() ?? "1970-01-01T00:00:00Z"
                )
                state.lastPushedAt = Date()
                state.lastPulledAt = ISO8601DateFormatter().date(from: response.serverTimestamp) ?? Date()
                state.pendingLocalChangeCount = 0
                state.updatedAt = Date()
                try? modelContext.save()
                syncMessage = "已同步到 \(response.serverTimestamp)"
            } catch {
                syncMessage = "暂时无法同步，本地数据已保留"
            }
        }
    }

    private func authenticate(register: Bool) {
        Task { @MainActor in
            do {
                if register {
                    try await authService.register(email: email, password: password)
                    authMessage = "账户已创建，之后可以同步本机数据"
                } else {
                    try await authService.login(email: email, password: password)
                    authMessage = "已登录，可以同步本机数据"
                }
            } catch {
                authMessage = "登录暂时失败，本地数据不受影响"
            }
        }
    }
}

private extension View {
    func settingsFieldStyle(minHeight: CGFloat = 54) -> some View {
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

    func settingsActionStyle(tint: Color, filled: Bool) -> some View {
        self
            .font(.system(.subheadline, design: .rounded).weight(.black))
            .foregroundStyle(filled ? .white : tint)
            .padding(.horizontal, 14)
            .frame(minHeight: 48)
            .background(filled ? tint : tint.opacity(0.12), in: Capsule())
    }
}
