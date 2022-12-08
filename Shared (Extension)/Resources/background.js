browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "refreshPreferences") {
        browser.runtime.sendNativeMessage("application.id", {message: "refreshPreferences"}, function(response) {
            sendResponse(response)
        })
        return true
    } else if (request.message == "metaOpen") {
        browser.tabs.create({
            url: request.options.url,
            active: false
        })
    }
});
