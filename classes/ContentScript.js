import WidgetController from "./WidgetController.js";
import { bindHandlers } from "./helpers.js";

export default class ContentScript
{
    WIDGET_MAP; // regex path => arrays of widget class names
    backgroundScriptPort; // connection to backgroundScript
    controller; // widget controller

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
        const maskValue = await ContentScript.getInitialMaskValue();
        const isMaskOn = await ContentScript.getInitialMaskActivated();

        this.setUpController(maskValue, isMaskOn);
        this.connectToBackgroundScript(); // instantiate port
    }

    /**
     * Establish a long-lived connection with the background script.
     */
    connectToBackgroundScript()
    {
        // let the background script know that we are up and running (and can thus receive messages)
        // ContentScript.sendMessageToBackgroundScript({ type: 'contentScriptReady' });
        // set up port
        this.backgroundScriptPort = chrome.runtime.connect({ name: "ContentScript" });
        this.backgroundScriptPort.onDisconnect.addListener(() => {
            console.warn("background script disconnected");
        });
        // listen for messages from the background script. pass to controller when applicable
        this.backgroundScriptPort.onMessage.addListener(this.handleMessageFromBackgroundScript);

    }

    handleMessageFromBackgroundScript(message)
    {
        console.log('in the contentscript handleMessageFromBackgroundScript');
        // ensure controller is set up
        if (!this.controller)
        {
            this.setUpController();
        }
        // handle message
        if (message.type === 'maskUpdate')
        {
            this.controller.updateMaskValue(message.value);
        }
        else if(message.type === 'historyUpdate')
        {
            this.controller.loadWidgets(message.value)
        }
        else if(message.type === "isMaskOn")
        {
            this.controller.updateMaskActivated(message.value);
        }
    }

    setUpController(maskValue, isMaskOn)
    {
        this.controller = new WidgetController(maskValue, isMaskOn, this.WIDGET_MAP);
        this.controller.loadWidgets(window.location.href);
    }

    static getInitialMaskValue()
    {
        return chrome.storage.sync.get('maskValue').then(data => data.maskValue ?? 1);
    }

    static getInitialMaskActivated()
    {
        return chrome.storage.sync.get('isMaskOn').then(data => data.isMaskOn ?? true);
    }

    // /**
    //  * Lets the background script know that this content script is ready to receive messages. 
    //  * Retries up to 5 times if the background script doesn't respond.
    //  * @param {int} retryCount = 0
    //  * ! Untested
    //  */
    // static sendReadyMessageToBackgroundScript() 
    // static sendReadyMessageToBackgroundScript(retryCount = 0) 
    // {
        // this.backgroundScriptPort.postMessage({ type: 'contentScriptReady' });
        // Send the "ready" message to the background script
        // chrome.runtime.sendMessage({ type: 'contentScriptReady' }, (response) => {
        //     // If there's an error, no response, or the response doesn't have the expected property, retry
        //     if (chrome.runtime.lastError || !response || !response.acknowledged) 
        //     {
        //         if (retryCount < 5) 
        //         {
        //             setTimeout(() => ContentScript.sendReadyMessageToBackgroundScript(++retryCount), 500);
        //         } 
        //         else 
        //         {
        //             console.warn('Failed to establish connection with background script after', maxRetries, 'attempts');
        //         }
        //     }
        // });
    // }

    // static sendMessageToBackgroundScript(message = {})
    // {
    //     this.backgroundScriptPort.postMessage(message);
    // }
}