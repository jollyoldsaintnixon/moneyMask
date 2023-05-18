/**
 * Controls which widgets are active on a given page and URL path.
 * Updates active widgets when maskValue, isMaskOn change.
 * Keeps track of which widgets are active 
 */
export default class WidgetController
{
    currentWidgets = {}; // widgetClass name => widget instance
    classToUrlMap = {}; // regex path => arrays of widget class names
    classConstructorMap = {}; // regex path => arrays of widget class names
    widgetSearcher;
    maskValue;
    isMaskOn;

    constructor(maskValue, isMaskOn, classToUrlMap = {}, classConstructorMap = {})
    {
      // console.log('in the controller constructor');
        this.maskValue = maskValue;
        this.isMaskOn = isMaskOn;
        this.classToUrlMap = classToUrlMap;
        this.classConstructorMap = classConstructorMap;
    }

    /**
     * Tests the regex values of classToUrlMap for a match with the input url. If there is a match, then the key for that regex is used to look up the corresponding class constructor in classConstructorMap. 
     * If the url does not match, then all widgets are deactivated.
     * 
     * @param {string} url 
     */
    loadWidgets(url)
    {
        let upcomingWidgets = [];
        for (const className in this.classToUrlMap) // run through all classes in the classToUrlMap
        {
            const regex = this.classToUrlMap[className];
            if (regex.test(url))
            {
                upcomingWidgets.push(this.classConstructorMap[className]); // push in the appropriate constructor by looking up the class obj from the class name in classConstructorMap (NB this avoids the use of eval)
            }
        }
        // if any upcoming widgets found, deactivate from the current widgets those not found in the upcoming widgets, then activate the new upcoming widgets.
        if (upcomingWidgets.length)
        {
            this.deactivateWidgets(upcomingWidgets);
            this.activateWidgets(upcomingWidgets);
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
     * Pass in an array of class names (from the classToUrlMap). Activates each with current maskValue.
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