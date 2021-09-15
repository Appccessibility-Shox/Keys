//
//  PreferencesView.swift
//  Keys-for-iPad-first-test
//
//  Created by Patrick Botros on 6/16/21.
//

import SwiftUI

struct PreferencesView: View {
    @State var activationKeyIsPresented = false
    @State var activationKey = defaults.string(forKey: "activationKey") ?? "G"

    var body: some View {
        HStack(alignment: .center) {
            Spacer()
            ZStack {
                VStack {
                    HStack {
                        Text("Preferences")
                            .font(.largeTitle)
                            .bold()
                    }
                    VStack(spacing: 50) {
                        HStack {
                            Text("Current Activation Key:")
                            Button(action: {
                                activationKeyIsPresented = true
                            }) {
                                Text(activationKey)
                                    .padding(10)
                                    .background(Color("othergray"))
                                .cornerRadius(5)
                            }
                        }.font(.title)
                        CheckboxView(text: "Take Focus on Page Load", subtext: "Some websites, like Google.com, take cursor focus on page load. \nToggling option prevents this, so you can use keys immediately.", defaultsName: "shouldStealFocus", checked: defaults.bool(forKey: "shouldStealFocus"))
                        CheckboxView(text: "Enable ⌘" + activationKey + " to open link in background tab.", defaultsName: "enableModifier", checked: defaults.bool(forKey: "enableModifier") )
                        /*
                        VStack {
                            Text("Primary Color:")
                                .font(.title)
                            HStack {
                                ColorView(color: Color.red)
                                ColorView(color: Color.orange)
                                ColorView(color: Color.yellow)
                                ColorView(color: Color.green)
                                ColorView(color: Color.blue)
                                ColorView(color: Color.purple)
                            }
                        }
                        
                        VStack {
                            Text("Secondary Color:")
                                .font(.title)
                            HStack {
                                ColorView(color: Color.red)
                                ColorView(color: Color.orange)
                                ColorView(color: Color.yellow)
                                ColorView(color: Color.green)
                                ColorView(color: Color.blue)
                                ColorView(color: Color.purple)
                            }
                        }
                         */
                        
                    }.padding(.vertical, 80)
                    Spacer()
                }
                ActivationKeyPopupView(stringToUpdate: $activationKey, isShown: $activationKeyIsPresented, activationKey: defaults.string(forKey: "activationKey") ?? "G")
            }
            Spacer()
        }.background(Color(UIColor.systemBackground))
    }
}

struct CheckboxView: View {
    var text: String
    var subtext: String?
    var defaultsName: String
    @State var checked: Bool
    
    var body: some View {
        Button(action: {
            checked = defaults.bool(forKey: defaultsName)
            checked = !checked
            defaults.set(checked, forKey: defaultsName)
        }) {
            HStack {
                Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                    .font(.largeTitle)
                VStack(alignment: .leading) {
                    Text(text)
                        .font(.title)
                    if let subtext = subtext {
                        Text(subtext)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}

/*
struct ColorView: View {
    var color: Color
    var body: some View {
        Button(action: printHi, label: {
            Circle()
                .strokeBorder(Color("blackwhite"), lineWidth: 3)
                .background(Circle().fill(color))
                .frame(width: 70, height: 70, alignment: .center)
        })
    }
}
*/

struct PreferencesView_Previews: PreviewProvider {
    static var previews: some View {
        PreferencesView().colorScheme(.dark)
    }
}
