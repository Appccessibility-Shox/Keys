//
//  BlacklistView.swift
//  Keys-for-iPad-first-test
//
//  Created by Patrick Botros on 6/15/21.
//

import SwiftUI

let defaults = UserDefaults.init(suiteName: "group.L27L4K8SQU.shockerella")!


struct BlacklistView: View {
    @State var blacklistIsPresented = false
    @State var blockString: String = ""
    @State var fromDefaults: [String] = defaults.stringArray(forKey: "blacklist") ?? []
    @FocusState var focused: Field?

    var body: some View {
        ZStack {
            VStack {
                HStack {
                    Spacer()
                    Text("Blacklist")
                        .font(.largeTitle)
                        .bold()
                    Spacer()
                    Button(action: {
                        blacklistIsPresented = true;
                        focused = .blacklistPopup;
                    }) {
                        Image(systemName: "plus")
                            .padding(.trailing, 20)
                            .font(.largeTitle)
                    }
                }
                List {
                    ForEach(fromDefaults, id: \.self) { item in
                        Text(item)
                    }.onDelete(perform: delete)
                }.font(.title2)
            }.onAppear {
                fromDefaults = defaults.stringArray(forKey: "blacklist") ?? []
            }
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
                fromDefaults = newArray
            }
        }.background(Color("blackwhite"))
    }
    
    func delete(at offsets: IndexSet) {
        fromDefaults.remove(atOffsets: offsets)
        defaults.set(fromDefaults, forKey: "blacklist")
    }
}

extension Sequence where Iterator.Element: Hashable {
    func unique() -> [Iterator.Element] {
        var seen: Set<Iterator.Element> = []
        return filter { seen.insert($0).inserted }
    }
}


struct BlacklistView_Previews: PreviewProvider {
    static var previews: some View {
        BlacklistView().colorScheme(.dark)
    }
}
