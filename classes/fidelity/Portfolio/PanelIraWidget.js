import { 
    stripToNumber,
    toDollars,
 } from "../../helpers";
import WidgetBase from "../../WidgetBase";

/**
 * This is a panel widget that shows how much the user can contribute to their IRA.
 */
export default class PanelIraWidget extends WidgetBase
{
    commonAncestorSelector = 'ira-contribution'; // custom element (not a class)
    maxLimitSelector = '.contribution__item__progress__data > span:nth-child(2)';
    remainderSelector = '.contribution__item__year > span:nth-child(2)'; // the amount you can still contribute
    contributedSelector = '.contribution__item__progress__data > span:first-child'; // the amount you have contributed so far
    maxLimitNode = null;
    remainderNode = null;
    contributedNode = null;

    limitTweaked = false; // this is a flag to indicate whether we have already appened "limit" to the limit's cloned node

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.watchForCommonAncestor();
    }

    /************************ MASKERS **********************/

    putMaskUp()
    {
        this.maskMaxLimit();
        this.maskRemainder();
        this.maskContributed();
        if (!this.limitTweaked)
        {
            this.tweakMaskedLimit();
        }
    }

    maskMaxLimit()
    {
        WidgetBase.maskUp(this.getMaxLimitNode(), toDollars(this.maskValue, false) + " limit");
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

    /************************ RESETTERS **********************/

    resetNodes()
    {
        this.resetMaxLimit();
        this.resetRemainder();
        this.resetContributed();
    }

    resetMaxLimit()
    {
        WidgetBase.unmask(this.getMaxLimitNode());
    }

    resetRemainder()
    {
        WidgetBase.unmask(this.getRemainderNode());
    }

    resetContributed()
    {
        WidgetBase.unmask(this.getContributedNode());
    }

    /************************ GETTERS **********************/

    getMaxLimitNode(parentNodes = this.getCommonAncestorNode())
    {
        if (!WidgetBase.isConnected(this.maxLimitNode))
        {
            this.maxLimitNode = WidgetBase.getNodes(parentNodes, this.maxLimitSelector);
        }
        return this.maxLimitNode;
    }

    getRemainderNode()
    {
        if (!WidgetBase.isConnected(this.remainderNode))
        {
            this.remainderNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.remainderSelector);
        }
        return this.remainderNode;
    }

    getContributedNode()
    {
        if (!WidgetBase.isConnected(this.contributedNode))
        {
            this.contributedNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.contributedSelector);
        }
        return this.contributedNode;
    }

    getRemainderValue()
    {
        const remainderText = this.getRemainderNode().textContent;
        if (!this.isMaskOn) // mask is down, simply returned the float value of the remainder text
        {
            return stripToNumber(remainderText);
        }
        // mask is up
        const limitText = this.getMaxLimitNode().textContent;
        return this.getMaskedProportion(limitText, remainderText);
    }

    /************************ WATCHERS **********************/

    activateWatchers()
    {
        this.watchForMaxLimit();
    }

    /**
     * Does not disconnect
     */ 
    watchForMaxLimit()
    {
        const _onFoundLogic = () => {
            this.maskSwitch();
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.type === 'childList' && mutation.addedNodes.length)
                    && this.getMaxLimitNode(mutation.addedNodes))
                {
                    _onFoundLogic();
                    break;
                }
            }
        };
        if (this.getMaxLimitNode())
        {
            _onFoundLogic();
        }
        this.observers.iraMaxLimit = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
    }

    /************************ HELPERS **********************/

    /**
     * Adds "limit" to the limit node clone. Should only happen once.
     */
    tweakMaskedLimit()
    {
        const limitNode = this.getMaxLimitNode();
        if (limitNode)
        {
            limitNode.nextSibling.textContent += " limit";
            this.limitTweaked = true; // set the flag so that we don't do this again
        }
    }
}