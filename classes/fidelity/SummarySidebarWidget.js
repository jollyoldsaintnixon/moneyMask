import { 
    toDollars, 
    toGainDollars
} from "../helpers";
import WidgetBase from "../WidgetBase";

export default class SummarySidebarWidget extends WidgetBase 
{
    targetNodeSelector = '[class$="_acct-balance"] > span:nth-child(2)';
    targetCommonAncestorSelector = '.acct-selector__container';
    accountsTotalSelector = '.acct-selector__all-accounts > div:nth-child(2) > span:nth-child(2)';
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
    }

    /**
     * We work backwards with the group totals- we query all that have the matching class, and then
     * we determine how many targetNodes are in each group.
     */
    maskGroupTotalValues()
    {
        console.log("summaryWidget maskGroupTotalValues");
        const groupTotalNodes = this.getGroupTotalNodes();
        // make clones
        WidgetBase.makeClones(groupTotalNodes);
        // subfunction to get common ancestor of targetNode and groupTotalNode
        const getCommonGroupAncestor = (node) =>
        {
            let ancestor = node;
            for (let i=0; i<10; i++)
            {
                if (!ancestor.parentElement)
                {
                    return ancestor; // was not able to climb to common ancestor
                }
                ancestor = ancestor.parentElement;
            }
            console.log("ancestor:", ancestor);
            return ancestor;
        }
        // loop through each group total node
        for (const groupTotalNode of groupTotalNodes)
        {
            // let groupTotal = null;
            const commonGroupAncestor = getCommonGroupAncestor(groupTotalNode);
            if (commonGroupAncestor)
            {
                const groupTotal = commonGroupAncestor.querySelectorAll(this.targetNodeSelector).length * this.maskValue;
                WidgetBase.maskUp(groupTotalNode, toDollars(groupTotal));
            }
            // this.saveValue(groupTotalNode, groupTotal);
            // groupTotalNode.textContent = toDollars(groupTotal);
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
        const proportion = this.makeProportions(targetNode.textContent, gainNode.textContent);
        // this.saveValue(gainNode, proportion);
        WidgetBase.makeClones(gainNode);
        WidgetBase.maskUp(gainNode, toGainDollars(proportion));
        // gainNode.textContent = toGainDollars(proportion);
    }

    /**
     * Mask the total value for all accounts. save original value first.
     * Makes sure you don't save a masked value as the original value
     * @param {float} total
     */ 
    maskAccountsTotalValue()
    {
        console.log("summaryWidget maskAccountsTotalValue")
        const total = this.getTargetNodes().length * this.maskValue;

        // if (!this.secondaryEffectValuesSaved && this.getAccountsTotal().textContent !== total)
        // {
            // this.saveValue(this.getAccountsTotal(), total);
        // }
        WidgetBase.makeClones(this.getAccountsTotal());
        WidgetBase.maskUp(this.getAccountsTotal(), toDollars(total));
        // this.getAccountsTotal().textContent = toDollars(total); 
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
            this.accountsTotal = document.querySelector(this.accountsTotalSelector + WidgetBase.notCloneSelector);
        }
        return this.accountsTotal;
    }

    /**
     * Gets the "group total" node for a given account node.
     * @returns {NodeList}
     */
    getGroupTotalNodes()
    {
        return document.querySelectorAll(this.groupTotalNodesSelector + WidgetBase.notCloneSelector);;
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
        WidgetBase.unmask(gainNode);
    }

    resetAccountsTotalValue()
    {
        console.log("summaryWidget resetAccountsTotalValue");
        WidgetBase.unmask(this.getAccountsTotal());
    }

    resetGroupTotalValues()
    {
        console.log("summaryWidget resetGroupTotalValues");
        const groupTotalNodes = this.getGroupTotalNodes();
        for (const groupTotalNode of groupTotalNodes)
        {
            WidgetBase.unmask(groupTotalNode);
        }
    }
}