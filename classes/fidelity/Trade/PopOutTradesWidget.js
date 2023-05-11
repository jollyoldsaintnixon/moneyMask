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

    ownedAmountSelector = "#eq-ticket__owned-quantity-all > div:nth-child(2)" // I need to listen to this
    ownedAmountParentSelector = "#eqt-mts-stock-quatity" // it's a custom element
    ownedAmountParent = null;

    popUpSelector = "float_trade_apps" // it's a custom element
    popUpNode = null;

    submitButtonSelector = ".pvd3-button-root.pvd-button--full-width.pvd-button--primary:first-child"; // this retrieves two buttons; use only the first one.
    submitButton = null; // reset to null when pop up removed.

    errorSelector = ".pvd-inline-alert__content > s-slot > s-assigned-wrapper > div"
    errorCodes = {
        "014978": "insufficientShares", // this is the only error code that we found that needs masking so far
    };

    exitSelector = ".float-trade-container-close.dialog-close"

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.maskUpOrDownSwitch();
        this.watchForPopUp(); // we need to actually watch for this pop up to appear in order to properly watch for the owned amount
    }
    /******************** MASKERS **********************/

    maskSecondaryEffects()
    {
        this.maskOwnedAmount();
        this.maskErrorMessage();
    }

    maskOwnedAmount()
    {
        const ownedAmount = WidgetBase.getNodeFromList(this.popUpNode, this.ownedAmountSelector);;
        if (ownedAmount)
        {
          // console.log("ownedAmount", ownedAmount);
            ownedAmount.classList.add("money-mask-blurred"); // add class "money-mask-blurred" to the owned amount
        }
    }

    maskErrorMessage()
    {
        const errorDiv = WidgetBase.getNodeFromList(this.popUpNode, this.errorSelector);
        if (errorDiv)
        {
            const errorCode = errorDiv.innerText.match(/\((\d+)\)/)[1] // return the error code found within the first set of parens
            switch (this.errorCodes[errorCode]) 
            {
                case "insufficientShares":
                    this.maskInsufficientShares(errorDiv);
                    break;
                default:
                    break;
            }
        }
    }


    /**
     * @param {Node} errorDiv 
     */
    maskInsufficientShares(errorDiv)
    {
        const regex = new RegExp("(\\d+(\\.\\d+)?) shares\\b", "g");
        const message = errorDiv.innerHTML;
        if (!message.includes(`<span class="${WidgetBase.blurClass}">`)) // check for span first to avoid span stacking
        {
            errorDiv.innerHTML = message.replace(regex, `<span class="${WidgetBase.blurClass}">$1</span> shares`); // wrap share number with a blurred span
        }
    }

    /******************** RESETTERS **********************/

    resetSecondaryEffects()
    {
        this.resetOwnedAmount();
        this.resetErrorMessage();
    }

    resetOwnedAmount()
    {
        const ownedAmount = WidgetBase.getNodeFromList(this.popUpNode, this.ownedAmountSelector);
        if (ownedAmount)
        {
            ownedAmount.classList.remove("money-mask-blurred"); // remove class "money-mask-blurred" from the owned amount

        }
    }

    resetErrorMessage()
    {
        const errorDiv = WidgetBase.getNodeFromList(this.popUpNode, this.errorSelector);
        if (errorDiv)
        {
            const errorCode = errorDiv.innerText.match(/\((\d+)\)/)[1] // return the error code found within the first set of parens
            switch (this.errorCodes[errorCode]) 
            {
                case "insufficientShares":
                    this.resetInsufficientShares(errorDiv);
                    break;
                default:
                    break;
            }
        }
    }

    resetInsufficientShares(errorDiv)
    {
        const regex = new RegExp(`<span class="${WidgetBase.blurClass}">(\\d+(\\.\\d+)?)<\\/span> shares\\b`); // remove the blurred span, if any
        errorDiv.innerHTML = errorDiv.innerHTML.replace(regex, '$1 shares'); 
    }

    /******************** GETTERS **********************/

    /******************** WATCHERS ************************/

    /**
     * The main observer that starts other observers (which may in turn start other observers). Is not disabled so long as the widget is active, but this.popUpNode is set when found in order to short-circuit looking into each mutation. All other observers are disabled when the pop up is removed.
     */
    watchForPopUp()
    {
        const _watchForPopUpCB = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.type === 'childList' || mutation.type === 'subtree'))
                {
                    if (!this.popUpNode // short-circuit if the pop up is already found
                        && mutation.addedNodes.length > 0
                        && (this.popUpNode = WidgetBase.getNodeFromList(mutation.addedNodes, this.popUpSelector))) // check for the pop up in the added nodes and set if found
                    {
                        this.watchForOwnedAmount(); // connect the owned amount observer if the pop up is added
                        this.watchForSubmit(); // watch for the submit button so we can add a click listener when found
                        break;
                    }
                    else if (this.popUpNode 
                        && mutation.removedNodes.length > 0
                        && WidgetBase.getNodeFromList(mutation.removedNodes, this.popUpSelector))
                    {
                        this.popUpNode = null;
                        this.submitButton = null;
                        WidgetBase.tryDisconnect(this.observers.submitObserver);
                        WidgetBase.tryDisconnect(this.observers.errorMessageObserver)
                        WidgetBase.tryDisconnect(this.observers.ownedAmountObserver); // disconnect the owned amount observer if the pop up is removed. However, this pop up observer will remain active.
                        this.observers.ownedAmountObserver = null;
                        this.observers.errorMessageObserver = null;
                        this.observers.submitObserver = null;
                        break;
                    }
                }
            };
        }
        this.observers.popUpObserver = WidgetBase.createObserver(document.querySelector('body'), _watchForPopUpCB);
    }

    /**
     * Initiate an observer that activates whenever the owned amount value is displayed
     */
    watchForOwnedAmount()
    {
        const _watchForOwnedAmountCB = (mutations) => {
            if (this.isMaskOn) // no need to run through all mutations if mask is down since we are only masking the owned amount
            {
                for (const mutation of mutations)
                {
                    if ((mutation.type === 'childList' || mutation.type === 'subtree')
                    && WidgetBase.getNodeFromList(mutation.addedNodes, this.ownedAmountSelector)) 
                    {
                        this.maskOwnedAmount();
                        break; // break out of the mutations list if the owned amount is found
                    }
                };
            }
        }
        this.popUpNode = this.popUpNode ?? document.querySelector(this.popUpSelector);
        this.observers.ownedAmountObserver = WidgetBase.createObserver(this.popUpNode, _watchForOwnedAmountCB);
    }

    /**
     * This observer sets up two listeners once the submit button is found. The submit button is memoized so as to prevent looking at the DOM every time there is a mutation. We thus need to revert the submit button back to null when the pop up is removed.
     */
    watchForSubmit()
    {
        const _watchForSubmitCB = (mutations) => {
            if (!this.submitButton) // short circuit if submit button is already set
            {
                for (const mutation of mutations)
                {
                    if ((mutation.type === 'childList' || mutation.type === 'subtree')
                        && (this.submitButton = WidgetBase.getNodeFromList(mutation.addedNodes, this.submitButtonSelector))) // set submitButton if found in the added nodes
                    {
                        this.handleSubmit(); // this will activate the error listener
                        this.handleExit(); // this will deactivate the error listener
                        break; // break out of the mutations list if the submit button is found
                    }
                };
            }
        }
        this.popUpNode = this.popUpNode ?? document.querySelector(this.popUpSelector);
        this.observers.submitObserver = WidgetBase.createObserver(this.popUpNode, _watchForSubmitCB);
    }

    /**
     * Watches for error messages. We don't want to memoize the error message since it can be one of many.
     */
    watchForErrorMessage()
    {
        const _watchForErrorMessageCB = (mutations) => {
            if (this.isMaskOn) // no need to run through all mutations if mask is down since we are only masking the error
            {
                for (const mutation of mutations) 
                {
                    if ((mutation.type === 'childList' || mutation.type === 'subtree' || mutation.attributeName === 'class') // once the errorDiv is created, only class changes will occur
                    && WidgetBase.getNodeFromList(this.popUpNode, this.errorSelector)) // set errorDiv if found in the added nodes
                    {
                        this.maskErrorMessage();
                        WidgetBase.tryDisconnect(this.observers.errorMessageObserver); // disconnect the error message observer if the error message is found.
                        break; // break out of the mutations list if found
                    }
                };
            }
        }
        this.popUpNode = this.popUpNode ?? document.querySelector(this.popUpSelector);
        const observerConfig = Object.assign({ attributes: true, }, WidgetBase.observerConfig); // add the base observer config to this observer config (we also want to watch for changes in classlist)
        this.observers.errorMessageObserver = WidgetBase.createObserver(this.popUpNode, _watchForErrorMessageCB, false, 1, observerConfig);
    }

    /******************** OTHERS ************************/


    handleSubmit()
    {
        this.submitButton = this.submitButton ?? this.popUpNode.querySelector(this.submitButtonSelector);
        this.submitButton.addEventListener('click', () => {
            this.watchForErrorMessage();
        });
    }

    /**
     * Disconnect the error message observer when the exit button is clicked
     */
    handleExit()
    {
        const exitButton =  document.querySelector(this.exitSelector); // it's technially outside the pop up node
        exitButton.addEventListener('click', () => {
            WidgetBase.tryDisconnect(this.observers.errorMessageObserver);
        });
    }
}