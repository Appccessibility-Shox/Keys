//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by Patrick Botros on 8/15/21.
//

import SafariServices
import SafariServices.SFSafariApplication
import os.log

let SFExtensionMessageKey = "message"

let defaults = UserDefaults.init(suiteName: "group.L27L4K8SQU.shockerella")

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {

        defaults!.register(defaults: ["activationKey": "G"])
        defaults!.register(defaults: ["shouldStealFocus": true])
        defaults!.register(defaults: ["enableModifier": false])
        defaults!.register(defaults: ["blacklist": [String]()])

        let defaultKey = defaults!.string(forKey: "activationKey")// ?? "G"
        let defaultPreferenceForFocusStealing = defaults?.bool(forKey: "shouldStealFocus") as Any
        let defaultPreferenceForEnablingModifierKey = defaults?.bool(forKey: "enableModifier") as Any
        let blacklist = (defaults?.array(forKey: "blacklist") as? [String])?.filter({!$0.isEmpty}) ?? [String]()
        let preferences = [
            "currentKey": defaultKey as Any,
            "shouldStealFocus": defaultPreferenceForFocusStealing,
            "enableModifier": defaultPreferenceForEnablingModifierKey,
            "blacklist": blacklist
        ]

        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message as! CVarArg)

        let response = NSExtensionItem()

        if let message = message as? [String: Any] {
            let messageName = message["message"] as! String
            if messageName == "refreshPreferences" {
                response.userInfo = [ SFExtensionMessageKey: [ "updatedPreferences": preferences ] ]
            }
        }

        context.completeRequest(returningItems: [response], completionHandler: nil)
    }

}
