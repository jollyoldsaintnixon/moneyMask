import { toDollars } from "../helpers";
import FidelityWidgetBase from "./FidelityWidgetBase";

"acct-selector__all-accounts-balance" // total for all accounts
"acct-selector__acct-balance" // specific account, it's a div and the actual balance is the second span

export default class SummarySidebarWidget extends FidelityWidgetBase 
{
    targetedNodesSelector = '[class$="_acct-balance"] > span:nth-child(2)';
    accountsTotalSelector = '[class$="acct-selector__balance-wrapper"] > span:nth-child(2)';
    accountsTotal = null; // node that has the total of totals. I memoize it since it is a single node and easy to track.
    groupTotalNodesSelector = '.acct-selector__group-balance'; // each "group" of accounts (ie retirement, custodial, etc) has a total
    // groupTotalNodes = null; // node list of group total nodes. I memoize it since it is easy to track.

    /**
     * Gets the "accounts total" node, that is the node that has the total of all accounts.
     * It is memoized as an instance variable since it is used frequently and is a specific node.
     * 
     * @returns {Node}
     */
    getAccountsTotal()
    {
        if (!this.accountsTotal)
        {
            this.accountsTotal = document.querySelector(this.accountsTotalSelector);
        }
        return this.accountsTotal;
    }

    /**
     * Gets the "group total" node for a given account node.
     * 
     * @returns {NodeList}
     */
    getGroupTotalNodes()
    {
        return document.querySelectorAll(this.groupTotalNodesSelector);
        // if (!this.groupTotalNodes)
        // {
            // this.groupTotalNodes = document.querySelectorAll(this.groupTotalNodesSelector);
        // }
        // return this.groupTotalNodes;
    }

    /**
     * Updates the "gain" node for each account (the gain/loss for the day).
     * Updates the sum value of all accounts.
     * ? is this ever called when the mask is down? if not, we can calculate the total much more easily.
     */
    maskSecondaryEffects()
    {
        // let total = 0;
        for (const node of this.targetNodeList)
        {
            // add up the total based on whether or not mask is up
            // total += this.isMaskOn ? parseFloat(this.maskValue) : this.dollarsToFloat(node.dataset.originalValue);
            // handle gain/loss for each account
            this.maskGainNodeValue(node);
        }
        // mask total for all accounts
        // this.maskAccountsTotalValue(total);
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
        // console.log("maskGroupTotalValues");
        const groupTotalNodes = this.getGroupTotalNodes(); // document.querySelectorAll(this.groupTotalNodesSelector);
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
            // check if first run through
            if (!this.secondaryEffectValuesSaved)
            {
                this.saveValue(groupTotalNode);
            }
            let groupTotal = null;
            const commonAncestor = getCommonAncestor(groupTotalNode);
            if (commonAncestor)
            {
                groupTotal = commonAncestor.querySelectorAll(this.targetedNodesSelector).length * this.maskValue;
            }
            groupTotalNode.textContent = toDollars(groupTotal);
        }
    }
    // maskGroupTotalNode(starterNode)
    // {
    //     const groupTotalNode = this.getGroupTotalNode(starterNode);
    //     if (!groupTotalNode) return;
    //     if (!this.secondaryEffectValuesSaved)
    //     {
    //         this.saveValue(groupTotalNode);
    //     }
    //     const originalNodeDollars = starterNode.dataset.originalValue;
    //     groupTotalNode.textContent = this.makeProportions(originalNodeDollars, groupTotalNode.textContent);
    // }

    // getGroupTotalNode(starterNode)
    // {
    //     let groupTotalNode = starterNode;
    //     // go up the tree to the common ancestor of the group total node
    //     for (let i=0; i<13; i++)
    //     {
    //         if (!groupTotalNode.parentElement)
    //         {
    //             return null; // was not able to climb to common ancestor
    //         }
    //         groupTotalNode = groupTotalNode.parentElement;
    //     }
    //     // go down the tree to the group total node
    //     groupTotalNode = groupTotalNode.querySelector('.acct-selector__group-balance');

    //     console.log("groupTotalNode:", groupTotalNode);
    //     // console.log("groupTotalNode.textContent:", groupTotalNode.textContent);
    //     return groupTotalNode;
    // }

    /**
     * Update the gain/loss value for each account.
     * @param {Node} targetNode 
     */
    maskGainNodeValue(targetNode)
    {
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
     * Mask the total value for all accounts. save original value first
     * @param {float} total
     */ 
    // maskAccountsTotalValue(total)
    maskAccountsTotalValue()
    {
        if (!this.secondaryEffectValuesSaved)
        {
            this.saveValue(this.getAccountsTotal());
        }
        const total = this.targetNodeList.length * this.maskValue;
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
        // console.log('widget getGainNode');
        let gainNode = null;
        try
        {
            gainNode = starterNode.parentElement.nextElementSibling.childNodes[1];
        }
        catch (error)
        {
            console.warn('did not find gain node');
        }
        return gainNode
    }

    // /**
    //  * (Async) Get the gain node for the given node.
    //  * Retries up to three times.
    //  * The gain node is the node with the daily gain/loss value.
    //  * 
    //  * @param {Node} targetNode 
    //  * @param {int} retryCount = 0
    //  * @returns {Promise} resolves to Node|null
    //  */
    // async getGainNode(targetNode, retryCount = 0)
    // {
    //     console.log("widget getGainNode");

    //     const promise = new Promise((resolve) => {
    //         const findGainNode = (targetNode, retryCount) => 
    //         {
    //             let gainNode;
    //             try 
    //             {
    //                 gainNode = targetNode.parentElement.nextElementSibling.childNodes[1];
    //                 resolve(gainNode);
    //             }
    //             catch (error)
    //             {
    //                 console.log('did not find gain node, retryCount = ' + retryCount);
    //                 if (retryCount < 3)
    //                 {
    //                     setTimeout(() => {
    //                         findGainNode(targetNode, ++retryCount);
    //                     }, 50);
    //                 }
    //                 else
    //                 {
    //                     console.warn('could not find gain node');
    //                     resolve(null);
    //                 }
    //             }
    //         }

    //         findGainNode(targetNode, retryCount);
    //     });

    //     const gainNode = await promise;
    //     return gainNode;
    // }

    resetSecondaryEffects()
    {
        for (const node of this.targetNodeList)
        {
            this.resetGainNodeValue(node);
        }
        this.resetAccountsTotalValue();
        this.resetGroupTotalValues();
    }

    resetGainNodeValue(node)
    {
        const gainNode = this.getGainNode(node);
        if (!gainNode) return;
        this.resetNodeValue(gainNode);
    }

    resetAccountsTotalValue()
    {
        this.resetNodeValue(this.getAccountsTotal());
    }

    resetGroupTotalValues()
    {
        console.log("resetGroupTotalValues");
        const groupTotalNodes = this.getGroupTotalNodes();
        for (const groupTotalNode of groupTotalNodes)
        {
            this.resetNodeValue(groupTotalNode);
        }
    }
}