const targetDomainRegexList = [
    'fidelity.com/',
    'robinhood.com/',
].map(domain => new RegExp(`^https?://([a-zA-Z0-9-]+\.)?${domain}/`));

console.log('hey background.js');

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      if (targetDomainRegexList.some((domainRegex) => domainRegex.test(tab.url))) {
        // Update the icon
        chrome.action.setIcon({
            path: {
              '16': "icons/banditMask.png",
              '48': "icons/banditMask.png",
              '128': "icons/banditMask.png",
            },
            tabId: tabId
          })
      } else {
        chrome.action.setIcon({
            path: {
              '16': "icons/noMatch.png",
              '48': "icons/noMatch.png",
              '128': "icons/noMatch.png",
            },
            tabId: tabId
          })
      }
    }
  });