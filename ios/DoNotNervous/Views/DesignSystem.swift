import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public enum DNNColors {
    public static let canvas = Color(red: 0.98, green: 0.95, blue: 0.88)
    public static let canvasDeep = Color(red: 0.91, green: 0.86, blue: 0.76)
    public static let surface = Color.white.opacity(0.88)
    public static let surfaceStrong = Color.white.opacity(0.96)
    public static let ink = Color(red: 0.18, green: 0.14, blue: 0.10)
    public static let muted = Color(red: 0.48, green: 0.42, blue: 0.34)
    public static let sage = Color(red: 0.30, green: 0.56, blue: 0.39)
    public static let moss = Color(red: 0.18, green: 0.36, blue: 0.27)
    public static let amber = Color(red: 0.95, green: 0.61, blue: 0.18)
    public static let honey = Color(red: 0.98, green: 0.77, blue: 0.38)
    public static let coral = Color(red: 0.88, green: 0.35, blue: 0.28)
    public static let rose = Color(red: 0.96, green: 0.67, blue: 0.61)
    public static let sky = Color(red: 0.36, green: 0.62, blue: 0.86)
    public static let lavender = Color(red: 0.55, green: 0.48, blue: 0.82)
    public static let plum = Color(red: 0.34, green: 0.26, blue: 0.47)
}

public struct DNNBackground: View {
    public init() {}

    public var body: some View {
        ZStack {
            LinearGradient(
                colors: [DNNColors.canvas, DNNColors.canvasDeep.opacity(0.62), DNNColors.surfaceStrong],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(DNNColors.honey.opacity(0.34))
                .frame(width: 280, height: 280)
                .blur(radius: 54)
                .offset(x: -130, y: -280)

            Circle()
                .fill(DNNColors.sky.opacity(0.22))
                .frame(width: 240, height: 240)
                .blur(radius: 58)
                .offset(x: 150, y: -70)

            Circle()
                .fill(DNNColors.rose.opacity(0.22))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: 160, y: 380)
        }
        .ignoresSafeArea()
    }
}

public enum DNNIllustration: String, CaseIterable {
    case coinJar = "coin_jar"
    case heartPlant = "heart_plant"
    case homeHero = "home-hero"
    case moodHero = "mood-hero"
    case rewardPig = "reward-pig"
    case sidebarPlant = "sidebar-plant"
    case sofa
    case taskHero = "task-hero"
    case window

    var fallbackSystemImage: String {
        switch self {
        case .coinJar: "banknote.fill"
        case .heartPlant: "heart.fill"
        case .homeHero: "sun.max.fill"
        case .moodHero: "cup.and.saucer.fill"
        case .rewardPig: "gift.fill"
        case .sidebarPlant: "leaf.fill"
        case .sofa: "sparkles"
        case .taskHero: "checklist"
        case .window: "window.vertical.closed"
        }
    }
}

public struct DNNIllustrationView: View {
    private let illustration: DNNIllustration
    private let contentMode: ContentMode

    public init(_ illustration: DNNIllustration, contentMode: ContentMode = .fit) {
        self.illustration = illustration
        self.contentMode = contentMode
    }

    public var body: some View {
        image
            .resizable()
            .aspectRatio(contentMode: contentMode)
            .accessibilityHidden(true)
    }

    private var image: Image {
        #if canImport(UIKit)
        let bundle: Bundle = {
            #if SWIFT_PACKAGE
            .module
            #else
            .main
            #endif
        }()

        if let url = bundle.url(forResource: illustration.rawValue, withExtension: "png"),
           let image = UIImage(contentsOfFile: url.path) {
            return Image(uiImage: image)
        }

        return Image(systemName: illustration.fallbackSystemImage)
        #else
        #if SWIFT_PACKAGE
        return Image(illustration.rawValue, bundle: .module)
        #else
        return Image(illustration.rawValue)
        #endif
        #endif
    }
}

public struct DNNIllustratedHeader: View {
    let title: String
    let subtitle: String
    let illustration: DNNIllustration
    let tint: Color
    let imageWidth: CGFloat

    public init(
        title: String,
        subtitle: String,
        illustration: DNNIllustration,
        tint: Color = DNNColors.sage,
        imageWidth: CGFloat = 188
    ) {
        self.title = title
        self.subtitle = subtitle
        self.illustration = illustration
        self.tint = tint
        self.imageWidth = imageWidth
    }

