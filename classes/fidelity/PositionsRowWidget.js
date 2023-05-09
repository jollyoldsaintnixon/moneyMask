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
    targetNodeSelector = ".ag-center-cols-container > div.ag-row:not(.ag-row-first, .posweb-row-spacer)"; // this will return a series of security rows. Different nodes within each row will be masked based on the percent of the total account represented by each security.
    targetCommonAncestorSelector = ".ag-body-viewport"
    percentOfAccountSelector = ".posweb-cell-account_percent > div:first-child > span:first-child"; // this is the percent of the account represented by the security
    percentTotalGainLossSelector = ".posweb-cell-total_gl_percent > div:first-child > span:first-child"; // this is the percent for total gain/loss for the security
    percentTodaysGainLossSelector = ".posweb-cell-today_gl_percent > div:first-child > span:first-child"; // this is the percent for today's gain/loss for the security
    /*** Secondary selectors for each row ***/
    totalGainLossSelector = ".posweb-cell-total_gl_currency > div:first-child > span:first-child"; // this is the total gain/loss for the security
    todaysGainLossSelector = ".posweb-cell-today_gl_currency > div:first-child > span:first-child"; // this is the gain/loss for the security today
    currentValueSelector = ".posweb-cell-current_value > div:first-child > span:first-child"; // this is the current value of the security
    quantitySelector = ".posweb-cell-quantity > div:first-child > span:first-child"; // this is the quantity of the security
    costBasisTotalSelector = ".posweb-cell-cost_basis > div:first-child > span:first-child"; // this is the cost basis of the security
    /**** *****/
    dudRowClass = "posweb-row-spacer"; // this is a row that is not a security row. It is used to space out the securities in the list.
    
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
            // the first two are each based on a different percent and are masked the same for both account total and security rows
            this.maskTotalGainLoss(securityNode);
            this.maskTodaysGainLoss(securityNode);
            // determin if account total row or normal security row
            if (this.isAccountTotalRow(securityNode))
            {
                this.maskAccountTotalRow(securityNode);
            } 
            else
            {
                this.maskSecurityRow(securityNode);
            } 
        }
    }

    maskTotalGainLoss(securityNode)
    {
        const totalGainLossNode = securityNode.querySelector(this.totalGainLossSelector);
        const percentNode = securityNode.querySelector(this.percentTotalGainLossSelector);
        if (this.validNodes(totalGainLossNode, percentNode))
        {
            this.maskPositionNode(totalGainLossNode, stripToNumber(percentNode.textContent), toGainDollars);
        }
    }

    maskTodaysGainLoss(securityNode)
    {
        const todaysGainLossNode = securityNode.querySelector(this.todaysGainLossSelector);
        const percentNode = securityNode.querySelector(this.percentTodaysGainLossSelector);
        if (this.validNodes(todaysGainLossNode, percentNode))
        {
            this.maskPositionNode(todaysGainLossNode, stripToNumber(percentNode.textContent), toGainDollars);
        }
    }

    maskAccountTotalRow(securityNode)
    {
        securityNode.querySelector(this.currentValueSelector).textContent = toDollars(this.maskValue);
    }

    maskSecurityRow(securityNode)
    {
        const percentNode = securityNode.querySelector(this.percentOfAccountSelector); // these next three masks are all based on this percent
        this.maskCurrentValue(securityNode, percentNode);
        this.maskQuantity(securityNode, percentNode);
        this.maskCostBasisTotal(securityNode, percentNode);
    }

    maskCurrentValue(securityNode, percentNode)
    {
        const currentValueNode = securityNode.querySelector(this.currentValueSelector);
        percentNode = percentNode ?? securityNode.querySelector(this.percentOfAccountSelector);
        if (this.validNodes(currentValueNode, percentNode))
        {
            this.maskPositionNode(currentValueNode, stripToNumber(percentNode.textContent), toDollars);
        }
    }

    maskQuantity(securityNode, percentNode)
    {
        percentNode = percentNode ?? securityNode.querySelector(this.percentOfAccountSelector);
        const quantityNode = securityNode.querySelector(this.quantitySelector);
        if (this.validNodes(quantityNode, percentNode))
        {
            this.maskPositionNode(quantityNode, stripToNumber(percentNode.textContent));
        }
    }

    maskCostBasisTotal(securityNode, percentNode)
    {
        percentNode = percentNode ?? securityNode.querySelector(this.percentOfAccountSelector);
        const costBasisTotalNode = securityNode.querySelector(this.costBasisTotalSelector);
        if (this.validNodes(costBasisTotalNode, percentNode))
        {
            this.maskPositionNode(costBasisTotalNode, stripToNumber(percentNode.textContent), toDollars);
        }
    }

    /**
     * 
     * @param {Node} node to be masked
     * @param {float} percent percent to base mask on
     * @param {function} dollarFunc toDollars, toGainDollars, etc. defaults to returning an unmodified value.
     */
    maskPositionNode(node, percent, dollarFunc = (value) => value)
    {
        const maskedValue = dollarFunc(this.maskValue * percent / 100);
        WidgetBase.maskUp(node, maskedValue);
    }

    /******************** RESETTERS **********************/


    resetSecondaryEffects()
    {
        for (const securityNode of this.getTargetNodes())
        {
            WidgetBase.unmask(securityNode.querySelector(this.totalGainLossSelector));
            WidgetBase.unmask(securityNode.querySelector(this.todaysGainLossSelector));
            WidgetBase.unmask(securityNode.querySelector(this.currentValueSelector));
            WidgetBase.unmask(securityNode.querySelector(this.quantitySelector));
            WidgetBase.unmask(securityNode.querySelector(this.costBasisTotalSelector));
        }
    }

    /******************** GETTERS **********************/
    
    /******************** OTHERS **********************/

    /**
     * Verify that the position node should be masked
     * @param {Node} positionNode the node to be masked
     * @param {Node} percentNode the node holding the percent to base the mask on
     * @returns 
     */
    validNodes(positionNode, percentNode)
    {
        return ((positionNode && !isNaN(stripToNumber(positionNode.textContent))) 
            && (percentNode && percentNode.textContent.length));
    }

    isAccountTotalRow(securityNode)
    {
        return (securityNode.nextSibling && securityNode.nextSibling.classList.contains(this.dudRowClass));
    }
}