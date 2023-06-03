// eslint-disable-next-line consistent-return
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'refreshPreferences') {
    browser.runtime.sendNativeMessage('application.id', { message: 'refreshPreferences' }, (response) => {
      sendResponse(response);
    });
    return true;
  } if (request.message === 'metaOpen') {
    browser.tabs.create({
      url: request.options.url,
      active: false,
    });
  }
});
