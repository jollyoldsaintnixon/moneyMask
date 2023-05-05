import { 
    stripToNumber,
    toDollars,
 } from "../helpers";
import WidgetBase from "../WidgetBase";

/**
 * This is a panel widget that shows how much the user can contribute to their IRA.
 */
export default class PanelIraWidget extends WidgetBase
{
    targetNodeSelector = '.contribution__item__progress__data > span:nth-child(2)';
    targetCommonAncestorSelector = 'ira-contribution'; // custom element (not a class)
    remainderSelector = '.contribution__item__year > span:nth-child(2)'; // the amount you can still contribute
    contributedSelector = '.contribution__item__progress__data > span:first-child'; // the amount you have contributed so far
    remainderNode = null;
    contributedNode = null;

    limitTweaked = false; // this is a flag to indicate whether we have already appened "limit" to the limit's cloned node

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.maskUpOrDownSwitch(); // I couldn't figure out how to call this in OnlySecondaryWidgetBase constructor. The value of catalystSelector was that of OnlySecondaryWidgetBase, not PanelTotalWidget. Weird.
    }

    /**
     * Determines the action to take based on the current mask state. Overwritten from
     * WidgetBase so that we can remove cents from the currency string.
     */
    maskUpOrDownSwitch()
    {
        if (this.isMaskOn)
        {
            WidgetBase.maskUp(this.getTargetNodes(), toDollars(this.maskValue, false) + " limit");
            this.maskSecondaryEffects();
        }
        else
        {
            WidgetBase.unmask(this.getTargetNodes());
            this.resetSecondaryEffects();
        }
    }

    /************************ MASKERS **********************/

    maskSecondaryEffects()
    {
        this.maskRemainder();
        this.maskContributed();
        if (!this.limitTweaked)
        {
            this.tweakMaskedLimit();
        }
    }

    maskRemainder()
    {
        const remainderNode = this.getRemainderNode();
        if (remainderNode)
        {
            WidgetBase.maskUp(remainderNode, toDollars(this.getRemainderValue(), false) + " left", false);
        }
    }

    maskContributed()
    {
        const contributedNode = this.getContributedNode();
        if (contributedNode)
        {
            WidgetBase.maskUp(contributedNode, toDollars(this.maskValue - this.getRemainderValue(), false) + " contributed") // we do maskValue minus whatever is set for the remainder node so that it always adds to the limit value
        }
    }

    /**
     * Adds "limit" to the limit node clone. Should only happen once.
     */
    tweakMaskedLimit()
    {
        const limitNode = this.getLimitNode();
        if (limitNode)
        {
            limitNode.nextSibling.textContent += " limit";
            this.limitTweaked = true; // set the flag so that we don't do this again
        }
    }

    /************************ RESETTERS **********************/

    resetSecondaryEffects()
    {
        this.resetRemainder();
        this.resetContributed();
    }

    resetRemainder()
    {
        const remainderNode = this.getRemainderNode();
        if (remainderNode)
        {
            WidgetBase.unmask(remainderNode);
        }
    }

    resetContributed()
    {
        const contributedNode = this.getContributedNode();
        if (contributedNode)
        {
            WidgetBase.unmask(contributedNode);
        }
    }

    /************************ GETTERS **********************/

    getRemainderNode()
    {
        this.remainderNode = this.remainderNode || document.querySelector(this.remainderSelector + WidgetBase.notCloneSelector);
        return this.remainderNode;
    }

    getContributedNode()
    {
        this.contributedNode = this.contributedNode || document.querySelector(this.contributedSelector + WidgetBase.notCloneSelector);
        return this.contributedNode;
    }

    getLimitNode()
    {
        return this.getTargetNodes()[0]; // the limit node is the target node
    }

    getRemainderValue()
    {
        const remainderText = this.getRemainderNode().textContent;
        if (!this.isMaskOn) // mask is down, simply returned the float value of the remainder text
        {
            return stripToNumber(remainderText);
        }
        // mask is up
        const limitText = this.getLimitNode().textContent;
        return this.getMaskedProportion(limitText, remainderText);
    }
}