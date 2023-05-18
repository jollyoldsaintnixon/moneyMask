import { 
    stripToNumber, 
    toDollars, 
} from "../../helpers.js";
import WidgetBase from "../../WidgetBase.js";
/** This widget represents the "pop out" sidebar trade menu. It can be accessed though a security row listed in the portfolio positions tab, or by clicking the "Trade" button located immediately below the "Accounts & Trade" button when in the portofolio section of the site. 
 * 
 * ! overwrites watchForCommonAncestor
 * 
 * We also need to mask the margin buying power, the "available without margin impact" nodes, and the "amount owned" nodes. 
 * 
 * The margin buying power will be set to 150% of the non-margin buying power (regardless of the actual ratio), and the "available without margin impact" will be set based on the ratio to the non-margin buying power.
 * 
 * The "amount owned" nodes will be trickier to compute- we may just blur this. Furthermore, it is only rendered conditionally- we will need to set up a listener.
 * 
 * We do not need to disable any buttons since this widget only links to the trade preview. */
export default class TradePopOutWidget extends WidgetBase 
{
    // commonAncestorSelector = "#eq-ticket__account-balance";
    commonAncestorSelector = "float_trade_apps";
    marginSelector = "#eq-ticket__account-balance > div:nth-child(1) > div:nth-child(2)"; // margin buying power
    margin = null;
    nonMarginSelector = "#eq-ticket__account-balance > div:nth-child(2) > div:nth-child(2)"; // non-margin buying power
    nonMargin = null;
    // marginBuyingPowerSelector = "#eq-ticket__account-balance > div:nth-child(1) > div:nth-child(2)";
    withoutMarginImpactSelector = "#eq-ticket__account-balance > div:nth-child(3) > div:nth-child(2)";
    withoutMarginImpact = null;

    ownedAmountSelector = "#eq-ticket__owned-quantity-all > div:nth-child(2)" // I need to listen to this
    ownedAmountParentSelector = "#eqt-mts-stock-quatity" // it's a custom element
    ownedAmountParent = null;

    // popUpSelector = "float_trade_apps" // it's a custom element
    popUpNode = null;

    previewOrderButtonSelector = ".pvd3-button-root.pvd-button--full-width.pvd-button--primary:first-child"; // this retrieves two buttons; use only the first one.
    previewOrderButton = null; // reset to null when pop up removed.
    placeOrderButtonSelector = "#placeOrderBtn";
    placeOrderButton = null;

    errorSelector = ".pvd-inline-alert__content > s-slot > s-assigned-wrapper > div"
    errorCodes = {
        "014978": "insufficientShares", // this is the only error code that we found that needs masking so far
    };

