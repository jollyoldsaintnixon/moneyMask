const targetDomainRegexList = [
    'fidelity.com',
    'robinhood.com',
].map(domain => new RegExp(`^https?://([a-zA-Z0-9-]+\.)?${escapeRegExp(domain)}`));

console.log('hey background.js');

function updateIcon(tab) {
    // test for a pattern match
    let iconFileBase;
    console.log("tab.url: ", tab.url)
    if (targetDomainRegexList.some((domainregex) => domainregex.test(tab.url))) {
        iconFileBase = "icons/banditMask" // match
    }
    else {
        iconFileBase = "icons/noMatch" // no match
    }

    // set icon
    chrome.action.setIcon({
        path: {
            '16': iconFileBase + "-16.png",
            '48': iconFileBase + "-48.png",
            '128': iconFileBase + "-128.png",
        },
        tabId: tab.id
    })
}

function handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      updateIcon(tab);
    }
}

function handleTabActivated(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      updateIcon(tab);
    });
  }

chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.tabs.onActivated.addListener(handleTabActivated);

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}