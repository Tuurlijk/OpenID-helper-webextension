/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global browser, chrome, document, localStorage, tabId, changeInfo, tab, openTab, localize */

'use strict';
if (typeof browser === "undefined") {
    var browser = chrome;
}

function updateIcon(tabId) {
    browser.pageAction.setTitle({
        tabId: tabId,
        title: 'Login with OpenID'
    });
    browser.pageAction.setIcon({
        tabId: tabId,
        path: {
            '19': '/Resources/Icons/OpenId19.png',
            '38': '/Resources/Icons/OpenId38.png'
        }
    });
}

function isBlacklisted(blacklist, tab) {
    if (blacklist.length === 0) {
        return false;
    }
    return blacklist.some(function(domain) {
        let regex = new RegExp('https?:\/\/' + domain);
        return (tab.url.match(regex) !== null);
    });
}

function getSettings() {
    return {
        autoSubmit: localStorage.autoSubmit ? localStorage.autoSubmit === 'true' : false,
        elements: localStorage.elements ? JSON.parse(localStorage.elements) : [],
        blacklist: localStorage.blacklist ? JSON.parse(localStorage.blacklist) : [],
        openIdUrl: localStorage.openIdUrl ? localStorage.openIdUrl : ''
    };
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only react on a complete load of a http(s) page,
    // only then we're sure the content.js is loaded.
    if (changeInfo.status !== 'complete' || tab.url.indexOf('http') !== 0) {
        return;
    }

    let settings = getSettings();
    if (settings.elements.length === 0 || isBlacklisted(settings.blacklist, tab)) {
        return;
    }

    // Request the current status and update the icon accordingly
    browser.tabs.sendMessage(
        tabId,
        {
            cmd: 'getFirstMatchingElement',
            settings: settings
        },
        function(response) {
            if (response.status !== false) {
                browser.pageAction.show(tabId);
                updateIcon(tabId);
            }
        }
    );
});

browser.pageAction.onClicked.addListener(function(tab) {
    // Request the current status and update the icon accordingly
    browser.tabs.sendMessage(
        tab.id,
        {
            cmd: 'loginWithOpenId',
            settings: getSettings()
        }
    );
});
