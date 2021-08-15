//
//  ViewController.swift
//  Keys
//
//  Created by Patrick Botros on 10/21/19.
//  Copyright © 2019 Patrick Botros. All rights reserved.
//  swiftlint:disable force_cast

import Cocoa
import SafariServices.SFSafariApplication

let defaults = UserDefaults.init(suiteName: "group.L27L4K8SQU.shockerella")

class ViewController: NSViewController {

    @IBAction func reportPressed(_ sender: NSButton) {
        NSWorkspace.shared.open(NSURL(string: "https://github.com/patrickshox/Keys/issues")! as URL)
    }

    @IBOutlet var focusCheckbox: NSButton!

    @IBAction func focusCheckboxPressed(_ sender: Any) {
        if focusCheckbox!.state == .on {
            defaults?.set(true, forKey: "shouldStealFocus")
        } else {
            defaults?.set(false, forKey: "shouldStealFocus")
        }
    }

    @IBOutlet weak var modifierCheckbox: NSButton!

    @IBAction func modifierCheckboxPressed(_ sender: Any) {
        if modifierCheckbox!.state == .on {
            defaults?.set(true, forKey: "enableModifier")
        } else {
            defaults?.set(false, forKey: "enableModifier")
        }
    }

    override func viewDidAppear() {
        defaults!.register(defaults: ["activationKey": "G"])
        defaults!.register(defaults: ["shouldStealFocus": true])
        defaults!.register(defaults: ["enableModifier": false])
        // set the keycap's label and the label adjacent to the reset button to match the user's stored preference.
        customActivationKey.stringValue = defaults!.string(forKey: "activationKey")!
        secondaryLabelForCustomActivationKey.stringValue = customActivationKey.stringValue
        // set the checkboxes's states to match the user's stored preference.
        if (defaults?.bool(forKey: "shouldStealFocus"))! {
            focusCheckbox.state = .on
        } else {
            focusCheckbox.state = .off
        }
        if (defaults?.bool(forKey: "enableModifier"))! {
            modifierCheckbox.state = .on
        } else {
            modifierCheckbox.state = .off
        }
        // set modifier's text to match curren key.
        let localizedString = NSLocalizedString("enableModifier", comment: "")
        let interpolatedString = String(format: localizedString, customActivationKey.stringValue)
        modifierCheckbox.title = interpolatedString
        self.customActivationKey.focusRingType = NSFocusRingType.none
        self.view.window?.isMovableByWindowBackground = true
        customActivationKey.customizeCursorColor(NSColor.clear)
        customActivationKey.currentEditor()?.selectedRange = NSRange(location: 0, length: 0)
    }

    @IBOutlet weak var secondaryLabelForCustomActivationKey: NSTextField!

    @IBOutlet weak var customActivationKey: NSTextField!

    @IBAction func openSafariExtensionPreferences(_ sender: AnyObject?) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "shockerella.Keys.Extension") { error in
            if error != nil {
            }
        }
    }

    @IBAction func resetClicked(_ sender: Any) {
        customActivationKey.becomeFirstResponder()
        self.customActivationKey.selectAll(nil)
    }

    @IBAction func customizeBlacklist(_ sender: Any) {
        let blacklist: BlackListWindowController?
        blacklist = BlackListWindowController.loadFromNib()
        blacklist?.showWindow(self)
    }

}

extension String {
    var isAlphanumeric: Bool {
        return !isEmpty && range(of: "[^a-zA-Z0-9]", options: .regularExpression) == nil
    }
}

extension ViewController: NSTextFieldDelegate {
    func controlTextDidChange(_ obj: Notification) {
        var string = self.customActivationKey.stringValue
        let length = string.count
        if length > 0 && String(string.last!).isAlphanumeric {
            self.customActivationKey.stringValue = String(string.last!.uppercased())
        } else if length == 0 {
            self.customActivationKey.stringValue = "G"
        } else if String(string.first!).isAlphanumeric {
            self.customActivationKey.stringValue = string.first!.uppercased()
        } else {
            self.customActivationKey.stringValue = "G"
        }
        string = self.customActivationKey.stringValue
        secondaryLabelForCustomActivationKey.stringValue = string
        defaults!.set(string, forKey: "activationKey")
        // set modifier's text to match curren key.
        let localizedString = NSLocalizedString("enableModifier", comment: "")
        let interpolatedString = String(format: localizedString, customActivationKey.stringValue)
        modifierCheckbox.title = interpolatedString
        self.customActivationKey.moveToEndOfDocument(nil)
    }
}

extension NSTextField {
    public func customizeCursorColor(_ cursorColor: NSColor) {
        let fieldEditor = self.window?.fieldEditor(true, for: self) as! NSTextView
        fieldEditor.insertionPointColor = cursorColor
    }
}
