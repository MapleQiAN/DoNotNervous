import SwiftUI

public enum DNNColors {
    public static let canvas = Color(red: 0.98, green: 0.96, blue: 0.91)
    public static let surface = Color.white.opacity(0.86)
    public static let ink = Color(red: 0.22, green: 0.18, blue: 0.13)
    public static let muted = Color(red: 0.48, green: 0.42, blue: 0.34)
    public static let sage = Color(red: 0.36, green: 0.62, blue: 0.42)
    public static let amber = Color(red: 0.95, green: 0.64, blue: 0.22)
    public static let coral = Color(red: 0.90, green: 0.38, blue: 0.31)
    public static let sky = Color(red: 0.42, green: 0.66, blue: 0.92)
    public static let lavender = Color(red: 0.58, green: 0.50, blue: 0.88)
}

public struct DNNCard<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        content
            .padding(16)
            .background(DNNColors.surface, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.06), radius: 18, x: 0, y: 10)
    }
}

public struct PrimaryCapsuleButton: View {
    private let title: String
    private let systemImage: String
    private let action: () -> Void

    public init(_ title: String, systemImage: String, action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.headline)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(DNNColors.sage, in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
    }
}

public struct CompanionAvatar: View {
    public let mood: CompanionMood

    public init(mood: CompanionMood) {
        self.mood = mood
    }

    public var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 42, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [Color.white, DNNColors.amber.opacity(0.22)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 148, height: 128)
                .overlay(alignment: .topTrailing) {
                    Circle()
                        .fill(DNNColors.lavender.opacity(0.28))
                        .frame(width: 34, height: 34)
                        .offset(x: 8, y: -4)
                }

            HStack(spacing: 24) {
                Circle().fill(DNNColors.ink).frame(width: 10, height: 10)
                Circle().fill(DNNColors.ink).frame(width: 10, height: 10)
            }
            .offset(y: -12)

            Capsule()
                .fill(mouthColor)
                .frame(width: mood == .celebrating ? 38 : 28, height: 8)
                .offset(y: 22)
        }
        .scaleEffect(mood == .celebrating ? 1.04 : 1)
        .animation(.spring(response: 0.35, dampingFraction: 0.68), value: mood)
        .accessibilityHidden(true)
    }

    private var mouthColor: Color {
        switch mood {
        case .tired: DNNColors.muted
        case .proud, .happy, .celebrating: DNNColors.coral
        case .normal: DNNColors.sage
        }
    }
}
