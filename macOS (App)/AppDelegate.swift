//
//  AppDelegate.swift
//  Keys
//
//  Created by Patrick Botros on 10/21/19.
//  Copyright © 2019 Patrick Botros. All rights reserved.
//

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {

    var windowController: OnboardingWindowController?

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        if UserDefaults.standard.bool(forKey: "didShowTutorial") {
        } else {
            if windowController == nil {
                windowController = OnboardingWindowController.loadFromNib()
            }
            UserDefaults.standard.set(true, forKey: "didShowTutorial")
            windowController?.showWindow(self)
        }
    }

    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
