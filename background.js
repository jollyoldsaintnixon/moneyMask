
/**
 * Maintains state of isMaskOn and which content scripts are ready to receive messages
 */
export default class BackgroundScript
{
    static targetDomainRegexList = [ // domains that the extension runs on
        'fidelity.com',
        'robinhood.com',
    ].map(domain => new RegExp(`^https?://([a-zA-Z0-9-]+\.)?${escapeRegExp(domain)}`));

    isMaskOn = undefined; // will be a boolean
    contentScriptPorts = {}; // used for tracking which ports are connected to the background script
    currentIconPath = ""; // set when we update icon. so we don't update it unnecessarily

    constructor()
    {
        console.log('background script constructor');
        // bind "this" to the instance for all handlers. I can't import the helper function to the backbround script for some reason
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
        console.log('background script init');
        this.isMaskOn = await BackgroundScript.getIsMaskOn(); // get the current mask state initially. later update only when user does so
        console.log('isMaskOn', this.isMaskOn);
        const currentTab = await BackgroundScript.getCurrentTab();
        this.updateIcon(currentTab);
    }

    setUpListeners()
    {
        console.log('background script setUpListeners');
        chrome.runtime.onConnect.addListener(this.handlePortConnect); // fired when a connection is made from either an extension process or a content script (e.g. via runtime.connect)
        chrome.runtime.onMessage.addListener(this.handleMessage); // ready for content scripts
        chrome.tabs.onUpdated.addListener(this.handleTabUpdated); // fires when a tab is updated. The update can be due to various reasons, such as changes in the URL, page title, favicon, or other properties. The event provides information about the updated tab, including its ID, changeInfo (an object containing properties that have changed), and the tab object itself.
        chrome.webNavigation.onHistoryStateUpdated.addListener(this.handleOnHistoryStateUpdated); // fired when the URL is changed due to an AJAX-based navigation (i.e., when the URL is updated without a full page reload)
        chrome.tabs.onActivated.addListener(this.handleTabActivated); // fires when the tab gains focus
        chrome.webNavigation.onCompleted.addListener(this.handleFullPageLoad); // fired when a document, including the resources it refers to, is completely loaded and initialized
        chrome.storage.onChanged.addListener(this.handleStorageChange);
    }

    handlePortConnect(port)
    {
        console.log('background script handlePortConnect');
        if (port.name.endsWith('ContentScript'))
        {
            this.handleContentScriptPort(port);
        }
    }

    /**
     * For use with "chrome.runtime.sendMessage"
     * 
     * @param {*} request 
     * @param {*} sender 
     * @param {*} sendResponse 
     */
    handleMessage(request, sender, sendResponse)
    {
        console.log('background script handleMessage', request, sender, sendResponse);
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
        console.log('background script handleTabUpdated', tabId, changeInfo, tab);
        if (changeInfo.status === 'complete') 
        {
            this.updateIcon(tab);
        }
    }

    /**
     * Called when a tab is activated or when a full page load occurs. Updates the icon.
     * Informs content script if there has been a change in isMaskOn.
     * ? Is this an appropriate time to send the isMaskOn value?
     * 
     * @param {Object} activeInfo 
     */
    handleTabActivated(activeInfo) 
    {
        console.log('background script handleTabActivated', activeInfo);
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
        console.log('background script handleFullPageLoad', details);
        chrome.tabs.get(details.tabId, (tab) => {
            this.updateIcon(tab);
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
        console.log('background script handleStorageChange', changes, areaName);
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

    handleOnHistoryStateUpdated(details)
    {
        console.log('background script handleOnHistoryStateUpdated', details);
        this.urlUpdate(details.url);
    }

    async updateMaskValue(maskValue)
    {
        console.log('background script updateMaskValue', maskValue);
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
        console.log('background script updateIcon', tab);
        // test for a domain pattern match in the url
        const iconFileBase = BackgroundScript.isDomainSupported(tab.url) ?  "icons/banditMask" : "icons/noMatch";
        // check if mask is on
        const active = this.isMaskOn ? "Active" : "Inactive";
        const updatedIconPath = iconFileBase + active;
        // set icon if needed
        if (this.currentIconPath != updatedIconPath)
        {
            console.log('updating icon from ', this.currentIconPath, ' to ', updatedIconPath);
            chrome.action.setIcon({
                path: {
                    '16': updatedIconPath + "-16.png",
                    '48': updatedIconPath + "-48.png",
                    '128': updatedIconPath +  "-128.png",
                },
                tabId: tab.id
            });
        }
        this.currentIconPath = updatedIconPath;
    }

    /**
     * Change the icon when mask is activated/deactivated
     * @param {boolean} isMaskOn
     */
    async updateIsMaskOn(isMaskOn)
    {
        console.log('background script updateIsMaskOn', isMaskOn)
        // update our state
        this.isMaskOn = isMaskOn
        const tab = await BackgroundScript.getCurrentTab();
        // update the icon. technically this means we are querying the storage twice
        this.updateIcon(tab);
        // send message on to content script
        this.sendMessageToContentScript(tab.id, { type: 'isMaskOn', value: isMaskOn, });
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
        console.log('background script urlUpdate', url, tab);
        this.sendMessageToContentScript(tab.id, { type: 'historyUpdate', value: url, });
    }

    /**
     * Checks if the tab is ready to receive messages before sending
     * @param {int} tabId 
     * @param {Object} message: { {string} type, {*} value }
     */
    sendMessageToContentScript(tabId, message)
    {
        console.log('background script sendMessageToContentScript', tabId, message);
        const port = this.contentScriptPorts[tabId];
        if (!port) // !no port, so no content script. this may trigger on every tab without a content script; need to check on this
        {
            console.warn('No port for tab', tabId);
        }
        else
        {
            port.postMessage(message);
        }
    }

    /**
     * Set up content script port connection. 
     */
    handleContentScriptPort(port)
    {
        console.log('background script handleContentScriptPort', port);
        this.contentScriptPorts[port.sender.tab.id] = port;
        port.onDisconnect.addListener(() => {
            console.log(port.name + " disconnected at background script");
            delete this.contentScriptPorts[port.sender.tab.id]; // delete port
        });
        port.onMessage.addListener((message) => {
            // * just logging for now
            console.log("Message from " + port.type + " at background script", message);              
        });
    }

    /**
     * Checks if domain is supported
     * @param {string} url 
     * @returns {boolean}
     */
    static isDomainSupported(url)
    {
        console.log('background script isDomainSupported', url);
        return BackgroundScript.targetDomainRegexList.some(regex => regex.test(url));
    }

    static async getIsMaskOn()
    {
        console.log('background script getIsMaskOn');
        return new Promise((resolve) => {
            chrome.storage.sync.get('isMaskOn', function(data) 
            {
                resolve(data.isMaskOn);
            });
        });
    }

    static async getMaskValue()
    {
        console.log('background script getMaskValue');
        return new Promise((resolve) => {
            chrome.storage.sync.get('maskValue', function(data) 
            {
                resolve(data.maskValue);
            });
        });
    }

    static async getCurrentTab()
    {
        console.log('background script getCurrentTab');
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

if (typeof __TEST_ENV__ === 'undefined' || !__TEST_ENV__) // don't run this in test mode
{
    console.log("BACKGROUND SCRIPT WILL INIT")
    const backgroundScript = new BackgroundScript();
    backgroundScript.init();
}