//
//  QuickActionsView.swift
//  Keys-for-iPad-first-test
//
//  Created by Patrick Botros on 6/14/21.
//

import SwiftUI
import WrappingHStack

enum Field: Hashable {
    case activationKeyPopup
    case blacklistPopup
}

struct DashboardView: View {
    @Environment(\.openURL) var openURL
    @State var dummy = ""
    @State var blacklistIsPresented = false
    @State var activationKeyIsPresented = false
    @State var blockString: String = ""
    @Binding var selectedView: Int?
    @FocusState var focused: Field?
    
    var body: some View {
        ZStack {
            VStack {
                Spacer()
                WrappingHStack(alignment: .center) {
                    QuickActionButton(color: Color("gray"), image: "xmark.octagon.fill", description: "Add string to URL blacklist") {
                        blacklistIsPresented = true;
                        focused = .blacklistPopup;
                    }
                    QuickActionButton(color: Color("gray"), image: "exclamationmark.bubble.fill", description: "Report an issue or suggest an improvement") {
                        openURL(URL(string: "https://github.com/patrickshox/Keys/issues")!)
                    }
                    QuickActionButton(color: Color("gray"), image: "gearshape.fill", description: "Enable Keys through Safari Settings") {
                        UIApplication.shared.open(URL.init(string: UIApplication.openSettingsURLString)!, options: [:], completionHandler: nil)
                    }
                    QuickActionButton(color: Color("gray"), image: "play.rectangle.fill", description: "Watch tutorial on YouTube") {
                        openURL(URL(string: "https://youtu.be/CQD_Lh503hI")!)
                    }
                    QuickActionButton(color: Color("gray"), image: "keyboard", description: "Reset activation key") {
                        activationKeyIsPresented = true;
                        focused = .activationKeyPopup;
                    }
                }.padding(.all, 30)
                
                Spacer()
            }
            .background(Color("blackwhite"))
            .edgesIgnoringSafeArea(.all)
            BlacklistPopupView(isShown: $blacklistIsPresented, blockString: $blockString, focused: $focused) { string in
                var newArray = [String]()
                if var currentBlacklist = defaults.stringArray(forKey: "blacklist") {
                    currentBlacklist += [string.lowercased()]
                    newArray = currentBlacklist
                } else {
                    newArray = [string.lowercased()]
                }
                newArray = newArray.unique()
                defaults.set(newArray, forKey: "blacklist")
            }
            ActivationKeyPopupView(stringToUpdate: $dummy, isShown: $activationKeyIsPresented, activationKey: defaults.string(forKey: "activationKey") ?? "G", focused: $focused)
        }
    }
}

struct QuickActionButton: View {
    var color: Color = Color.red
    var image: String
    var description: String
    var function: (() -> Void)? // after testing is done, the action of the button should not be optional as every button should do something.

    var body: some View {
        Button(action: {
            if let action = function {
                action()
            }
        }, label: {
            VStack {
                HStack {
                    Image(systemName: image)
                        .font(.largeTitle)
                    Spacer()
                }
                Spacer()
                HStack {
                    Text(description)
                        .font(.title2)
                        .bold()
                        .lineLimit(3)
                    Spacer()
                }
            }
            .frame(width: 270, height: 140, alignment: .center)
            .padding()
        }).background(color)
        .foregroundColor(.primary)
        .cornerRadius(20)
        .padding(.all, 5)
        .padding(.vertical, 3)
        .shadow(color: Color("shadow"), radius: 2)
    }
}

struct DashboardView_Preview: PreviewProvider {
    static var previews: some View {
        DashboardView(selectedView: .constant(1)).colorScheme(.dark)
    }
}
