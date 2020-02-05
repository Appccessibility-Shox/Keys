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

    class func loadFromNib() -> OnboardingWindowController {
        let vc = NSStoryboard(name: "Onboarding", bundle: nil).instantiateController(withIdentifier: "OnboardingWindowController") as! OnboardingWindowController
        return vc
    }

    override func windowDidLoad() {
        super.windowDidLoad()
    
        // Implement this method to handle any initialization after your window controller's window has been loaded from its nib file.
    }

}

class SecondaryViewController: NSViewController {
    @IBAction func didTapVideoTutorial(_ sender: Any) {
        NSWorkspace.shared.open(NSURL(string: "https://youtu.be/CQD_Lh503hI")! as URL)
    }
    
    @IBAction func openSafariExtensionPreferences(_ sender: Any) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "shockerella.Keys.Extension") { error in
            if let _ = error {
                // Insert code to inform the user that something went wrong.
            }
        }
        self.view.window!.performClose(nil)
    }
}
