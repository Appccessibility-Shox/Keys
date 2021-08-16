browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request.message);
    if (request.message === "refreshPreferences") {
        browser.runtime.sendNativeMessage("application.id", {message: "refreshPreferences"}, function(response) {
            console.log("Received sendNativeMessage response:");
            console.log(response);
            sendResponse(response)
        })
        return true
    }
    return true
    
    resolve();
});
