import WidgetBase from "./WidgetBase";

/**
 * These kind of widgets only react to changes elsewhere on the page.
 */
export default class OnlySecondaryWidgetBase extends WidgetBase
{
    static observerConfig = {
        childList: true,
        subtree: true,
        characterData: true,
    }

    constructor(maskValue = 100, isMaskOn = false)
    {
        super(maskValue, isMaskOn);
        // this.maskUpOrDownSwitch();
    }

    catalystSelector = 'body'; // selector for the catalyst node. * overwrite in subclass *
    catalystNode = null; // this is the node that is outside the scope of the widget but that drives the widget's secondary effects
    catalystObserver = null;

    /**
     * Determines the action to take based on the current mask state.
     */
    maskUpOrDownSwitch()
    {
        if (this.isMaskOn)
        {
            // WidgetBase.makeClones(this.targetNodeList);
            this.maskSecondaryEffects();
        }
        else
        {
            this.resetSecondaryEffects();
        }
    }
}