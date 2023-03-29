import { toDollars } from "../helpers";
import FidelityWidgetBase from "./FidelityWidgetBase";

"acct-selector__all-accounts-balance" // total for all accounts
"acct-selector__acct-balance" // specific account, it's a div and the actual balance is the second span

export default class SummarySidebarWidget extends FidelityWidgetBase 
{
    targetedNodesSelector = '[class$="_acct-balance"] > span:nth-child(2)';
    // afterEffectsSelectors = {
    //     allAccountsTotal: '[class$="acct-selector__balance-wrapper"] > span:nth-child(2)',

    // }

    afterEffects()
    {
        let total = 0;
        for (const node of this.targetNodeList)
        {
            total += this.maskActivated ? parseFloat(this.maskValue) : this.dollarsToFloat(node.dataset.originalValue); // add up the total based on whether or not mask is up

            // handle gain/loss for each account
            const originalNodeDollars = node.dataset.originalValue;
            const gainNode = node.parentElement.nextElementSibling.childNodes[1];
            gainNode.textContent = this.makeProportions(originalNodeDollars, gainNode.textContent);
        }
        // handle total for all accounts
        const accountsTotal = document.querySelector('[class$="acct-selector__balance-wrapper"] > span:nth-child(2)');
        accountsTotal.textContent = toDollars(total); 
    }
}