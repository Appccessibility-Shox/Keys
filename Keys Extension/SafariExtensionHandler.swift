//
//  SafariExtensionHandler.swift
//  Keys Extension
//
//  Created by Patrick Botros on 10/21/19.
//  Copyright © 2019 Patrick Botros. All rights reserved.
//

import SafariServices

let defaults = UserDefaults.init(suiteName: SharedUserDefaults.suiteName)

class SafariExtensionHandler: SFSafariExtensionHandler {
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").
        page.getPropertiesWithCompletionHandler { properties in
            NSLog("The extension received a message (\(messageName)) from a script injected into (\(String(describing: properties?.url))) with userInfo (\(userInfo ?? [:]))")
        }
        if (messageName == "pageLoaded") {
            page.dispatchMessageToScript(withName:"keyIsCurrently", userInfo: ["currentKey": defaults!.string(forKey: "activationKey") ?? "G"])
        }
    }
    
}
