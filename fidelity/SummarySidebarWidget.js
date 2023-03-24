import FidelityWidget from "./FidelityWidget";

"acct-selector__all-accounts-balance" // total for all accounts
"acct-selector__acct-balance" // specific account, it's a div and the actual balance is the second span

export default class SummarySidebarWidget extends FidelityWidget 
{
    /**
     * We want the second span child of all divs that have a class
     * that ends in "__acct-balance".
     */
    getTargetNodes()
    {
        console.log("sidebar getTargetNodes")
        // set up array;
        const targetNodes = [];
        // get all divs that have the correct class
        const accountDivs = document.querySelectorAll('[class$="_acct-balance"]');
        accountDivs.forEach(div => {
            const spanElements = div.querySelectorAll('span');
            if (spanElements.length >= 2)
            {
                targetNodes.push(spanElements[1]);
            }
        });
        return targetNodes;
    }
}