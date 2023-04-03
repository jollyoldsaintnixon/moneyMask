import { bindHandlers } from "./helpers";

/**
 * Controls which widgets are active on a given page and URL path.
 * Updates active widgets when maskValue, isMaskOn change.
 * Keeps track of which widgets are active 
 */
export default class WidgetController
{
    currentWidgets = {}; // widgetClass name => widget instance
    WIDGET_MAP = {}; // regex path => arrays of widget class names
    widgetSearcher;
    maskValue;
    isMaskOn;

    constructor(maskValue, isMaskOn, WIDGET_MAP = {})
    {
        console.log('in the controller constructor');
        this.maskValue = maskValue;
        this.WIDGET_MAP = WIDGET_MAP;
        this.isMaskOn = isMaskOn;
        
        bindHandlers(this);
        
        chrome.runtime.onMessage.addListener(this.handleMessage)
    }

    handleMessage(request, sender, sendResponse)
    {
        console.log('in the controller handleMessage');
        if (request.type === 'maskUpdate')
        {
            this.updateMaskValue(request.value);
        }
        else if(request.type === 'historyUpdate')
        {
            this.loadWidgets(request.value)
        }
        else if(request.type === "isMaskOn")
        {
            this.updateMaskActivated(request.value);
        }
    }

    /**
     * Tests the regex keys of WIDGET_MAP for a match with the input url. Then
     * instantiates the widgets that are active under that url.
     * 
     * @param {string} url 
     */
    loadWidgets(url)
    {
        console.log("loading widgets for url: ", url)
        // ? should I deactivate existing widgets here (would I want them running on an unmatched path?)
        this.deactivateWidgets();
        for (const regex in this.WIDGET_MAP) 
        {
            if (Object.hasOwnProperty.call(this.WIDGET_MAP, regex)) {
                if ((new RegExp(regex)).test(url))
                {
                    const upcomingWidgets = this.WIDGET_MAP[regex];
                    this.deactivateWidgets(upcomingWidgets);
                    this.activateWidgets(upcomingWidgets);
                    break;
                }
            }
        }
    }

    /**
     * Push maskValue updates to active widgets
     * @param {int} maskValue 
     */
    updateMaskValue(maskValue)
    {
        this.maskValue = maskValue; // update the value locally so we can pass it to any widgets that we create later
        // this.currentWidgets.forEach(widget => { // update all current widgets
        //     widget.updateMaskValue(maskValue);
        // })
        for (const widgetClass in this.currentWidgets)  // update all current widgets
        {
            if (Object.hasOwnProperty.call(this.currentWidgets, widgetClass)) 
            {
                this.currentWidgets[widgetClass].updateMaskValue(maskValue);
            }
        }
    }

    /**
     * Push isMaskOn updates to active widgets
     * @param {boolean} isMaskOn 
     */
    updateMaskActivated(isMaskOn)
    {
        this.isMaskOn = isMaskOn;
        // this.currentWidgets.forEach(widget => {
        //     widget.updateMaskActivated(isMaskOn);
        // })
        for (const widgetClass in this.currentWidgets)
        {
            if (Object.hasOwnProperty.call(this.currentWidgets, widgetClass)) 
            {
                this.currentWidgets[widgetClass].updateMaskActivated(isMaskOn);
            }
        }
    }

    /**
     * Deactivate widgets
     */
    deactivateWidgets(upcomingWidgets) // TODO: I need to consider not deactivate those that should remain active (ie whose targets are unaffected by the history change)
    {
        // this.currentWidgets.forEach(widget => widget.deactivate()); // shut down event listeners
        // this.currentWidgets = [];
        for (const widgetClass in this.currentWidgets) 
        {
            if (Object.hasOwnProperty.call(this.currentWidgets, widgetClass)
            && upcomingWidgets.none(widget => { // don't deactivate widgets that are still active 
                return widget.name == widgetClass;
            })) 
            {
                this.currentWidgets[widgetClass].deactivate();
                delete this.currentWidgets[widgetClass]; // only delete those that are no longer active
            }
        }

    }

    /**
     * Pass in an array of class names (from the WIDGET_MAP). Activates each with current maskValue.
     * 
     * @param {array} widgetClassArr 
     */
    activateWidgets(widgetClassArr)
    {
        widgetClassArr.forEach(widgetClass => {
            // this.currentWidgets.push(new widgetClass(this.maskValue, this.isMaskOn))
            // only make a new instance if it isn't already running
            if (!this.currentWidgets[widgetClass])
            {
                this.currentWidgets[widgetClass.name] = new widgetClass(this.maskValue, this.isMaskOn);
            }
        });
        // widgetClassArr.forEach(widgetClass => {
        //     this.activateWidgets[widgetClass.name] = new widgetClass(this.maskValue);
        // }); 
        // this.widgetSearcher.activateSearchingObserver(this.currentWidgets)
    }
}