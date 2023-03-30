
// (new BackgroundScript()).init();
// const backgroundScript = new BackgroundScript();
// backgroundScript.init();

/**
 * Maintains state of isMaskOn and which content scripts are ready to receive messages
 */
class BackgroundScript
{
    static targetDomainRegexList = [ // domains that the extension runs on
        'fidelity.com',
        'robinhood.com',
    ].map(domain => new RegExp(`^https?://([a-zA-Z0-9-]+\.)?${escapeRegExp(domain)}`));

    
    isMaskOn = undefined; // will be a boolean
    storedMessages = {}; // used for storing messages that are sent before the content script is ready to receive them
    readyContentScripts = new Set(); // used for tracking witch tabs are running content scripts that are ready to receive messages

    constructor()
    {
        // bind "this" to the instance for all handlers
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
        {
            if (typeof this[key] === 'function' && key !== 'constructor' && key.startsWith('handle'))
            {
                this[key] = this[key].bind(this);
            }
        }

        this.setUpListeners();
    }

    /**
     * Called immediately after instantiation (you can't use async in the constructor) 
    */
    async init()
    {
        console.log('init');
        this.isMaskOn = await BackgroundScript.getIsMaskOn(); // get the current mask state initially. later update only when user does so
        console.log('isMaskOn', this.isMaskOn);
    }

    setUpListeners()
    {
        console.log('setUpListeners');
        // chrome.runtime.onMessage.addListener(this.contentScriptReady); // ready for content scripts
        chrome.runtime.onMessage.addListener(this.handleMessage); // ready for content scripts
        chrome.tabs.onUpdated.addListener(this.handleTabUpdated); // fires when a tab is updated. The update can be due to various reasons, such as changes in the URL, page title, favicon, or other properties. The event provides information about the updated tab, including its ID, changeInfo (an object containing properties that have changed), and the tab object itself.
        chrome.webNavigation.onHistoryStateUpdated.addListener(details => urlUpdate(details.url)); // fired when the URL is changed due to an AJAX-based navigation (i.e., when the URL is updated without a full page reload)
        chrome.tabs.onActivated.addListener(this.handleTabActivated); // fires when the tab gains focus
        chrome.webNavigation.onCompleted.addListener(this.handleFullPageLoad); // fired when a document, including the resources it refers to, is completely loaded and initialized
        // chrome.runtime.onMessage.addListener(this.checkIsMaskOn)
        chrome.storage.onChanged.addListener(this.handleStorageChange);
    }

    handleMessage(request, sender, sendResponse)
    {
        // if (request.type === 'isMaskOn')
        // {
        //     this.checkIsMaskOn(request.value);
        // }
        // else 
        if (request.type === 'contentScriptReady')
        {
            this.contentScriptReady(request, sender, sendResponse);
        }
    }

    /**
     * Checks if icon should be updated.
     * Checks if content script should be deactivated
     * 
     * @param {int} tabId 
     * @param {*} changeInfo 
     * @param {*} tab 
     */
    handleTabUpdated(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete') 
        {
            this.updateIcon(tab);
        }
        this.checkContentScript(changeInfo.url, tabId);
    }

