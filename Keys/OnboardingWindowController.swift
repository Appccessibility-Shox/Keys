//
//  OnboardingWindowController.swift
//  Keys
//
//  Created by Patrick Botros on 2/4/20.
//  Copyright © 2020 Patrick Botros. All rights reserved.
//

import Cocoa
import SafariServices.SFSafariApplication

class OnboardingWindowController: NSWindowController {
    
    var preventsApplicationTerminationWhenModal: Bool { // ⭐️
        return false
    }
    
    class func loadFromNib() -> OnboardingWindowController {
        let vc = NSStoryboard(name: "Onboarding", bundle: nil).instantiateController(withIdentifier: "OnboardingWindowController") as! OnboardingWindowController
        return vc
    }
    
    func windowShouldClose(_ sender: Any) -> Bool { // ⭐️
        NSApplication.shared.terminate(self)
        return true
    }
    

    override func windowDidLoad() {
        super.windowDidLoad()
    }

}

class SecondaryViewController: NSViewController {
    
    var preventsApplicationTerminationWhenModal: Bool { // ⭐️
        return false
    }
    
    @IBAction func didTapVideoTutorial(_ sender: Any) {
        NSWorkspace.shared.open(NSURL(string: "https://youtu.be/CQD_Lh503hI")! as URL)
    }
    
    func windowShouldClose(_ sender: Any) -> Bool { // ⭐️
        NSApplication.shared.terminate(self)
        return true
    }

    @IBAction func openSafariExtensionPreferences(_ sender: Any) {
        self.view.window!.close() // ⭐️
        self.view.window!.performClose(nil) // ⭐️
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "shockerella.Keys.Extension") { error in
            if let _ = error {
                // Insert code to inform the user that something went wrong.
            }
        }
    }

}
