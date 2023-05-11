import WidgetController from "./WidgetController.js";
import { bindHandlers } from "./helpers.js";

export default class ContentScript
{
    WIDGET_MAP; // regex path => arrays of widget class names
    backgroundScriptPort; // connection to backgroundScript
    controller; // widget controller

    constructor(WIDGET_MAP = {})
    {
      // console.log("ContentScript constructor")
        bindHandlers(this);
        this.WIDGET_MAP = WIDGET_MAP;
    }

    init()
    {
      // console.log("ContentScript init")
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
      // console.log('doc loaded');
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
      // console.log('contentscript connectToBackgroundScript');
        // set up port
        this.backgroundScriptPort = chrome.runtime.connect({ name: "ContentScript" });
        this.backgroundScriptPort.onDisconnect.addListener(() => {
            // console.warn("background script disconnected");
        });
        // listen for messages from the background script. pass to controller when applicable
        this.backgroundScriptPort.onMessage.addListener(this.handleMessageFromBackgroundScript);

    }

    handleMessageFromBackgroundScript(message)
    {
      // console.log('in the contentscript handleMessageFromBackgroundScript', message);
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
      // console.log('in the contentscript setUpController', maskValue, isMaskOn);
        this.controller = new WidgetController(maskValue, isMaskOn, this.WIDGET_MAP);
        this.controller.loadWidgets(window.location.href);
    }

    static getInitialMaskValue()
    {
      // console.log('in the contentscript getInitialMaskValue'  )
        return chrome.storage.sync.get('maskValue').then(data => data.maskValue ?? 1);
    }

    static getInitialMaskActivated()
    {
      // console.log('in the contentscript getInitialMaskActivated');
        return chrome.storage.sync.get('isMaskOn').then(data => data.isMaskOn ?? true);
    }
}