    /**
     * Called when a tab is activated or when a full page load occurs. Updates the icon.
     * Informs content script if there has been a change in isMaskOn.
     * ? Is this an appropriate time to send the isMaskOn value?
     * 
     * @param {Object} activeInfo 
     */
    handleTabActivated(activeInfo) {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          this.updateIcon(tab);
          this.sendMessageToContentScript(tab.id, { type: 'isMaskOn', value: this.isMaskOn, });
        });
    }

    /**
     * Called when there is a full page load. Updates the icon and checks
     * if the content script's id should be removed from the ready set.
     * @param {Object} details 
     */
    handleFullPageLoad(details) 
    {
        chrome.tabs.get(details.tabId, (tab) => {
            this.updateIcon(tab);
            this.checkContentScript(details.url, tab.id);
        });
    }

    /**
     * Fires whenever the store is updated
     * 
     * @param {*} changes 
     * @param {*} areaName 
     */
    handleStorageChange(changes, areaName)
    {
        if (areaName === 'sync')
        {
            if (changes.maskValue)
            {
                this.updateMaskValue(changes.maskValue.newValue)
            }
            else if (typeof changes.isMaskOn !== undefined) // it is possible for isMaskOn to be false
            {
                this.updateIsMaskOn(changes.isMaskOn.newValue)
            }
        }
    }

    async updateMaskValue(maskValue)
    {
        // send a message to the content script with the updated value
        const tab = await BackgroundScript.getCurrentTab();
        this.sendMessageToContentScript(tab.id, { type: 'maskUpdate', value: maskValue });
    }

    /**`
     * Update the icon to reflect wheter or not the user is on a page where the extension is
     * active and whether or not the mask is up (four total possibilities).
     * 
     * @param {*} tab 
     */
    updateIcon(tab) {
        // test for a domain pattern match in the url
        const iconFileBase = BackgroundScript.isDomainSupported(tab.url) ?  "icons/banditMask" : "icons/noMatch";
        // check if mask is on
        const active = this.isMaskOn ? "Active" : "Inactive";
        // set icon
        chrome.action.setIcon({
            path: {
                '16': iconFileBase + active + "-16.png",
                '48': iconFileBase + active + "-48.png",
                '128': iconFileBase + active +  "-128.png",
            },
            tabId: tab.id
        });
    }

    /**
     * Change the icon when mask is activated/deactivated
     * @param {boolean} isMaskOn
     */
    async updateIsMaskOn(isMaskOn)
    {
        // update our state
        this.isMaskOn = isMaskOn
        const tab = await BackgroundScript.getCurrentTab();
        // update the icon. technically this means we are querying the storage twice
        this.updateIcon(tab);
        // send message on to content script
        this.sendMessageToContentScript(tab.id, { type: 'isMaskOn', value: isMaskOn, });
    }


    /**
     * Checks if the content script tab's id should be removed from the ready set.
     * @param {string} url 
     * @param {int} tabId 
     */
    checkContentScript(url, tabId)
    {
        if (url && !BackgroundScript.isDomainSupported(url))
        {
            this.readyContentScripts.delete(tabId);
        }
    }

    /**
     * Send the updated url to the active content script.
     * 
     * @param {string} url
     * @param {Object} [tab] - Optional tab object from chrome.tabs
     */
    async urlUpdate(url, tab)
    {
        if (!tab)
        {
            tab = await BackgroundScript.getCurrentTab();
        }
        this.sendMessageToContentScript(tab.id, { type: 'historyUpdate', value: url, });
    }

    /**
     * Checks if the tab is ready to receive messages before sending
     * @param {int} tabId 
     * @param {{ bool active, bool currentWindow }} message 
     */
    sendMessageToContentScript(tabId, message)
    {
        if (this.readyContentScripts.has(tabId)) // content script is ready
        {
            console.log('Sending message to content script', message);
            chrome.tabs.sendMessage(tabId, message);
        }
        else // content script is not ready
        {
            console.warn('Content script not ready in tab', tabId);
            console.warn("Storing message", message);
            if (!this.storedMessages[tabId])
            {
                this.storedMessages[tabId] = [];
            }
            this.storedMessages[tabId].push(message);
        }
    }

    /**
     * When a content script signals that it is ready, add it's ID to the ready set
     * @param {*} request 
     * @param {*} sender 
     */
    contentScriptReady(request, sender, sendResponse) {
        const tabId = sender.tab.id;
        if (request.type === 'contentScriptReady')
        {
            // add the content script's tab's ID to the ready set
            this.readyContentScripts.add(tabId);
            // send ack
            sendResponse({ acknowledged: true });
            // send any stored messages for the content script
            if (this.storedMessages[tabId])
            {
                this.storedMessages[tabId].forEach(message => {
                    chrome.tabs.sendMessage(tabId, message);
                });
                this.storedMessages[tabId] = [];
            }
        }
    }
    /**
     * Checks if domain is supported
     * 
     * @param {string} url 
     * @returns {boolean}
     */
    static isDomainSupported(url)
    {
        return BackgroundScript.targetDomainRegexList.some(regex => regex.test(url));
    }

    static async getIsMaskOn()
    {
        return new Promise((resolve) => {
            chrome.storage.sync.get('isMaskOn', function(data) 
            {
                resolve(data.isMaskOn);
            });
        });
    }

    static async getMaskValue()
    {
        return new Promise((resolve) => {
            chrome.storage.sync.get('maskValue', function(data) 
            {
                resolve(data.maskValue);
            });
        });
    }

    static async getCurrentTab()
    {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true, }, (tabs) => {
                resolve(tabs[0]);
            });
        });
    }
}

/**
 * Helper function to make strings regex-safe       
 * @param {string} string 
 * @returns {string}
 */
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

(new BackgroundScript()).init();