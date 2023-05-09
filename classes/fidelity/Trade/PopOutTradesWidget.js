import WidgetBase from "../../WidgetBase.js";
/** This widget represents the "pop out" sidebar trade menu. It can be accessed though a security row listed in the portfolio positions tab, or by clicking the "Trade" button located immediately below the "Accounts & Trade" button when in the portofolio section of the site. 
 * 
 * The target node shows the non-margin buying power. This will be set to the mask value. 
 * 
 * We also need to mask the margin buying power, the "available without margin impact" nodes, and the "amount owned" nodes. 
 * 
 * The margin buying power will be set to 150% of the non-margin buying power (regardless of the actual ratio), and the "available without margin impact" will be set based on the ratio to the non-margin buying power.
 * 
 * The "amount owned" nodes will be trickier to compute- we may just blur this. Furthermore, it is only rendered conditionally- we will need to set up a listener.
 * 
 * We do not need to disable any buttons since this widget only links to the trade preview. */
export default class PopOutTradesWidget extends WidgetBase 
{
    targetNodeSelector = "#eq-ticket__account-balance > div:nth-child(2) > div:nth-child(2)"; // non-margin buying power
    targetCommonAncestorSelector = "#eq-ticket__account-balance";
    marginBuyingPowerSelector = "#eq-ticket__account-balance > div:nth-child(1) > div:nth-child(2)";
    withoutMarginSelector = "#eq-ticket__account-balance > div:nth-child(3) > div:nth-child(2)";

    ownedAmountSelector = ".eqt-quantity__dropdownlist:first-child" // I need to listen to this
    owndedAmountParentSelector = "float_trade_apps > quantity" // it's a custom element
    owndedAmountParent = null;
    // ownedAmountObserver = null;

    popUpSelector = "float_trade_apps" // it's a custom element

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.maskUpOrDownSwitch();
        this.watchForPopUp(); // we need to actually watch for this pop up to appear in order to properly watch for the owned amount
        this.watchForOrderAmount();
    }
    /******************** MASKERS **********************/

    maskOwnedAmount()
    {
        const ownedAmount = this.getOwnedAmount();
        if (ownedAmount)
        {
            console.log("owndedAmount", ownedAmount);
            ownedAmount.style.color = "red";
        }
    }

    /******************** RESETTERS **********************/

    /******************** GETTERS **********************/

    getOwnedAmount()
    {
        if (!this.owndedAmountParent)
        {
            this.owndedAmountParent = document.querySelector(this.owndedAmountParentSelector);
        }
        if (this.owndedAmountParent)
        {
            return this.owndedAmountParent.querySelector(this.ownedAmountSelector);
        }
    }
    
    /******************** OTHERS ************************/

    watchForPopUp()
    {
        const _watchForPopUpCB = (mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'subtree')
                // && this.foundPopUp(mutation.addedNodes))
                {
                    if (this.foundPopUp(mutation.addedNodes))
                    {
                        this.watchForOrderAmount(); // connect the ownded amount observer if the pop up is added
                    }
                    else if (this.foundPopUp(mutation.removedNodes) && this.ownedAmountObserver) // disconnect the ownded amount observer if the pop up is removed
                    {
                        this.ownedAmountObserver.disconnect();
                    }
                }
            });
        }
        this.observers.popUpObserver = WidgetBase.createObserver(document.body, _watchForPopUpCB);
    }

    /**
     * Initiate an observer that activates whenever the owned amount value is displayed
     */
    watchForOrderAmount()
    {
        const _watchForOrderAmountCB = (mutations) => {
            mutations.forEach((mutation) => {
                if ((mutation.type === 'childList' || mutation.type === 'subtree')
                && this.getOwnedAmount()) 
                {
                    this.maskOwnedAmount();
                }
            });
        }
        const ownedAmountParent = document.querySelector(this.owndedAmountParent);
        this.observers.ownedAmountObserver = WidgetBase.createObserver(ownedAmountParent, _watchForOrderAmountCB);
    }

    /**
     * Looks for the trade pop up 
     * @param {NodeList} nodes 
     * @returns 
     */
    foundPopUp(nodes)
    {
        for (const node of nodes)
        {
            if (node.nodeType === Node.ELEMENT_NODE && node.querySelector(this.popUpSelector))
            {
                return true;
            }
        }
        return false;
    }
}