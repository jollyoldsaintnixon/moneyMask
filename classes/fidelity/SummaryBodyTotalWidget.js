import { toDollars } from "../helpers";
import OnlySecondaryWidgetBase from "../OnlySecondaryWidgetBase";

export default class SummaryBodyTotalWidget extends OnlySecondaryWidgetBase 
{
    targetNodeSelector = '.total-balance__value';
    targetCommonAncestorSelector = 'summary-panel'; // it is an element
    catalystSelector = '.acct-selector__all-accounts > div:nth-child(2) > span:nth-child(2)';
    gainNodeSelector = 'today-change-value > span:first-child';
    gainNode = null; // this will be the node that shows the total portfolio gain/loss for the day
    percentNodeSelector = 'today-change-value > span:nth-child(2)';
    // accountsTotalSelector = '.total-balance__value';
    // accountsTotalNode = null; // node that has the total of totals. I memoize it since it is a single node and easy to track.
    // groupTotalNodesSelector = '.acct-selector__group-balance'; // each "group" of accounts (ie retirement, custodial, etc) has a total

    /**
     * Updates the "gain" node for each account (the gain/loss for the day).
     * Updates the sum value of all accounts.
     * ? is this ever called when the mask is down? if not, we can calculate the total much more easily.
     */
    maskSecondaryEffects()
    {
        console.log('summaryBodyTotalWidget maskSecondaryEffects')
        this.maskPortfolioTotalNode();
        this.maskPorfolioTotalGainNode();
        // for (const node of this.targetNodeList)
        // {
        //     this.maskGainNodeValue(node);
        // }
        // // mask total for all accounts
        // this.maskAccountsTotalValue();
        // // mask group total for all accounts
        // this.maskGroupTotalValues();
    }

    /**
     * Matches this widget's portfolio total node text with that of the catalyst node.
     */
    maskPortfolioTotalNode()
    {
        const catalystText = this.getCatalystText();
        if (catalystText.length) // we found the catalyst node and it had text
        {
            for (const node of this.getTargetNodes(this.getCommonAncestorNode()))
            {
                node.textContent = catalystText;
            }
        }
    }

    /**
     * 
     */
    maskPorfolioTotalGainNode()
    {
        const gainNode = document
    }

    getCommonAncestorNode()
    {
        if (!this.targetCommonAncestorNode)
        {
            this.targetCommonAncestorNode = document.querySelectorAll(this.targetCommonAncestorSelector);
        }
        return this.targetCommonAncestorNode;
    }

    getGainNOde()
    {
        if (!this.gainNode)
        {
            this.gainNode = document.querySelectorAll(this.gainNodeSelector);
        }
        return this.gainNode;
    }

    /**
     * 
     * @returns {string} the text of the catalyst node or an empty string
     */
    getCatalystText()
    {
        const catalystNode = document.querySelector(this.catalystSelector); // requery this node each time since it can be nonexistent, removed, or reloaded
        if (catalystNode)
        {
            return catalystNode.textContent;
        }
        return "";
    }

    /**
     * Update the gain/loss value for each account.
     * @param {Node} targetNode 
     */
    maskGainNodeValue(targetNode)
    {
        console.log("summaryWidget maskGainNodeValue", targetNode)
        const gainNode = this.getGainNode(targetNode);
        // ensure that there is a gain node for this account
        if (!gainNode) return;
        const originalNodeDollars = targetNode.dataset.originalValue;
        const proportion = this.makeProportions(originalNodeDollars, gainNode.textContent);
        // if (!this.secondaryEffectValuesSaved)
        // {
            this.saveValue(gainNode, proportion);
        // }
        gainNode.textContent = toDollars(proportion);
    }

    /**
     * Get the gain/loss node for the given node.
     * The gain node is the node with the daily gain/loss value.
     * 
     * @param {Node} starterNode 
     * @returns Node|null
     */
    getGainNode(starterNode)
    {
        console.log('summaryWidget getGainNode', starterNode);
        let gainNode = null;
        try
        {
            gainNode = starterNode.parentElement.nextElementSibling.childNodes[1];
        }
        catch (error)
        {
            // console.warn('did not find gain node');
        }
        return gainNode
    }

    // resetSecondaryEffects()
    // {
    //     console.log("summaryWidget resetSecondaryEffects");
    //     for (const node of this.targetNodeList)
    //     {
    //         this.resetGainNodeValue(node);
    //     }
    //     this.resetAccountsTotalValue();
    //     this.resetGroupTotalValues();
    // }

    // resetGainNodeValue(node)
    // {
    //     console.log("summaryWidget resetGainNodeValue", node)
    //     const gainNode = this.getGainNode(node);
    //     if (!gainNode) return;
    //     this.resetNodeValue(gainNode);
    // }
}