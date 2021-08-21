//
//  BlacklistPopupView.swift
//  BlacklistPopupView
//
//  Created by Patrick Botros on 8/17/21.
//

import SwiftUI

struct BlacklistPopupView: View {
    
    @Binding var isShown: Bool
    var title: String = "Type String to Block"
    @Binding var blockString: String
    var description = "If the hostname of a website contains any of the blocked strings, Keys will not function on that site."
    var onDone: ((String) -> Void)?
    
    var body: some View {
        VStack(spacing: 50) {
            Text(title)
                .font(.title)
                .bold()
            TextField("", text: $blockString)
                .keyboardType(.URL)
                .font(.title2)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            Text(description)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.leading)
            HStack {
                Button(action: {
                    isShown = false
                    blockString = ""
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
                    self.isShown = false
                    if let action = onDone {
                        action(blockString)
                    }
                    blockString = ""
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

struct BlacklistPopupView_Previews: PreviewProvider {
    static var previews: some View {
        BlacklistPopupView(isShown: .constant(true), blockString: .constant("googGle"))
    }
}

