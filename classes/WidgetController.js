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
      // console.log('in the controller constructor');
        this.maskValue = maskValue;
        this.isMaskOn = isMaskOn;
        this.WIDGET_MAP = WIDGET_MAP;
    }

    /**
     * Tests the regex keys of WIDGET_MAP for a match with the input url. Then
     * instantiates the widgets that are active under that url. If the url does not
     * match, then all widgets are deactivated.
     * 
     * @param {string} url 
     */
    loadWidgets(url)
    {
      // console.log("loading widgets for url: ", url)
        let matchingUrlFound = false;
        for (const regex in this.WIDGET_MAP) 
        {
            if ((new RegExp(regex)).test(url))
            {
                matchingUrlFound = true;
                const upcomingWidgets = this.WIDGET_MAP[regex];
                this.deactivateWidgets(upcomingWidgets);
                this.activateWidgets(upcomingWidgets);
                break;
            }
        }
        if (!matchingUrlFound)
        {
            this.deactivateWidgets([]);
        }
    }

    /**
     * Push maskValue updates to active widgets
     * @param {int} maskValue 
     */
    updateMaskValue(maskValue)
    {
      // console.log("widgetController updating mask value to: ", maskValue)
        this.maskValue = maskValue; // update the value locally so we can pass it to any widgets that we create later
        for (const widgetClass in this.currentWidgets)  // update all current widgets
        {
            this.currentWidgets[widgetClass].updateMaskValue(maskValue);
        }
    }

    /**
     * Push isMaskOn updates to active widgets
     * @param {boolean} isMaskOn 
     */
    updateMaskActivated(isMaskOn)
    {
      // console.log("widgetController updating mask activated to: ", isMaskOn)
        this.isMaskOn = isMaskOn; // update the value locally so we can pass it to any widgets that we create later
        for (const widgetClass in this.currentWidgets)
        {
            this.currentWidgets[widgetClass].updateMaskActivated(isMaskOn);
        }
    }

    /**
     * Deactivate widgets
     * @param {array} upcomingWidgets
     */
    deactivateWidgets(upcomingWidgets)
    {
        upcomingWidgets = upcomingWidgets ?? []; // default to empty array
      // console.log("widgetController deactivating widgets. upcomingWidgets: ", upcomingWidgets, " currentWidgets: ", this.currentWidgets);
        for (const widgetClassName in this.currentWidgets) 
        {
            if (!upcomingWidgets.some(widget => { // don't deactivate widgets that are still active 
                return widget.name == widgetClassName;
            })) 
            {
                this.currentWidgets[widgetClassName].deactivate();
                delete this.currentWidgets[widgetClassName]; // only delete those that are no longer active
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
      // console.log("widgetController activating widgets: ", widgetClassArr);
        widgetClassArr.forEach(widgetClass => {
            // only make a new instance if it isn't already running
            if (!this.currentWidgets[widgetClass.name])
            {
                this.currentWidgets[widgetClass.name] = new widgetClass(this.maskValue, this.isMaskOn);
            }
        });
    }
}