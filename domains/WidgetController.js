// import WidgetSearcher from "./WidgetSearcher";

export default class WidgetController
{

    currentWidgets = [];
    WIDGET_MAP = {}; // regex path => arrays of widget class names
    widgetSearcher;
    maskValue;

    constructor(maskValue, WIDGET_MAP = {})
    {
        console.log('in the controller constructor');
        this.maskValue = maskValue;
        this.WIDGET_MAP = WIDGET_MAP;
        // this.widgetSearcher = new WidgetSearcher();
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
                    this.activateWidgets(this.WIDGET_MAP[regex]);
                    break;
                }
            }
        }
    }

    updateMaskValue(maskValue)
    {
        this.maskValue = maskValue; // update the value locally so we can pass it to any widgets that we create later
        this.currentWidgets.forEach(widget => { // update all current widgets
            widget.updateMaskValue(maskValue);
        })
    }

    /**
     * Deactivate widgets
     */
    deactivateWidgets() // TODO: I need to consider not deactivate those that should remain active (ie whose targets are unaffected by the history change)
    {
        this.currentWidgets.forEach(widget => widget.deactivate()); // shut down event listeners
        this.currentWidgets = [];
    }

    /**
     * Pass in an array of class names (from the WIDGET_MAP). Activates each with current maskValue.
     * 
     * @param {array} widgetClassArr 
     */
    activateWidgets(widgetClassArr)
    {
        widgetClassArr.forEach(widgetClass => {
            this.currentWidgets.push(new widgetClass(this.maskValue))
        });
        // widgetClassArr.forEach(widgetClass => {
        //     this.activateWidgets[widgetClass.name] = new widgetClass(this.maskValue);
        // }); 
        // this.widgetSearcher.activateSearchingObserver(this.currentWidgets)
    }
}