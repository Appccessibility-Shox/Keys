//
//  ContentView.swift
//  Keys-for-iPad-first-test
//
//  Created by Patrick Botros on 6/11/21.
//

import SwiftUI

struct SidebarView: View {
    @State private var selectedView: Int? = 1
    var body: some View {
        List {
            NavigationLink("Dashboard", destination: DashboardView(selectedView: $selectedView), tag: 1, selection: $selectedView)
            NavigationLink("Preferences", destination: PreferencesView(), tag: 2, selection: $selectedView)
            NavigationLink("Blacklist", destination: BlacklistView())
        }
        .listStyle(SidebarListStyle())
        .navigationTitle("Keys")
    }
}

struct ContentView: View {
    var body: some View {
        NavigationView {
            SidebarView()
        }.navigationViewStyle(DoubleColumnNavigationViewStyle())
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView().colorScheme(.dark)
        ContentView().colorScheme(.light)
    }
}