    public var body: some View {
        DNNCard(cornerRadius: 34, padding: 0) {
            ZStack(alignment: .bottomTrailing) {
                RoundedRectangle(cornerRadius: 34, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.88), tint.opacity(0.12), DNNColors.honey.opacity(0.12)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                DNNIllustrationView(illustration)
                    .frame(width: imageWidth)
                    .offset(x: 18, y: 16)
                    .shadow(color: tint.opacity(0.16), radius: 18, x: 0, y: 10)

                LinearGradient(
                    colors: [DNNColors.surfaceStrong.opacity(0.96), DNNColors.surfaceStrong.opacity(0.78), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: 218)
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: 9) {
                    Text(title)
                        .font(.system(.largeTitle, design: .rounded).weight(.black))
                        .foregroundStyle(DNNColors.ink)
                        .lineLimit(3)
                        .minimumScaleFactor(0.78)

                    Text(subtitle)
                        .font(.system(.subheadline, design: .rounded).weight(.medium))
                        .foregroundStyle(DNNColors.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(width: 184, alignment: .leading)
                .padding(20)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .frame(height: 214)
            .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
        }
    }
}

public struct DNNCard<Content: View>: View {
    private let cornerRadius: CGFloat
    private let padding: CGFloat
    private let content: Content

    public init(cornerRadius: CGFloat = 28, padding: CGFloat = 18, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.content = content()
    }

    public var body: some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(DNNColors.surface)
                    .shadow(color: DNNColors.ink.opacity(0.07), radius: 24, x: 0, y: 14)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(Color.white.opacity(0.72), lineWidth: 1)
            )
    }
}

public struct PrimaryCapsuleButton: View {
    @Environment(\.isEnabled) private var isEnabled

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
                .font(.system(.headline, design: .rounded).weight(.bold))
                .foregroundStyle(isEnabled ? .white : DNNColors.muted)
                .frame(maxWidth: .infinity, minHeight: 52)
                .background(
                    LinearGradient(
                        colors: isEnabled ? [DNNColors.moss, DNNColors.sage] : [DNNColors.muted.opacity(0.56)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    in: Capsule()
                )
                .shadow(color: isEnabled ? DNNColors.sage.opacity(0.26) : .clear, radius: 16, x: 0, y: 8)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .opacity(isEnabled ? 1 : 0.64)
    }
}

struct DNNSectionHeader: View {
    let title: String
    let subtitle: String?

    init(_ title: String, subtitle: String? = nil) {
        self.title = title
        self.subtitle = subtitle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(.title3, design: .rounded).weight(.black))
                .foregroundStyle(DNNColors.ink)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(DNNColors.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct DNNMetricTile: View {
    let title: String
    let value: String
    let systemImage: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(tint)
                .frame(width: 30, height: 30)
                .background(tint.opacity(0.14), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.system(.title3, design: .rounded).weight(.black))
                    .foregroundStyle(DNNColors.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.76)
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(DNNColors.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(DNNColors.surfaceStrong.opacity(0.78), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(Color.white.opacity(0.7), lineWidth: 1)
        )
    }
}

struct DNNEmptyState: View {
    let title: String
    let message: String
    let systemImage: String

    var body: some View {
        DNNCard {
            HStack(spacing: 14) {
                Image(systemName: systemImage)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(DNNColors.sage)
                    .frame(width: 44, height: 44)
                    .background(DNNColors.sage.opacity(0.13), in: Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(DNNColors.ink)
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(DNNColors.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

public struct CompanionAvatar: View {
    public let mood: CompanionMood

    public init(mood: CompanionMood) {
        self.mood = mood
    }

    public var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 46, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [Color.white, DNNColors.honey.opacity(0.32), DNNColors.rose.opacity(0.20)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(alignment: .topTrailing) {
                    Circle()
                        .fill(DNNColors.lavender.opacity(0.24))
                        .frame(width: 42, height: 42)
                        .offset(x: 10, y: -8)
                }
                .overlay(alignment: .bottomLeading) {
                    Capsule()
                        .fill(DNNColors.sage.opacity(0.20))
                        .frame(width: 72, height: 20)
                        .rotationEffect(.degrees(-15))
                        .offset(x: -12, y: 10)
                }
                .shadow(color: DNNColors.amber.opacity(0.22), radius: 22, x: 0, y: 12)

            VStack(spacing: 20) {
                HStack(spacing: 28) {
                    Circle().fill(DNNColors.ink).frame(width: 11, height: 11)
                    Circle().fill(DNNColors.ink).frame(width: 11, height: 11)
                }

                Capsule()
                    .fill(mouthColor)
                    .frame(width: mood == .celebrating ? 42 : 30, height: 9)
            }
            .offset(y: 2)
        }
        .frame(width: 152, height: 132)
        .scaleEffect(mood == .celebrating ? 1.05 : 1)
        .rotationEffect(.degrees(mood == .happy ? -2 : 0))
        .animation(.spring(response: 0.36, dampingFraction: 0.68), value: mood)
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
