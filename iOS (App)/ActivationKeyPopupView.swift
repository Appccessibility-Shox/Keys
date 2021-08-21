//
//  ActivationKeyPopupView.swift
//  ActivationKeyPopupView
//
//  Created by Patrick Botros on 8/20/21.
//

import SwiftUI
import Combine

struct ActivationKeyPopupView: View {
    @Binding var stringToUpdate: String
    @Binding var isShown: Bool
    @State var activationKey: String
    var title: String = "Set the activation key"

    var description = "The activation key should be a single, case-insensitive character."
    var onDone: ((String) -> Void)?

    
    let textLimit = 3

    func limitText(_ upper: Int) {
        if activationKey.count > 1 {
            if String(activationKey.suffix(1)).isAlphanumeric {
                activationKey = String(activationKey.suffix(1)).uppercased()
            } else if String(activationKey.prefix(1)).isAlphanumeric {
                activationKey = String(activationKey.prefix(1)).uppercased()
            }
        } else if activationKey.count == 0 {
            activationKey = "G"
        }
    }
    
    var body: some View {
        VStack(spacing: 50) {
            Text(title)
                .font(.title)
                .bold()
            TextField("", text: $activationKey)
                .onReceive(Just(activationKey)) { _ in
                    limitText(textLimit)
                }
                .multilineTextAlignment(.center)
                .keyboardType(.alphabet)
                .font(.largeTitle)
                .textFieldStyle(PlainTextFieldStyle())
                .padding()
            Text(description)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.leading)
            HStack {
                Button(action: {
                    activationKey = ""
                    isShown = false
                }) {
                    Text("Cancel")
                        .foregroundColor(.white)
                        .padding()
                        .padding(.horizontal, 60)
                        .background(Color.gray)
                        .cornerRadius(10)
                }
                Spacer()
                Button(action: {
                    defaults.set(activationKey, forKey: "activationKey")
                    stringToUpdate = activationKey
                    self.isShown = false
                }) {
                    Text("Done")
                        .foregroundColor(.white)
                        .bold()
                        .padding()
                        .padding(.horizontal, 70)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
            }
        }
        .padding(30)
        .frame(width: 500, height: 400, alignment: .center)
        .background(Color("blackwhite"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .offset(y: isShown ? 0: UIScreen.main.bounds.height)
        .animation(.spring())
        .shadow(color: Color.black.opacity(0.3), radius: 5, x: 0, y: 3)
}
}

struct ActivationKeyPopupView_Previews: PreviewProvider {
    static var previews: some View {
        ActivationKeyPopupView(stringToUpdate: .constant("k"), isShown: .constant(true), activationKey: "A" )
    }
}

extension String {
    var isAlphanumeric: Bool {
        return !isEmpty && range(of: "[^a-zA-Z0-9]", options: .regularExpression) == nil
    }
}

