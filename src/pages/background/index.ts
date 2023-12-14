import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

chrome.runtime.onInstalled.addListener(() => {
    console.log("installed");
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        sendResponse({farewell: "goodbye"});
    }
);