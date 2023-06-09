import { 
    arrayToList,
    toDollars,
    toGainDollars
 } from "../../../helpers.js";
import WidgetBase from "../../../Base/WidgetBase.js";
import WatchesDistalAncestorTrait from "../../../Base/Traits/WatchesDistalAncestorTrait.js";

/**
 * This class represents the account balance tab within the portfolio
 */
export default class BalanceSheetWidget extends WidgetBase
{
    commonAncestorSelector = '.balances--table-container';
    accountTotalsSelector = '.balances--table-content:not(.balances--group-mode-total-border) > td:nth-child(2) > span:first-child';
    accountTotalNodes = arrayToList([]);
    accountGainSelector = '.balances--table-content:not(.balances--group-mode-total-border) > td:nth-child(3) > span:first-child';
    accountGainNodes = arrayToList([]);
    portfolioTotalSelector = '.balances--table-content.balances--group-mode-total-border > td:nth-child(2) > span:first-child';
    portfolioTotalNode = null;
    portfolioGainSelector = '.balances--table-content.balances--group-mode-total-border > td:nth-child(3) > span:first-child';
    portfolioGainNode = null;

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        ".page-content page-content--portfolio-summary"
        this.traits.push(new WatchesDistalAncestorTrait(this, ".page-content.page-content--portfolio-summary"));
        this.watchForCommonAncestor();
    }
    /************************ MASKERS ***********************/

    putMaskUp()
    {
        switch (this.determineViewType()) 
        {
            case "portfolio":
                this.maskPortfolioAccount();
                break;
            case "margin":
                this.maskMarginAccount();
                break;
            case "non-margin":
                this.maskNonMarginAccount();
                break;
            default:
                break;
        }
        // this.maskAccountTotals();
        // this.getAccountTotalNodes().forEach(totalNode => this.maskGains(totalNode)); // mask each account's gain
        // this.maskPortfolioTotal();
        // this.maskGains(this.getPortfolioTotalNode()); // mask the portfolio gain too
    }

    maskPortfolioAccount()
    {
        this.maskAccountTotals();
        this.getAccountTotalNodes().forEach(totalNode => this.maskGains(totalNode)); // mask each account's gain
        this.maskPortfolioTotal();
        this.maskGains(this.getPortfolioTotalNode()); // mask the portfolio gain too
    }

    maskMarginAccount()
    {

    }

    maskNonMarginAccount()
    {

    }

    maskAccountTotals()
    {
        WidgetBase.maskUp(this.getAccountTotalNodes(), toDollars(this.maskValue));
    }

    maskGains(totalNode)
    {
        const gainNode = this.getGainNode(totalNode);
        if (!gainNode) return;
        let proportion = this.getMaskedProportion(totalNode.textContent, gainNode.textContent);
        proportion = isNaN(proportion) ? "0" : proportion;
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
        switch (this.determineViewType()) 
        {
            case "portfolio":
                this.resetPortfolioAccount();
                break;
            case "margin":
                this.resetMarginAccount();
                break;
            case "non-margin":
                this.resetNonMarginAccount();
                break;
            default:
                break;
        }
        // this.resetAccountTotals();
        // this.getAccountTotalNodes().forEach(totalNode => this.resetGain(totalNode)); 
        // this.resetPortfolioTotal();
        // this.resetGain(this.getPortfolioTotalNode()); // reset the portfolio gain too
    }

    resetPortfolioAccount()
    {
        this.resetAccountTotals();
        this.getAccountTotalNodes().forEach(totalNode => this.resetGain(totalNode)); // reset each account's gain
        this.resetPortfolioTotal();
        this.resetGain(this.getPortfolioTotalNode()); // reset the portfolio gain too
    }

    resetAccountTotals()
    {
        WidgetBase.unmask(this.getAccountTotalNodes());
    }

    resetGain(totalNode)
    {
        const gainNode = this.getGainNode(totalNode);
        if (!gainNode) return;
        WidgetBase.unmask(gainNode);
    }

    resetPortfolioTotal()
    {
        WidgetBase.unmask(this.getPortfolioTotalNode());
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
     * Get the gain/loss node for the given total node.
     * The gain node is the node with the daily gain/loss value.
     * 
     * @param {Node} totalNode 
     * @returns Node|null
     */
    getGainNode(totalNode)
    {
        let gainNode = null;
        try
        {
            gainNode = totalNode.parentElement.nextElementSibling.childNodes[1];
        }
        catch (error) 
        {
            return null;
        }
        return gainNode
    }

    getPortfolioTotalNode()
    {
        if (!WidgetBase.isConnected(this.portfolioTotalNode))
        {
            this.portfolioTotalNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.portfolioTotalSelector);
        }
        return this.portfolioTotalNode;
    }

    /************************ WATCHERS ***********************/

    activateWatchers()
    {
        this.watchForAccountTotals();
    }

    /**
     * Logic runs immediately if nodes already exist.
     * Watcher only starts if nodes do not already exist.
     * Watcher disconnects once nodes are found.
     */
    watchForAccountTotals()
    {
        const _onFoundLogic = () => {
            this.maskSwitch();
        }

        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.addedNodes.length && (mutation.type === 'childlist' || mutation.type === 'subtree'))
                && this.getAccountTotalNodes(mutation.addedNodes).length)
                {
                    _onFoundLogic();
                    this.tryDisconnect("accountTotals");
                    break;
                }
            }
        }

        if (this.getAccountTotalNodes().length) // account totals already exist, no need to watch for it
        {
            _onFoundLogic();
        }
        else // only activate watcher if nodes do not already exist
        {
            this.observers.accountTotals = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
        }
    }

    /******************** HELPERS **********************/

    /**
     * Determine whether the view type, ie the whole portfolio, a margin account, or a non-margin account.
     * I do this based off of a count of a semi-arbitrary node type that has a different count for each view type (so far as I can tell).
     * @returns {String} "portfolio", "margin", or "non-margin"
     */
    determineViewType()
    {
        const count = document.querySelectorAll('.balances--item-head-container').length;
        if (count === 0) return "portfolio";
        if (count < 20) return "non-margin";
        return "margin";
    }
}