import WidgetBase from "../../../WidgetBase";
import { 
    stripToNumber, 
    toDollars,
    toGainDollars,
    toShareQuantity,
    arrayToList,
} from "../../../helpers";

/**
 * This class represents rows of securities found under the positions tab within the portfolio page.
 */
export default class PositionsRowWidget extends WidgetBase
{
    commonAncestorSelector = ".ag-body-viewport"
    distalAncestorSelector = ".positions-content-container"; // this is the ancestor that is removed when the user switches accounts. We watch for this to re-mask.
    distalAncestorNode = null;
    securityRowsSelector = ".ag-center-cols-container > div.ag-row:not(.ag-row-first, .posweb-row-spacer)"; // this will return a series of security rows. Different nodes within each row will be masked based on the percent of the total account represented by each security.
    securityRowNodes = arrayToList([]); // this will be a list of nodes that represent each security row
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
                grandTotalMaskValue += stripToNumber(this.maskValue);
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
        // get percent nodes
        const accountPercentNode = securityNode.querySelector(this.percentOfAccountSelector);
        const totalGainPercentNode = securityNode.querySelector(this.percentTotalGainLossSelector);
        if (this.validNodes(totalGainLossNode, totalGainPercentNode))
        {
            const combinedPercent = this.calcMaskedPercent(accountPercentNode, totalGainPercentNode);
            this.maskPositionNode(totalGainLossNode, combinedPercent, toGainDollars);
        }
    }

    maskTodaysGainLoss(securityNode)
    {
        const todaysGainLossNode = securityNode.querySelector(this.todaysGainLossSelector);
        // get percent nodes
        const accountPercentNode = securityNode.querySelector(this.percentOfAccountSelector);
        const todaysGainPercentNode = securityNode.querySelector(this.percentTodaysGainLossSelector);
        if (this.isLateNode(todaysGainLossNode, todaysGainPercentNode))
        {
            this.watchLateNode(todaysGainLossNode, accountPercentNode, todaysGainPercentNode);
        }
        else if (this.validNodes(todaysGainLossNode, todaysGainPercentNode))
        {
            const combinedPercent = this.calcMaskedPercent(accountPercentNode, todaysGainPercentNode);
            this.maskPositionNode(todaysGainLossNode, combinedPercent, toGainDollars);
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
        const accountPercentNode = securityNode.querySelector(this.percentOfAccountSelector); // these next three masks are all based on this percent
        this.maskCurrentValue(securityNode, accountPercentNode);
        this.maskQuantity(securityNode, accountPercentNode);
        this.maskCostBasisTotal(securityNode, accountPercentNode);
    }

    maskCurrentValue(securityNode, percentNode)
    {
        const currentValueNode = securityNode.querySelector(this.currentValueSelector);
        percentNode = percentNode ?? securityNode.querySelector(this.percentOfAccountSelector);
        if (this.validNodes(currentValueNode, percentNode))
        {
            const percent = this.calcMaskedPercent(percentNode);
            this.maskPositionNode(currentValueNode, percent, toDollars);
        }
    }

    maskQuantity(securityNode, percentNode)
    {
        percentNode = percentNode ?? securityNode.querySelector(this.percentOfAccountSelector);
        const quantityNode = securityNode.querySelector(this.quantitySelector);
        if (this.validNodes(quantityNode, percentNode))
        {
            const percent = this.calcMaskedPercent(percentNode);
            this.maskPositionNode(quantityNode, percent, toShareQuantity);
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
            const percent = this.calcMaskedPercent(percentNode);
            this.maskPositionNode(costBasisNode, percent, toDollars);
        }
    }

    /**
     * 
     * @param {Node} node to be masked
     * @param {float} percent percent to base mask on (should be in decimal form, ie already should be divided by 100)
     * @param {function} dollarFunc toDollars, toGainDollars, etc. defaults to returning the unmodified value.
     */
    maskPositionNode(node, percent, dollarFunc = (value) => value)
    {
        const maskedValue = dollarFunc(this.maskValue * percent);
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

    getDistalAncestorNode()
    {
        if (!WidgetBase.isConnected(this.distalAncestorNode))
        {
            this.distalAncestorNode = WidgetBase.getNodes(document, this.distalAncestorSelector);
        }
        return this.distalAncestorNode;
    }

    /******************** WATCHERS **********************/
    
    activateWatchers()
    {
        this.watchForSecurityRows();
        this.watchForAccountSwap();
    }

    /**
     * Watch for adding of the security rows.
     * Immediately trigger logic if rows already exist.
     * Disconnects when rows found.
     */
    watchForSecurityRows()
    {
        const _onFoundLogic = () => {
            this.maskSwitch();
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.addedNodes.length && (mutation.type === 'childlist' || mutation.type === 'subtree'))
                && this.getSecurityRows(mutation.addedNodes).length)
                {
                    _onFoundLogic();
                    this.tryDisconnect("securityRows");
                    break;
                }
            }
        };
        if (this.getSecurityRows().length)
        {
            _onFoundLogic();
        }
        else
        {
            this.observers.securityRows = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
        }
    }

    /**
     * When the user switches from account to account, a history update is not triggered. We need to therefore watch for the account swap and re-watch for commonAncestor.
     * Tries to run immediately.
     * Does not disconnect. Will short circuit if observer already exists.
     */
    watchForAccountSwap()
    {
        if (!this.observers.accountSwap)
        {
            const _onRemovedLogic = () => {
                this.watchForCommonAncestor();
            };
            const _watchLogic = (mutations) => {
                for (const mutation of mutations) 
                {
                    if (mutation.removedNodes.length && !WidgetBase.isConnected(this.getCommonAncestorNode()))
                    {
                        _onRemovedLogic();
                        this.tryDisconnect("accountSwap")
                        break;
                    }
                }
            };
            if (!WidgetBase.isConnected(this.getCommonAncestorNode())) // common ancestor was already removed
            {
                _onRemovedLogic();
            }
                this.observers.accountSwap = WidgetBase.createObserver(this.getDistalAncestorNode(), _watchLogic);
        }
        // }
    }

    /**
     * The cost basis and today's gain/loss nodes can unfortunately be loaded late, and even some can be loaded on time while others not. If one is loaded late, we set up a watcher on it.
     * Disconnects when the node is found.
     * _onFoundLogic only runs if mask is up.
     * 
     * @param {Node} lateNode the node that is loading late
     * @param {Node} percentNode the node that holds the percent to base the mask on
     */
    watchLateNode(lateNode, percentNode, changePercentNode = null)
    {
        const observerName = "latePositionsWatcher" + this.lateWatcherCounter++;
        const _onFoundLogic = () => {
            const percent = this.calcMaskedPercent(percentNode, changePercentNode);
            this.maskPositionNode(lateNode, percent, toDollars);
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if (this.isMaskOn && mutation.type === 'childList')
                {
                    _onFoundLogic();
                    this.tryDisconnect(observerName);
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

    /**
     * Calculate the masked percent based by combining the percent of account a security makes up with the change percent. If the change percent is not found, base the percent solely on the percent of account.
     * @param {Node} accountPercentNode the node holding the percent of account
     * @param {Node} changePercentNode the node holding the change percent
     * @returns float;
     */
    calcMaskedPercent(accountPercentNode, changePercentNode)
    {
        const _getPercent = (node) => { // default the to 100% if not found
            return (node && node.textContent.trim().length) 
            ? stripToNumber(node.textContent) / 100
            : 1;
        }
        return _getPercent(accountPercentNode) * _getPercent(changePercentNode);
    }
}