    exitSelector = ".float-trade-container-close.dialog-close"

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.watchForCommonAncestor();
    }
    /******************** MASKERS **********************/

    putMaskUp()
    {
        if (this.getPopUpNode())
        {
            this.maskMargin();
            this.maskWithoutMarginImpact();
            this.maskNonMargin();
            this.maskOwnedAmount();
            this.maskErrorMessage();
            this.maskPlaceOrderButton();
        }
    }

    maskMargin()
    {
        WidgetBase.maskUp(this.getWithMargin(), toDollars(this.maskValue));
    }

    maskWithoutMarginImpact()
    {
        const withoutMarginImpact = this.getWithoutMarginImpact();
        const withMargin = this.getWithMargin();
        if (withoutMarginImpact && withMargin)
        {
            let maskValue = this.maskValue; // default to the mask value
            if (withMargin)
            {
                maskValue = this.getMaskedProportion(withMargin.textContent, withoutMarginImpact.textContent); // mask value will ideally be the proportion of the unmasked value to the margin buying power 
            }
            WidgetBase.maskUp(withoutMarginImpact, toDollars(maskValue));
        }
    }

    maskNonMargin()
    {
        const nonMargin = this.getNonMargin();
        const withoutMarginImpact = this.getWithoutMarginImpact();
        const withMargin = this.getWithMargin();
        if (nonMargin)
        {
            let maskValue = this.maskValue; // default to the mask value
            if (withMargin && withoutMarginImpact)
            {
                // add the values of margin and the without impact nodes and divide by two
                maskValue = stripToNumber(withMargin.textContent) + stripToNumber(withoutMarginImpact.textContent);
                maskValue /= 2;
                maskValue = this.getMaskedProportion(withMargin.textContent, `${maskValue}`); // mask value will ideally be the proportion of the unmasked value to the margin buying power
            }
            WidgetBase.maskUp(nonMargin, toDollars(maskValue));
        }
    }

    maskOwnedAmount()
    {
        const ownedAmount = WidgetBase.getNodes(this.getPopUpNode(), this.ownedAmountSelector);
        if (ownedAmount)
        {
            ownedAmount.classList.add("money-mask-blurred"); // add class "money-mask-blurred" to the owned amount
        }
    }

    maskErrorMessage()
    {
        const errorDiv = WidgetBase.getNodes(this.getPopUpNode(), this.errorSelector);
        if (errorDiv)
        {
            const matches = errorDiv.innerText.match(/\((\d+)\)/);
            if (matches)
            {
                const errorCode = matches[1] // return the error code found within the first set of parens
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

    maskPlaceOrderButton()
    {
        const placeOrderButton = this.getPlaceOrderButton();
        if (placeOrderButton)
        {
            // handle original button by hiding it
            WidgetBase.hideNode(placeOrderButton);
            // reveal and disable clone.
            const clone = WidgetBase.getClone(placeOrderButton) ?? this.makePlaceOrderClone(placeOrderButton);
            WidgetBase.showNode(clone);

            // placeOrderButton.classList.add(WidgetBase.blurClass);
        }
    }

    /******************** RESETTERS **********************/

    resetNodes()
    {
        this.resetMargin();
        this.resetNonMargin();
        this.resetWithoutMarginImpact();
        this.resetOwnedAmount();
        this.resetErrorMessage();
        this.resetPlaceOrderButton();
    }

    resetMargin()
    {
        WidgetBase.unmask(this.getWithMargin());
    }

    resetWithoutMarginImpact()
    {
        WidgetBase.unmask(this.getWithoutMarginImpact());
    }

    resetNonMargin()
    {
        WidgetBase.unmask(this.getNonMargin());
    }

    resetOwnedAmount()
    {
        const ownedAmount = WidgetBase.getNodes(this.getPopUpNode(), this.ownedAmountSelector);
        if (ownedAmount)
        {
            ownedAmount.classList.remove("money-mask-blurred"); // remove class "money-mask-blurred" from the owned amount

        }
    }

    resetErrorMessage()
    {
        const errorDiv = WidgetBase.getNodes(this.getPopUpNode(), this.errorSelector);
        if (errorDiv)
        {
            const matches = errorDiv.innerText.match(/\((\d+)\)/);
            if (matches)
            {
                const errorCode = matches[1] // return the error code found within the first set of parens
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
    }

    resetInsufficientShares(errorDiv)
    {
        const regex = new RegExp(`<span class="${WidgetBase.blurClass}">(\\d+(\\.\\d+)?)<\\/span> shares\\b`); // remove the blurred span, if any
        errorDiv.innerHTML = errorDiv.innerHTML.replace(regex, '$1 shares'); 
    }

    resetPlaceOrderButton()
    {
        const placeOrderButton = this.getPlaceOrderButton();
        if (placeOrderButton)
        {
            // restore placeOrderButton
            placeOrderButton.disabled = false;
            WidgetBase.showNode(placeOrderButton);
            // hide clone.
            const clone = WidgetBase.getClone(placeOrderButton) ?? this.makePlaceOrderClone(placeOrderButton);
            WidgetBase.hideNode(clone);
        }
    }

    /******************** GETTERS **********************/

    getWithMargin(parentNodes = this.getCommonAncestorNode())
    {
        if (!WidgetBase.isConnected(this.margin))
        {
            this.margin = WidgetBase.getNodes(parentNodes, this.marginSelector);
        }
        return this.margin;
    }

    getNonMargin()
    {
        if (!this.nonMargin || !this.nonMargin.isConnected)
        {
            this.nonMargin = WidgetBase.getNodes(this.getPopUpNode(), this.nonMarginSelector);
        }
        return this.nonMargin;
    }

    getWithoutMarginImpact()
    {
        if (!this.withoutMarginImpact || !this.withoutMarginImpact.isConnected)
        {
            this.withoutMarginImpact = WidgetBase.getNodes(this.getPopUpNode(), this.withoutMarginImpactSelector);
        }
        return this.withoutMarginImpact;
    }

    // getWithMargin()
    // {
    //     return this.getTargetNodes()[0];
    // }

    getPopUpNode()
    {
        return this.commonAncestorNode; // it may return null, that is fine. we only want to set this in the pop up observer.
    }

    getPlaceOrderButton()
    {
        if (!this.placeOrderButton || !this.placeOrderButton.isConnected)
        {
            this.placeOrderButton = WidgetBase.getNodes(this.getPopUpNode(), this.placeOrderButtonSelector);
        }
        return this.placeOrderButton;
    }

    /******************** WATCHERS ************************/

    activateWatchers()
    {
        this.watchForMargin(); // watch for the margin to appear
        this.watchForOwnedAmount(); // connect the owned amount observer if the pop up is added
        this.watchForSubmit(); // watch for the submit button so we can add a click listener when found
    }

    /**
     * Disconnects when found
     */
    watchForMargin()
    {
        const _onFoundLogic = () => {
            this.maskSwitch();
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if (mutation.type === 'childList' && mutation.addedNodes.length
                    && this.getWithMargin(mutation.addedNodes))
                {
                    _onFoundLogic();
                    this.tryDisconnect("margin")
                    break;
                }
            }
        };
        if (this.getWithMargin())
        {
            _onFoundLogic();
        }
        else
        {
            this.observers.margin = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
        }
    }

    /**
     * The main observer that starts other observers (which may in turn start other observers). Is not disabled so long as the widget is active, but this.popUpNode is set when found in order to short-circuit looking into each mutation. All other observers are disabled when the pop up is removed.
     */
    watchForCommonAncestor()
    {
        const _onFoundLogic = () => {
            this.activateWatchers();
        };
        const _onRemovedLogic = () => {
            this.popUpNode = null;
            this.previewOrderButton = null;
            this.tryDisconnect("margin");
            this.tryDisconnect("submitObserver");
            this.tryDisconnect("errorMessageObserver")
            this.tryDisconnect("ownedAmountObserver"); // disconnect the owned amount observer if the pop up is removed. However, this pop up observer will remain active.
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.type === 'childList' || mutation.type === 'subtree'))
                {
                    if (!this.commonAncestorNode // short-circuit if the pop up is already found
                        && mutation.addedNodes.length > 0
                        && this.getCommonAncestorNode(mutation.addedNodes)) // check for the pop up in the added nodes and set if found
                    {
                        _onFoundLogic();
                        break;
                    }
                    else if (this.commonAncestorNode // removal logic
                        && mutation.removedNodes.length > 0
                        && WidgetBase.getNodes(mutation.removedNodes, this.commonAncestorSelector))
                    {
                        _onRemovedLogic();
                        break;
                    }
                }
            };
        }
        if (this.getCommonAncestorNode())
        {
            _onFoundLogic();
        }
        this.observers.commonAncestor = WidgetBase.createObserver(this.getWideAreaSearchNode(), _watchLogic);
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
                    && WidgetBase.getNodes(mutation.addedNodes, this.ownedAmountSelector)) 
                    {
                        this.maskOwnedAmount();
                        break; // break out of the mutations list if the owned amount is found
                    }
                };
            }
        }
        this.observers.ownedAmountObserver = WidgetBase.createObserver(this.getPopUpNode(), _watchForOwnedAmountCB);
    }

    /**
     * This observer sets up two listeners once the submit button is found. The submit button is memoized so as to prevent looking at the DOM every time there is a mutation. We thus need to revert the submit button back to null when the pop up is removed.
     */
    watchForSubmit()
    {
        const _watchForSubmitCB = (mutations) => {
            if (!this.previewOrderButton) // short circuit if submit button is already set
            {
                for (const mutation of mutations)
                {
                    if ((mutation.type === 'childList' || mutation.type === 'subtree')
                        && (this.previewOrderButton = WidgetBase.getNodes(mutation.addedNodes, this.previewOrderButtonSelector))) // set previewOrderButton if found in the added nodes
                    {
                        this.handlePreviewOrder(); // this will activate the error listener
                        this.handleExit(); // this will deactivate the error listener
                        break; // break out of the mutations list if the submit button is found
                    }
                };
            }
        }
        // this.popUpNode = this.popUpNode ?? document.querySelector(this.popUpSelector);
        this.observers.submitObserver = WidgetBase.createObserver(this.getPopUpNode(), _watchForSubmitCB);
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
                    && WidgetBase.getNodes(this.getPopUpNode(), this.errorSelector)) // set errorDiv if found in the added nodes
                    {
                        this.maskErrorMessage();
                        this.tryDisconnect("errorMessageObserver"); // disconnect the error message observer if the error message is found.
                        this.observers.errorMessageObserver = null;
                        break; // break out of the mutations list if found
                    }
                };
            }
        }
        // this.popUpNode = this.popUpNode ?? document.querySelector(this.popUpSelector);
        const observerConfig = Object.assign({ attributes: true, }, WidgetBase.observerConfig); // add the base observer config to this observer config (we also want to watch for changes in classlist)
        this.observers.errorMessageObserver = WidgetBase.createObserver(this.getPopUpNode(), _watchForErrorMessageCB, false, 1, observerConfig);
    }

    watchForPlaceOrder()
    {
        const _watchForPlaceOrderCB = (mutations) => {
            if (this.isMaskOn) // no need to run through all mutations if mask is down since we are only masking the place order button
            {
                for (const mutation of mutations)
                {
                    if ((mutation.type === 'childList' || mutation.type === 'subtree' && mutation.addedNodes.length)
                    && this.getPlaceOrderButton()) // set placeOrderButton if found in the added nodes
                    {
                        this.maskPlaceOrderButton();
                        this.tryDisconnect("placeOrderObserver"); // disconnect the place order observer once the place order button is found.
                        this.observers.placeOrderObserver = null;
                        break; // break out of the mutations list if found
                    }
                };
            }
        }
        this.observers.placeOrderObserver = WidgetBase.createObserver(this.getPopUpNode(), _watchForPlaceOrderCB);
    }

    /******************** OTHERS ************************/


    /**
     * instantiate the error listener and also the "place order" listener
     */
    handlePreviewOrder()
    {
        this.previewOrderButton = this.previewOrderButton ?? this.getPopUpNode().querySelector(this.previewOrderButtonSelector);
        this.previewOrderButton.addEventListener('click', () => {
            if (!this.observers.errorMessageObserver)
            {
                this.watchForErrorMessage();
            }
            if (!this.observers.placeOrderObserver)
            {
                this.watchForPlaceOrder();
            }
            this.previewOrderButton = null; // reset previewOrderButton
        });
    }

    /**
     * Disconnect the error message observer when the exit button is clicked
     */
    handleExit()
    {
        const exitButton =  document.querySelector(this.exitSelector); // it's technially outside the pop up node
        exitButton.addEventListener('click', () => {
            this.tryDisconnect("errorMessageObserver");
        });
    }

    /**
     * The place holder button gets a specific clone that is disabled and has a different text
     */
    makePlaceOrderClone(placeOrderButton)
    {
        WidgetBase.makeClones(placeOrderButton);
        const clone = WidgetBase.getClone(placeOrderButton);
        clone.disabled = true;
        clone.childNodes[0].style.fontStyle = "italic";
        clone.childNodes[0].textContent = "Unmask to place order";
        return clone;
    }
}