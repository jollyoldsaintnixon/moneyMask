import PortfolioSidebarWidget from "./PortfolioSidebarWidget";

/**
 * This class is exactly like the PortfolioSidebarWidget class, except the nodes have different selectors
 */
export default class BalanceSidebarWidget extends PortfolioSidebarWidget
{
    targetNodeSelector = '.account-selector--tab-row.account-selector--account-balance.js-acct-balance';
    targetCommonAncestorSelecto = '.account-selector--accounts-wrapper';
    groupTotalNodesSelector = '.account-selector--header-total';
    accountsTotalSelector = '.account-selector--tab-row.account-selector--all-accounts-balance.js-portfolio-balance'; // each "group" of accounts (ie retirement, custodial, etc) has a total
}