import WidgetController from "./WidgetController.js";
import { bindHandlers } from "./helpers.js";

export default class ContentScript
{
    WIDGET_MAP; // regex path => arrays of widget class names

    constructor(WIDGET_MAP = {})
    {
        bindHandlers(this);
        console.log("ContentScript constructor")
        this.WIDGET_MAP = WIDGET_MAP;
    }

    init()
    {
        if (document.readyState === 'loading') 
        {
            document.addEventListener('DOMContentLoaded', this.handleDocumentLoaded);
        } 
        else 
        {
            this.handleDocumentLoaded();
        }
    }

    async handleDocumentLoaded()
    {
        console.log('doc loaded');
        ContentScript.sendMessageToBackgroundScript(); // let the background script know that we are up and running (and can thus receive messages)
        const maskValue = await ContentScript.getInitialMaskValue();
        const isMaskOn = await ContentScript.getInitialMaskActivated();

        this.setUpController(maskValue, isMaskOn);
    }

    setUpController(maskValue, isMaskOn)
    {
        const controller = new WidgetController(maskValue, isMaskOn, this.WIDGET_MAP);
        // chrome.runtime.onMessage.addListener(message => {
        //     if (message.type === 'maskUpdate')
        //     {
        //         controller.updateMaskValue(message.value);
        //     }
        //     else if(message.type === 'pathUpdate')
        //     {
        //         controller.loadWidgets(message.value)
        //     }
        //     else if(message.type === "isMaskOn")
        //     {
        //         controller.updateMaskActivated(message.value);
        //     }
        // })
        controller.loadWidgets(window.location.href);
    }

    static getInitialMaskValue()
    {
        return chrome.storage.sync.get('maskValue').then(data => data.maskValue ?? 1);
    }

    static getInitialMaskActivated()
    {
        return chrome.storage.sync.get('isMaskOn').then(data => data.isMaskOn ?? true);
    }

    /**
     * Lets the background script know that this content script is ready to receive messages. 
     * Retries up to 5 times if the background script doesn't respond.
     * @param {int} retryCount = 0
     * ! Untested
     */
    static sendMessageToBackgroundScript(retryCount = 0) {
        // Send the "ready" message to the background script
        chrome.runtime.sendMessage({ type: 'contentScriptReady' }, (response) => {
            // If there's an error, no response, or the response doesn't have the expected property, retry
            if (chrome.runtime.lastError || !response || !response.acknowledged) 
            {
                if (retryCount < 5) 
                {
                    setTimeout(() => ContentScript.sendMessageToBackgroundScript(++retryCount), 500);
                } 
                else 
                {
                    console.warn('Failed to establish connection with background script after', maxRetries, 'attempts');
                }
            }
        });
    }
}