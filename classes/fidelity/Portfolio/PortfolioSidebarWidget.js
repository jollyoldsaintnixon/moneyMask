import { 
    arrayToList,
    toDollars, 
    toGainDollars,
} from "../../helpers";
import WidgetBase from "../../WidgetBase";

export default class PortfolioSidebarWidget extends WidgetBase 
{
    commonAncestorSelector = '.acct-selector__container';

    accountTotalsSelector = '[class$="_acct-balance"] > span:nth-child(2)';
    accountTotalNodes = arrayToList([]);
    portfolioTotalSelector = '.acct-selector__all-accounts > div:nth-child(2) > span:nth-child(2)';
    portfolioTotalNode = null; // node that has the total of totals. I memoize it since it is a single node and easy to track.
    groupTotalSelector = '.acct-selector__group-balance'; // each "group" of accounts (ie retirement, custodial, etc) has a total
    groupTotalNodes = arrayToList([]);
    groupAncestorDepth = 10; // how many levels up to look for the common ancestor.

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.watchForCommonAncestor();
    }
    /************************ MASKERS ***********************/

    /**
     * Converts the totals of each account total to the mask value.
     * Masks the "gain" node for each account (the gain/loss for the day).
     * Masks the group totals (ie retirement, custodial, etc).
     * Masks the sum value of all accounts (portfolio total).
     */
    putMaskUp()
    {
        if (!this.getAccountTotalNodes().length) return; // short-circuit if nodes not found
        this.maskAccountTotals();
        for (const accountTotalNode of this.getAccountTotalNodes())
        {
            this.maskGains(accountTotalNode);
        }
        this.maskGroupTotals();
        this.maskPortfolioTotal();
    }

    /**
     * Sets the value of the account total to be the mask value
     */
    maskAccountTotals()
    {
        WidgetBase.maskUp(this.getAccountTotalNodes(), toDollars(this.maskValue));
    }

    /**
     * Sets the value of the group total to be the mask value times how many accounts are in the group
     */
    maskGroupTotals()
    {
        const groupTotalNodes = this.getGroupTotalNodes();
        // subfunction to get common ancestor of targetNode and groupTotalNode
        const _getCommonGroupAncestor = (node) =>
        {
            let ancestor = node;
            for (let i=0; i<this.groupAncestorDepth; i++)
            {
                if (!ancestor.parentElement)
                {
                    return ancestor; // was not able to climb to common ancestor
                }
                ancestor = ancestor.parentElement;
            }
            return ancestor;
        }
        // loop through each group total node
        for (const groupTotalNode of groupTotalNodes)
        {
            const commonGroupAncestor = _getCommonGroupAncestor(groupTotalNode);
            if (commonGroupAncestor)
            {
                const groupTotal = WidgetBase.getNodes(commonGroupAncestor, this.accountTotalsSelector, true).length * this.maskValue;
                WidgetBase.maskUp(groupTotalNode, toDollars(groupTotal));
            }
        }
    }

    /**
     * Update the gain/loss value for each account.
     * @param {Node} accountTotalNode 
     */
    maskGains(accountTotalNode)
    {
        const gainNode = this.getGainNode(accountTotalNode);
        // ensure that there is a gain node for this account
        if (!gainNode) return;
        const proportion = this.getMaskedProportion(accountTotalNode.textContent, gainNode.textContent);
        WidgetBase.maskUp(gainNode, toGainDollars(proportion));
    }

    /**
     * Mask the total value for all accounts. save original value first.
     * Makes sure you don't save a masked value as the original value
     */ 
    maskPortfolioTotal()
    {
        const total = this.getAccountTotalNodes().length * this.maskValue;
        WidgetBase.maskUp(this.getPortfolioTotalNode(), toDollars(total));
    }

    /************************ RESETTERS ***********************/


    resetNodes()
    {
        if (!this.getAccountTotalNodes().length) return;
        this.resetAccountTotals();
        for (const accountTotalNode of this.getAccountTotalNodes())
        {
            this.resetGains(accountTotalNode);
        }
        this.resetPortfolioTotal();
        this.resetGroupTotals();
    }

    resetAccountTotals()
    {
        WidgetBase.unmask(this.getAccountTotalNodes());
    }

    resetGains(accountTotalNode)
    {
        const gainNode = this.getGainNode(accountTotalNode);
        if (!gainNode) return;
        WidgetBase.unmask(gainNode);
    }

    resetPortfolioTotal()
    {
        WidgetBase.unmask(this.getPortfolioTotalNode());
    }

    resetGroupTotals()
    {
        const groupTotalNodes = this.getGroupTotalNodes();
        for (const groupTotalNode of groupTotalNodes)
        {
            WidgetBase.unmask(groupTotalNode);
        }
    }

    /************************ GETTERS ***********************/

    /**
     * Returns a list matching the accountTotalsSelector
     * @param {Node|NodeList} parentNodes node(s) to search within, defaults to common ancestor
     * @returns NodeList
     */
    getAccountTotalNodes(parentNodes = this.getCommonAncestorNode())
    {
        if (!WidgetBase.isConnected(this.accountTotalNodes))
        {
            this.accountTotalNodes = WidgetBase.getNodes(parentNodes, this.accountTotalsSelector, true);
        }
        return this.accountTotalNodes;
    }

    /**
     * Get the gain/loss node for the given node.
     * The gain node is the node with the daily gain/loss value.
     * 
     * @param {Node} accountTotalNode 
     * @returns Node|null
     */
    getGainNode(accountTotalNode)
    {
        let gainNode = null;
        try
        {
            gainNode = accountTotalNode.parentElement.nextElementSibling.childNodes[1];
        }
        catch (error) 
        {
            return null;
        }
        return gainNode
    }

    /**
     * Gets the "accounts total" node, that is the node that has the total of all accounts.
     * It is memoized as an instance variable since it is used frequently and is a specific node.
     * @returns {Node}
     */
    getPortfolioTotalNode()
    {
        if (!WidgetBase.isConnected(this.portfolioTotalNode))
        {
            this.portfolioTotalNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.portfolioTotalSelector);
        }
        return this.portfolioTotalNode;
    }

    /**
     * Gets the "group total" node for a given account node.
     * @returns {NodeList}
     */
    getGroupTotalNodes()
    {
        if (!WidgetBase.isConnected(this.groupTotalNodes))
        {
            this.groupTotalNodes = WidgetBase.getNodes(this.getCommonAncestorNode(), this.groupTotalSelector, true);
        }
        return this.groupTotalNodes;
    }

    /************************ WATCHERS ***********************/

    activateWatchers()
    {
        this.watchForAccountTotals();
    }

    /**
     * Immediately calls logic if nodes exist. 
     * Watches for nodes regardless.
     * Does not disconnect
     */
    watchForAccountTotals()
    {
        const _onFoundLogic = () => {
            this.maskSwitch();
        }
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if (
                    ((mutation.addedNodes.length && (mutation.type === 'childlist' || mutation.type === 'subtree'))
                    && this.getAccountTotalNodes(mutation.addedNodes).length)
                ||
                    (mutation.type === 'characterData' 
                    && !WidgetBase.isConnected(this.accountTotalNodes) // accountTotalNodes were not connected
                    && this.getAccountTotalNodes().length // but they were found upon requery
                    )
                )
                { 
                    _onFoundLogic();
                }
            }
        } 
        if (this.getAccountTotalNodes().length) // account totals already exist, no need to watch for it
        { 
            _onFoundLogic();
        }
        const observerConfig = { ...WidgetBase.observerConfig, ...{ characterData: true }};
        this.observers.accountTotals = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic, false, 1, observerConfig);
    }


}