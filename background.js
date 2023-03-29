console.log('hey background.js');
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.storage.onChanged.addListener(handleMaskValueChange);
chrome.webNavigation.onHistoryStateUpdated.addListener(details => urlUpdate(details.url));
chrome.runtime.onMessage.addListener(contentIsScriptReady);
chrome.runtime.onMessage.addListener(maskActivated)

const targetDomainRegexList = [ // domains that the extension runs on
    'fidelity.com',
    'robinhood.com',
].map(domain => new RegExp(`^https?://([a-zA-Z0-9-]+\.)?${escapeRegExp(domain)}`));

const tabsWithContentScript = new Set(); // used for tracking witch tabs are running content scripts that are ready to receive messages

/**
 * Update the icon to reflect wheter or not the user is on a page where the extension is
 * active
 * 
 * @param {*} tab 
 */
function updateIcon(tab) {
    // test for a domain pattern match in the url
    const iconFileBase = isDomainSupported(tab.url) ?  "icons/banditMask" : "icons/noMatch";
    // check if maksActivated is true
    chrome.storage.sync.get('maskActivated', function(data) 
    {
        const active = data.maskActivated ? "Active" : "Inactive";
        // set icon
        chrome.action.setIcon({
            path: {
                '16': iconFileBase + active + "-16.png",
                '48': iconFileBase + active + "-48.png",
                '128': iconFileBase + active +  "-128.png",
            },
            tabId: tab.id
        })
    });
}

/**
 * Checks if icon should be updated.
 * Checks if content script should be deactivated
 * 
 * @param {int} tabId 
 * @param {*} changeInfo 
 * @param {*} tab 
 */
function handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      updateIcon(tab);
    }
    if (changeInfo.url && !isDomainSupported(changeInfo.url))
    {
        tabsWithContentScript.delete(tabId);
    }
}

function handleTabActivated(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      updateIcon(tab);
    });
}

/**
 * Helper function to make strings regex-safe       
 * @param {string} string 
 * @returns {string}
 */
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Send a message to the active content script whenever the user changes the
 * maskValue.
 * 
 * @param {*} changes 
 * @param {*} areaName 
 */
function handleMaskValueChange(changes, areaName)
{
    if (changes.maskValue && areaName === "sync")
    {
        const maskValue = changes.maskValue.newValue;
        // send a message to the content script with the updated value
        chrome .tabs.query({ active: true, currentWindow: true, }, (tabs) => {
            sendMessageToContentScript(tabs[0].id, { type: 'maskUpdate', value: maskValue });
        })
    }
}

/**
 * When a content script signals that it is ready, add it's ID to the ready set
 * @param {*} request 
 * @param {*} sender 
 */
function contentIsScriptReady(request, sender) {
    if (request.type === 'contentScriptReady')
    {
        tabsWithContentScript.add(sender.tab.id);
    }
}

/**
 * Checks if the tab is ready to receive messages before sending
 * @param {int} tabId 
 * @param {{ bool active, bool currentWindow }} message 
 */
function sendMessageToContentScript(tabId, message)
{
    if (tabsWithContentScript.has(tabId))
    {
        chrome.tabs.sendMessage(tabId, message);
    }
    else
    {
        console.warn('Content script not ready in tab', tabId);
    }
}

/**
 * Send the updated url to the active content script.
 * 
 * @param {string} url 
 */
function urlUpdate(url)
{
    chrome.tabs.query({ active: true, currentWindow: true, }, (tabs) => {
        sendMessageToContentScript(tabs[0].id, { type: 'historyUpdate', value: url, })
        // chrome.tabs.sendMessage(tabs[0].id, { type: 'historyUpdate', value: url, });
    })
}

/**
 * Checks if domain is supported
 * 
 * @param {string} url 
 * @returns {boolean}
 */
function isDomainSupported(url)
{
    return targetDomainRegexList.some(regex => regex.test(url));
}

/**
 * Change the icon when mask is activated/deactivated
 */
function maskActivated(request, sender)
{
    // update the icon. technically this means we are querying the storage twice
    if (request.type === 'maskActivated')
    {
        console.log("HEHEHHEHEHEHEHHEHE")
        chrome.tabs.query({ active: true, currentWindow: true, }, (tabs) => {
            updateIcon(tabs[0]);
            sendMessageToContentScript(tabs[0].id, { type: 'maskActivated', value: request.value, })
        });
    }
}
