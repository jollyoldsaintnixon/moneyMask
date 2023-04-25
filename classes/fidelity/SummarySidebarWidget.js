import { toDollars } from "../helpers";
import WidgetBase from "../WidgetBase";

"acct-selector__all-accounts-balance" // total for all accounts
"acct-selector__acct-balance" // specific account, it's a div and the actual balance is the second span

export default class SummarySidebarWidget extends WidgetBase 
{
    targetedNodesSelector = '[class$="_acct-balance"] > span:nth-child(2)';
    accountsTotalSelector = '[class$="acct-selector__balance-wrapper"] > span:nth-child(2)';
    accountsTotal = null; // node that has the total of totals. I memoize it since it is a single node and easy to track.
    groupTotalNodesSelector = '.acct-selector__group-balance'; // each "group" of accounts (ie retirement, custodial, etc) has a total

    /**
     * Updates the "gain" node for each account (the gain/loss for the day).
     * Updates the sum value of all accounts.
     * ? is this ever called when the mask is down? if not, we can calculate the total much more easily.
     */
    maskSecondaryEffects()
    {
        console.log('summaryWidget maskSecondaryEffects')
        for (const node of this.targetNodeList)
        {
            this.maskGainNodeValue(node);
        }
        // mask total for all accounts
        this.maskAccountsTotalValue();
        // mask group total for all accounts
        this.maskGroupTotalValues();
        // confirm that the secondary effects have been saved
        if (!this.secondaryEffectValuesSaved)
        {
            this.secondaryEffectValuesSaved = true;
        }
    }

    /**
     * We work backwards with the group totals- we query all that have the matching class, and then
     * we determine how many targetNodes are in each group.
     */
    maskGroupTotalValues()
    {
        console.log("summaryWidget maskGroupTotalValues");
        const groupTotalNodes = this.getGroupTotalNodes();
        // subfunction to get common ancestor of targetNode and groupTotalNode
        const getCommonAncestor = (node) =>
        {
            let ancestor = node;
            for (let i=0; i<10; i++)
            {
                if (!ancestor.parentElement)
                {
                    return null; // was not able to climb to common ancestor
                }
                ancestor = ancestor.parentElement;
            }
            console.log("ancestor:", ancestor);
            return ancestor;
        }
        // loop through each group total node
        for (const groupTotalNode of groupTotalNodes)
        {
            let groupTotal = null;
            const commonAncestor = getCommonAncestor(groupTotalNode);
            if (commonAncestor)
            {
                // groupTotal = toDollars(commonAncestor.querySelectorAll(this.targetedNodesSelector).length * this.maskValue);
                groupTotal = commonAncestor.querySelectorAll(this.targetedNodesSelector).length * this.maskValue;
            }
            // check if first run through
            if (!this.secondaryEffectValuesSaved)
            {
                this.saveValue(groupTotalNode, groupTotal);
            }
            groupTotalNode.textContent = toDollars(groupTotal);
        }
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
        if (!this.secondaryEffectValuesSaved)
        {
            this.saveValue(gainNode);
        }
        const originalNodeDollars = targetNode.dataset.originalValue;
        gainNode.textContent = this.makeProportions(originalNodeDollars, gainNode.textContent);
    }

    /**
     * Mask the total value for all accounts. save original value first.
     * Makes sure you don't save a masked value as the original value
     * @param {float} total
     */ 
    maskAccountsTotalValue()
    {
        console.log("summaryWidget maskAccountsTotalValue")
        const total = this.targetNodeList.length * this.maskValue;

        if (!this.secondaryEffectValuesSaved && this.getAccountsTotal().textContent !== total)
        {
            this.saveValue(this.getAccountsTotal(), total);
        }
        this.getAccountsTotal().textContent = toDollars(total); 
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

    /**
     * Gets the "accounts total" node, that is the node that has the total of all accounts.
     * It is memoized as an instance variable since it is used frequently and is a specific node.
     * @returns {Node}
     */
    getAccountsTotal()
    {
        console.log("summaryWidget getAccountsTotal")
        if (!this.accountsTotal)
        {
            this.accountsTotal = document.querySelector(this.accountsTotalSelector);
        }
        return this.accountsTotal;
    }

    /**
     * Gets the "group total" node for a given account node.
     * @returns {NodeList}
     */
    getGroupTotalNodes()
    {
        return document.querySelectorAll(this.groupTotalNodesSelector);;
    }

    resetSecondaryEffects()
    {
        console.log("summaryWidget resetSecondaryEffects");
        for (const node of this.targetNodeList)
        {
            this.resetGainNodeValue(node);
        }
        this.resetAccountsTotalValue();
        this.resetGroupTotalValues();
    }

    resetGainNodeValue(node)
    {
        console.log("summaryWidget resetGainNodeValue", node)
        const gainNode = this.getGainNode(node);
        if (!gainNode) return;
        this.resetNodeValue(gainNode);
    }

    resetAccountsTotalValue()
    {
        console.log("summaryWidget resetAccountsTotalValue");
        this.resetNodeValue(this.getAccountsTotal());
    }

    resetGroupTotalValues()
    {
        console.log("summaryWidget resetGroupTotalValues");
        const groupTotalNodes = this.getGroupTotalNodes();
        for (const groupTotalNode of groupTotalNodes)
        {
            this.resetNodeValue(groupTotalNode);
        }
    }
}