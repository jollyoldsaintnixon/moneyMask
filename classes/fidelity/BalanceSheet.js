import WidgetBase from "../WidgetBase";

/**
 * This class represents the account balance tab within the portfolio
 */
export default class BalanceSheet extends WidgetBase
{
    targetNodeSelector = '.balances--table-content:not(.balances--group-mode-total-border) > td:nth-child(2) > span:first-child';
    targetCommonAncestorSelector = '';
    /****** Widget Specific *****/
    accountGainSelector = '.balances--table-content:not(.balances--group-mode-total-border) > td:nth-child(3) > span:first-child';
    accountGain
    portfolioTotalSelector = '.balances--table-content.balances--group-mode-total-border > td:nth-child(2) > span:first-child';
    portfolioGainSelector = '.balances--table-content.balances--group-mode-total-border > td:nth-child(3) > span:first-child';


    // constructor(maskValue = 100, isMaskOn = false)
    // {
    //     super(maskValue, isMaskOn);
    //     this.maskUpOrDownSwitch();
    // }

    /************************ MASKERS ***********************/
    maskSecondaryEffects()
    {
        this.maskAccountGain();
        this.maskPortfolioTotal();
        this.maskPortfolioGain();
    }

    maskAccountGain()
    {
        
    }
    /************************ RESETTERS ***********************/
    resetSecondaryEffects()
    {

    }
    /************************ GETTERS ***********************/
}