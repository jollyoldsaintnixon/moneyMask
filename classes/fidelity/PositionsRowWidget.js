import OnlySecondaryWidgetBase from "../OnlySecondaryWidgetBase";
import WidgetBase from "../WidgetBase";
import { 
    stripToNumber, 
    toDollars,
    toGainDollars,
} from "../helpers";

/**
 * This class represents rows of securities found under the positions tab within the portfolio page.
 */
export default class PositionsRowWidget extends OnlySecondaryWidgetBase
{
    targetNodeSelector = ".ag-center-cols-container > div.ag-row:not(.ag-row-first)"; // this will return a series of security rows. Different nodes within each row will be masked based on the percent of the total account represented by each security.
    targetCommonAncestorSelector = ".ag-body-viewport"
    percentOfAccountSelector = ".posweb-cell-account_percent > div:first-child > span:first-child"; // this is the percent of the account represented by the security
    /*** Secondary selectors for each row ***/
    totalGainLossSelector = ".posweb-cell-total_gl_currency > div:first-child > span:first-child"; // this is the total gain/loss for the security
    todaysGainLossSelector = ".posweb-cell-today_gl_currency > div:first-child > span:first-child"; // this is the gain/loss for the security today
    currentValueSelector = ".posweb-cell-current_value > div:first-child > span:first-child"; // this is the current value of the security
    quantitySelector = ".posweb-cell-quantity > div:first-child > span:first-child"; // this is the quantity of the security
    costBasisTotalSelector = ".posweb-cell-cost_basis > div:first-child > span:first-child"; // this is the cost basis of the security

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.maskUpOrDownSwitch();
    }

    /******************** MASKERS **********************/

    maskSecondaryEffects()
    {
        for (const securityNode of this.getTargetNodes())
        {
            const percentOfAccount = this.getPercentOfAccount(securityNode);
            if (percentOfAccount > 0) // ensure the percent was found (it won't be on header rows)
            {
                this.getSecondaryNodesWithDollarFunc(securityNode).forEach(({ node, dollarFunc }) => {
                    if (node)
                    {
                        this.maskSecondaryNode(node, percentOfAccount, dollarFunc);
                    }
                });
            }
        }
    }

    /**
     * 
     * @param {Node} node 
     * @param {float} percentOfAccount 
     * @param {function} dollarFunc 
     */
    maskSecondaryNode(node, percentOfAccount, dollarFunc)
    {
        if (!isNaN(stripToNumber(node.textContent))) // sometimes rows don't have a number, such as with money markets. pass if so.
        {
            const maskedValue = dollarFunc(this.maskValue * percentOfAccount / 100);
            WidgetBase.maskUp(node, maskedValue);
        }
    }

    /******************** RESETTERS **********************/


    resetSecondaryEffects()
    {
        for (const securityNode of this.getTargetNodes())
        {
            this.getSecondaryNodesWithDollarFunc(securityNode).forEach(({ node }) => {
                WidgetBase.unmask(node);
            });
        }
    }

    /******************** GETTERS **********************/

    /**
     * Returns the percent of the total account represented by the security. If no percent is found, returns -1.
     * @param {Node} securityNode 
     * @returns {float|null}
     */
    getPercentOfAccount(securityNode)
    {
        const percentOfAccountNode = securityNode.querySelector(this.percentOfAccountSelector);
        if (percentOfAccountNode && percentOfAccountNode.textContent.length)
        {
            return stripToNumber(percentOfAccountNode.textContent);
        }
        else
        {
            return -1;
        }
    }

    /**
     * Returns an object containing the node and dollar function for each secondary node.
     * @param {Node} securityNode
     * @returns {Node[]} An array of nodes that are masked based on the percent of the total account represented by each security. 
     */
    getSecondaryNodesWithDollarFunc(securityNode)
    {
        const secondaryNodesWithDollarFuncs = [];
        secondaryNodesWithDollarFuncs.push({
            node: securityNode.querySelector(this.totalGainLossSelector),
            dollarFunc: toGainDollars,
        });
        secondaryNodesWithDollarFuncs.push({
            node: securityNode.querySelector(this.todaysGainLossSelector),
            dollarFunc: toGainDollars
        });
        secondaryNodesWithDollarFuncs.push({
            node: securityNode.querySelector(this.currentValueSelector),
            dollarFunc: toDollars,
        });
        secondaryNodesWithDollarFuncs.push({
            node: securityNode.querySelector(this.quantitySelector),
            dollarFunc: (value) => value, 
        });
        secondaryNodesWithDollarFuncs.push({
            node: securityNode.querySelector(this.costBasisTotalSelector),
            dollarFunc: toDollars
        });
        return secondaryNodesWithDollarFuncs;
    }
}