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
        if windowController == nil {
            windowController = OnboardingWindowController.loadFromNib()
        }
        if UserDefaults.standard.bool(forKey: "didShowTutorial") {
            UserDefaults.standard.set(false, forKey: "didShowTutorial") // this causes it to alternate between showing and not showing. In the final version, remove this line.
        } else {
            // UserDefaults.standard.set(true, forKey: "didShowTutorial")
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
