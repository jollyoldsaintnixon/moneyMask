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

    catalystSelector = 'body'; // selector for the catalyst node. * overwrite in subclass *
    catalystNode = null; // this is the node that is outside the scope of the widget but that drives the widget's secondary effects
    catalystObserver = null;

    maskUp()
    {
        console.log("OnlySecondaryWidgetBase maskUp");
    }

    maskDown()
    {
        console.log("OnlySecondaryWidgetBase maskDown");
    }

    activateTargetedObserver()
    {
        console.log("OnlySecondaryWidgetBase activateCatalystObserver");
        this.catalystNode = this.catalystNode ?? document.querySelectorAll(this.catalystSelector);
        this.maskSecondaryEffects();
        this.catalystObserver = WidgetBase.createObserver(this.catalystNode, this._targetedObserverCallback.bind(this))
    }

    _targetedObserverCallback(mutations)
    {
        console.log("OnlySecondaryWidgetBase targetedObserverCallback");
        for (const mutation of mutations)
        {
            if (mutation.type === 'characterData' || mutation.type === 'childList')
            {
                this.maskSecondaryEffects();
            }
        }
    }
}