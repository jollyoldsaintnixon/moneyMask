import FidelityWidgetBase from "./FidelityWidgetBase";

"acct-selector__all-accounts-balance" // total for all accounts
"acct-selector__acct-balance" // specific account, it's a div and the actual balance is the second span

export default class SummarySidebarWidget extends FidelityWidgetBase 
{
    targetedNodesSelector = '[class$="_acct-balance"] > span:nth-child(2)';
}