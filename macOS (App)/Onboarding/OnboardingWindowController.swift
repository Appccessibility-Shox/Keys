//
//  OnboardingWindowController.swift
//  Keys
//
//  Created by Patrick Botros on 2/4/20.
//  Copyright © 2020 Patrick Botros. All rights reserved.
//

import Cocoa
import SafariServices.SFSafariApplication

final class OnboardingWindowController: NSWindowController {
    class func loadFromNib() -> OnboardingWindowController {
        return (NSStoryboard(
            name: "Onboarding",
            bundle: nil
        ).instantiateController(withIdentifier: "OnboardingWindowController") as? OnboardingWindowController)!
    }
}

final class SecondaryViewController: NSViewController {
    /// Parent window controller
    weak var windowController: OnboardingWindowController?

    override func viewDidAppear() {
        self.view.window!.preventsApplicationTerminationWhenModal = false
    }

    @IBAction func didTapVideoTutorial(_ sender: Any) {
        NSWorkspace.shared.open(NSURL(string: "https://youtu.be/CQD_Lh503hI")! as URL)
    }

    override func viewWillAppear() {
        super.viewWillAppear()

        if let controller = view.window?.windowController as? OnboardingWindowController {
            windowController = controller
        }
    }

    @IBAction func openSafariExtensionPreferences(_ sender: Any) {
        windowController?.dismissController(self)
        windowController?.close()

        SFSafariApplication.showPreferencesForExtension(withIdentifier: "shockerella.Keys.Extension") { error in
            if error != nil {
                // Insert code to inform the user that something went wrong.
            }
        }
    }

    override func prepare(for segue: NSStoryboardSegue, sender: Any?) {
        if let destination = segue.destinationController as? SecondaryViewController {
            destination.windowController = windowController
            destination.preferredContentSize = NSMakeSize(self.view.frame.size.width, self.view.frame.size.height)
        }
    }
}
