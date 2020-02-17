import Cocoa
import SafariServices.SFSafariApplication

let defaults = UserDefaults.init(suiteName: SharedUserDefaults.suiteName)

class ViewController: NSViewController {
    @IBOutlet var appNameLabel: NSTextField!
    @IBAction func reportPressed(_ sender: NSButton) {
        NSWorkspace.shared.open(NSURL(string: "https://github.com/patrickshox/Keys/issues")! as URL)
    }
    override func viewDidAppear() {
        defaults!.register(defaults: ["activationKey" : "G"])
        customActivationKey.stringValue = defaults!.string(forKey: "activationKey")!
        secondaryLabelForCustomActivationKey.stringValue = customActivationKey.stringValue;
        self.customActivationKey.focusRingType = NSFocusRingType.none;
        customActivationKey.customizeCursorColor(NSColor.clear)
        customActivationKey.currentEditor()?.selectedRange = NSMakeRange(0, 0)
    }
    @IBOutlet weak var secondaryLabelForCustomActivationKey: NSTextField!
    @IBOutlet weak var customActivationKey: NSTextField!;
    @IBAction func openSafariExtensionPreferences(_ sender: AnyObject?) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "shockerella.Keys.Extension") { error in
            if let _ = error {
                // Insert code to inform the user that something went wrong.
            }
        }
    }
    @IBAction func resetClicked(_ sender: Any) {
        customActivationKey.becomeFirstResponder()
        self.customActivationKey.selectAll(nil)
    }
}

extension String {
    var isAlphanumeric: Bool {
        return !isEmpty && range(of: "[^a-zA-Z0-9]", options: .regularExpression) == nil
    }
}

extension ViewController: NSTextFieldDelegate {
    func controlTextDidChange(_ obj: Notification) {
        if (self.customActivationKey.stringValue.count > 0 && String(self.customActivationKey.stringValue.last!).isAlphanumeric) {
            self.customActivationKey.stringValue = String(self.customActivationKey.stringValue.last!.uppercased())
        }
        else if (self.customActivationKey.stringValue.count == 0) {
            self.customActivationKey.stringValue = "G";
        }
        else if (String(self.customActivationKey.stringValue.first!).isAlphanumeric) {
            self.customActivationKey.stringValue = self.customActivationKey.stringValue.first!.uppercased()
        }
        else {
            self.customActivationKey.stringValue = "G"
        }
        secondaryLabelForCustomActivationKey.stringValue = self.customActivationKey.stringValue;
        defaults!.set(self.customActivationKey.stringValue, forKey: "activationKey");
        self.customActivationKey.moveToEndOfDocument(nil);
    }
}

extension NSTextField {
    public func customizeCursorColor(_ cursorColor: NSColor) {
        let fieldEditor = self.window?.fieldEditor(true, for: self) as! NSTextView
        fieldEditor.insertionPointColor = cursorColor
    }
}

