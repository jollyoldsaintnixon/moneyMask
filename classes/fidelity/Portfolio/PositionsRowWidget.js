import WidgetBase from "../../WidgetBase";
import { 
    dollarsToFloat,
    stripToNumber, 
    toDollars,
    toGainDollars,
    arrayToList,
} from "../../helpers";

/**
 * This class represents rows of securities found under the positions tab within the portfolio page.
 */
export default class PositionsRowWidget extends WidgetBase
{
    securityRowsSelector = ".ag-center-cols-container > div.ag-row:not(.ag-row-first, .posweb-row-spacer)"; // this will return a series of security rows. Different nodes within each row will be masked based on the percent of the total account represented by each security.
    securityRowNodes = arrayToList([]); // this will be a list of nodes that represent each security row
    commonAncestorSelector = ".ag-body-viewport"
    percentOfAccountSelector = ".posweb-cell-account_percent > div:first-child > span:first-child"; // this is the percent of the account represented by the security
    percentTotalGainLossSelector = ".posweb-cell-total_gl_percent > div:first-child > span:first-child"; // this is the percent for total gain/loss for the security
    percentTodaysGainLossSelector = ".posweb-cell-today_gl_percent > div:first-child > span:first-child"; // this is the percent for today's gain/loss for the security
    /*** Secondary selectors for each row ***/
    totalGainLossSelector = ".posweb-cell-total_gl_currency > div:first-child > span:first-child"; // this is the total gain/loss for the security
    todaysGainLossSelector = ".posweb-cell-today_gl_currency > div:first-child > span:first-child"; // this is the gain/loss for the security today
    currentValueSelector = ".posweb-cell-current_value > div:first-child > span:first-child"; // this is the current value of the security
    quantitySelector = ".posweb-cell-quantity > div:first-child > span:first-child"; // this is the quantity of the security
    costBasisTotalSelector = ".posweb-cell-cost_basis > div:first-child > span:first-child"; // this is the cost basis of the security
    lateWatcherCounter = 0; // the cost basis and today's gain loss can unfortunately load late. Therefore we may set up a watcher for each that is loaded late. This counter helps with the disconnections.
    /**** *****/
    dudRowClass = "posweb-row-spacer"; // this is a row that is not a security row. It is used to space out the securities in the list.
    
    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.watchForCommonAncestor();
    }

    /******************** MASKERS **********************/

    putMaskUp()
    {
        if (!this.getSecurityRows().length) return;
        let grandTotalMaskValue = 0; // reset it each loop
        for (const securityNode of this.getSecurityRows())
        {
            // the first two are each based on a different percent and are masked the same for both account total and security rows
            this.maskTotalGainLoss(securityNode);
            this.maskTodaysGainLoss(securityNode);
            // determine if account total row or normal security row
            if (this.isAccountTotalRow(securityNode)) // we also want the very last node to be masked as an account total row
            {
                this.maskAccountTotalRow(securityNode);
                grandTotalMaskValue += dollarsToFloat(this.maskValue);
            } 
            else
            {
                this.maskSecurityRow(securityNode);
            } 
        }
        this.maskGrandTotalRow(grandTotalMaskValue);
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
        if (this.isLateNode(todaysGainLossNode, percentNode))
        {
            this.watchLateNode(todaysGainLossNode, percentNode);
        }
        else if (this.validNodes(todaysGainLossNode, percentNode))
        {
            this.maskPositionNode(todaysGainLossNode, stripToNumber(percentNode.textContent), toGainDollars);
        }
    }

    maskAccountTotalRow(securityNode)
    {
        const currentValueNode = securityNode.querySelector(this.currentValueSelector);
        if (currentValueNode && currentValueNode.textContent)
        {
            WidgetBase.maskUp(securityNode.querySelector(this.currentValueSelector), toDollars(this.maskValue));
        }
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
        const costBasisNode = securityNode.querySelector(this.costBasisTotalSelector);
        if (this.isLateNode(costBasisNode, percentNode))
        {
            this.watchLateNode(costBasisNode, percentNode);
        }
        else if (this.validNodes(costBasisNode, percentNode))
        {
            this.maskPositionNode(costBasisNode, stripToNumber(percentNode.textContent), toDollars);
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

    /**
     * All we have to mask here is the grand total's current value. The rest is handled in the general security row masking.
     * The grandTotalMaskValue is recalculated each time putMaskUp is called. It is essentially the number of accounts * maskValue.
     * @param {int|float} grandTotalMaskValue 
     */
    maskGrandTotalRow(grandTotalMaskValue)
    {
        WidgetBase.maskUp(this.getGrandTotalCurrentValue(), toDollars(grandTotalMaskValue));
    }

    /******************** RESETTERS **********************/


    resetNodes()
    {
        WidgetBase.unmaskTree(this.getSecurityRows());
    }

    /******************** GETTERS **********************/

    getSecurityRows(parentNodes = this.getCommonAncestorNode())
    {
        if (!WidgetBase.isConnected(this.securityRowNodes))
        {
            this.securityRowNodes = WidgetBase.getNodes(parentNodes, this.securityRowsSelector, true);
        }
        return this.securityRowNodes;
    }

    getGrandTotalCurrentValue()
    {
        let currentValueNode = null;  
        const grandTotalRow = this.getSecurityRows()[this.getSecurityRows().length - 1];
        if (grandTotalRow)
        {
            currentValueNode = grandTotalRow.querySelector(this.currentValueSelector);
        }
        return currentValueNode;
    }

    /******************** WATCHERS **********************/
    
    activateWatchers()
    {
        this.watchForSecurityRows();
    }

    /**
     * Watch for adding of the security rows.
     * Immediately trigger logic if rows already exist.
     * Disconnects when rows found.
     */
    watchForSecurityRows()
    {
        const _wasFoundLogic = () => {
            this.maskSwitch();
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.addedNodes.length && (mutation.type === 'childlist' || mutation.type === 'subtree'))
                && this.getSecurityRows(mutation.addedNodes).length)
                {
                    _wasFoundLogic();
                    WidgetBase.tryDisconnect(this.observers.securityRows);
                    break;
                }
            }
        };
        if (this.getSecurityRows().length)
        {
            _wasFoundLogic();
        }
        else
        {
            this.observers.securityRows = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
        }
    }

    /**
     * The cost basis and today's gain/loss nodes can unfortunately be loaded late, and even some can be loaded on time while others not. If one is loaded late, we set up a watcher on it.
     * Disconnects when the node is found.
     * _wasFoundLogic only runs if mask is up.
     * 
     * @param {Node} lateNode the node that is loading late
     * @param {Node} percentNode the node that holds the percent to base the mask on
     */
    watchLateNode(lateNode, percentNode)
    {
        const observerName = "latePositionsWatcher" + this.lateWatcherCounter++;
        const _wasFoundLogic = () => {
            this.maskPositionNode(lateNode, stripToNumber(percentNode.textContent), toDollars);
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if (this.isMaskOn && mutation.type === 'childList')
                {
                    _wasFoundLogic();
                    WidgetBase.tryDisconnect(this.observers[observerName]);
                    break;
                }
            }
        };
        this.observers[observerName] = WidgetBase.createObserver(lateNode, _watchLogic);
    }

    /******************** HELPERS **********************/

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

    /**
     * Some nodes may load late (in particular some today's gain/loss and cost basis nodes). This function checks if a node is late. If a node is late, its percent node sibling will have text loaded but the late node will not.
     * @param {Node} lateNode the node that may or may not be late
     * @param {Node} percentNode a sibling node representing the percent. It should be loaded on time if this is a true late node.
     */
    isLateNode(lateNode, percentNode)
    {
        return (lateNode && !lateNode.textContent.length && percentNode && percentNode.textContent.length);
    }
}