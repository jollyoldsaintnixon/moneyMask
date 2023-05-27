import { toGainDollars } from "../../../helpers.js";
import WidgetBase from "../../../Base/WidgetBase.js";
import PortfolioSidebarWidget from "../PortfolioSidebarWidget.js";

/**
 * This class is exactly like the PortfolioSidebarWidget class, except the nodes have different selectors
 */
export default class BalanceSidebarWidget extends PortfolioSidebarWidget
{
    commonAncestorSelector = '.account-selector--accounts-wrapper';
    accountTotalsSelector = '.account-selector--tab-row.account-selector--account-balance.js-acct-balance';
    portfolioTotalSelector = '.account-selector--tab-row.account-selector--all-accounts-balance.js-portfolio-balance'; // each "group" of accounts (ie retirement, custodial, etc) has a total
    gainNodeSelector = 'span.account-selector--tab-row.account-selector--account-todays-change.js-today-change-value'
    groupTotalSelector = '.account-selector--header-total';
    groupAncestorDepth = 2;

    /************************ MASKERS ***********************/

    /**
     * Update the gain/loss value for each account.
     * This was overwritten from parent because on this widget we actually want the gainNode's firstChild's text content, which is a text element, instead of the actual gain node's textContent (which includes another element). We had to modify the logic of WidgetBase.maskUp to make this work.
     * @param {Node} accountTotalNode 
     */
    maskGains(accountTotalNode)
    {
        const gainNode = this.getGainNode(accountTotalNode);
        // ensure that there is a gain node for this account
        if (!gainNode) return;
        WidgetBase.makeClones(gainNode); // make a clone if not done so already
        const clone = gainNode.nextSibling;
        if (!clone) return;
        const originalTextNode = gainNode.firstChild;
        if (!originalTextNode || !originalTextNode.textContent.trim()) return;
        const cloneTextNode = clone.firstChild; // the way this gain node is structured, we want to alter the text element child of the clone
        if (!cloneTextNode || !cloneTextNode.textContent.trim()) return;
        const proportion = this.getMaskedProportion(accountTotalNode.textContent, originalTextNode.textContent);
        cloneTextNode.textContent = toGainDollars(proportion);
        WidgetBase.hideNode(gainNode);
        WidgetBase.showNode(clone);
        // WidgetBase.maskUp(gainNode, toGainDollars(proportion));
    }

    /************************ RESETTERS ***********************/

    resetGains(accountTotalNode)
    {
        const gainNode = this.getGainNode(accountTotalNode);
        if (!gainNode) return;
        WidgetBase.unmask(gainNode);
    }

    /************************ GETTERS ***********************/

    /**
     * Get the gain/loss node for the given node.
     * The gain node is the node with the daily gain/loss value.
     * 
     * @param {Node} accountTotalNode 
     * @returns Node|null
     */
    getGainNode(accountTotalNode)
    {
        return WidgetBase.getNodes(accountTotalNode.parentNode, this.gainNodeSelector);
    }
}