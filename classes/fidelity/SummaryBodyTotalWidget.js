import { 
    toDollars, 
    stripToNumber, 
    arrayToList
} from "../helpers";
import OnlySecondaryWidgetBase from "../OnlySecondaryWidgetBase";
import WidgetBase from "../WidgetBase";

/**
 * This class targets a particular "square" in the summary panel that shows 
 * the total value of all accounts. It is a secondary widget because changes
 * are determined by changes in a node outside of its scope.
 */
export default class SummaryBodyTotalWidget extends OnlySecondaryWidgetBase 
{
    targetNodeSelector = '.total-balance__value';
    targetCommonAncestorSelector = 'summary-panel'; // it is an element
    listenersInitiated = false; // this will listen for clicks on the common ancestor. The portfolio and gain nodes can be replaced when the user clicks on the common ancestor.
    catalystSelector = '.acct-selector__all-accounts > div:nth-child(2) > span:nth-child(2)';
    portfolioNode = null; // the node that shows the total portfolio value
    gainNodeSelector = '.today-change-value > span:first-child';
    gainNode = null; // this will be the node that shows the total portfolio gain/loss for the day
    percentNodeSelector = '.today-change-value > span:nth-child(2)';
    percentNode = null; // this represents the percent change for the day
   
    graphNode = null;
    graphObserver = null; // this will be the observer that watches for changes to a graph that reloads/replaces gain nodes

    /**
     * Updates the "gain" node for each account (the gain/loss for the day).
     * Updates the sum value of all accounts.
     * ? is this ever called when the mask is down? if not, we can calculate the total much more easily.
     */
    maskSecondaryEffects()
    {
        console.log('summaryBodyTotalWidget maskSecondaryEffects')
        if (!this.listenersInitiated) // only listen once
        {
            this.initiateListeners();
            this.listenersInitiated = true;
        }
        this.maskPortfolioTotalNode();
        this.maskPorfolioTotalGainNode();
    }

    /**
     * Matches this widget's portfolio total node text with that of the catalyst node.
     */
    maskPortfolioTotalNode()
    {
        const catalystText = this.getCatalystText();
        if (catalystText.length) // we found the catalyst node and it had text
        {
            this.getPortfolioTotalNode().textContent = catalystText;
        }
    }

    /**
     * The gain node should be related to the first target node found based on the common ancestor node.
     */
    maskPorfolioTotalGainNode()
    {
        const strippedTotal = stripToNumber(this.getPortfolioTotalNode().textContent);
        const strippedPercentChange = stripToNumber((this.getPercentNode().textContent ?? "0"));
        this.getGainNode(this.getPortfolioTotalNode()).textContent = toDollars(strippedTotal * (strippedPercentChange / 100));
    }

    /**
     * Certain actions can reset/reload the gain nodes. These listen for those events
     */
    initiateListeners()
    {
        this.initCommonAncestorListener();
        this.watchForHighCharts(); // the graphs are loaded after the page loads, so we need to watch for them
    }

    initCommonAncestorListener()
    {
        this.getCommonAncestorNode().addEventListener('click', this._listenerCallBack.bind(this));
    }

    watchForHighCharts()
    {
        this.graphObserver = WidgetBase.createObserver(this.getCommonAncestorNode(), function(mutations) {
            console.log('summaryBodyTotalWidget watchForHighCharts callback');
            for (const mutation of mutations)
            {
                if ((mutation.type === 'childList' || mutation.type === 'subtree')
                    && this.graphWasFound(mutation.addedNodes)
                    )
                {
                    this.initHighChartsListener(this.graphNode); // this.graphNode is set by this.graphWasFound() if any nodes were found
                    break;
                }
            }
        }.bind(this));
    }

    /**
     * 
     * @param {Node} graphNode 
     */
    initHighChartsListener(graphNode)
    {
        // graphNode.forEach(graph => {
            // graphNode.addEventListener('click', this._listenerCallBack.bind(this));
            // graphNode.addEventListener('mouseover', this._listenerCallBack.bind(this));
            graphNode.addEventListener('mouseleave', this._listenerCallBack.bind(this)); // triggers when leaving element (but not children)
            // graphNode.addEventListener('mouseout', this._listenerCallBack.bind(this)); // triggers when leaving element or any child
        // });
    }

    _listenerCallBack()
    {
        console.log('summaryBodyTotal event listenerCallBack');
        this.maskPorfolioTotalGainNode();
    }

    /**
     * Should be the first node in the list of target nodes under the common ancestor.
     * @returns {Node} the node that shows the total value of all accounts
     */
    getPortfolioTotalNode()
    {
        this.portfolioNode = this.portfolioNode ?? this.getTargetNodes(this.getCommonAncestorNode())[0];
        return this.portfolioNode;
    }

    getCommonAncestorNode()
    {
        if (!this.targetCommonAncestorNode)
        {
            this.targetCommonAncestorNode = document.querySelector(this.targetCommonAncestorSelector);
        }
        return this.targetCommonAncestorNode;
    }

    getPercentNode()
    {
        return document.querySelector(this.percentNodeSelector + WidgetBase.notCloneSelector);
    }

    /**
     * 
     * @returns {string} the text of the catalyst node or an empty string
     */
    getCatalystText()
    {
        const catalystNode = document.querySelector(this.catalystSelector + WidgetBase.notCloneSelector); // requery this node each time since it can be nonexistent, removed, or reloaded
        if (catalystNode)
        {
            return catalystNode.textContent;
        }
        return "";
    }

    /**
     * Get the gain/loss node for the given node.
     * The gain node is the node with the daily gain/loss value.
     * Memoize it since it should remain in place once added.
     * 
     * @param {Node} starterNode 
     * @returns Node|null
     */
    getGainNode(starterNode)
    {
        console.log('summaryBodyTotalWidget getGainNode', starterNode);
        // if (this.gainNode) return this.gainNode; // short circuit if already found
        try
        {
            this.gainNode = starterNode.parentElement.nextElementSibling.childNodes[1];
        }
        catch (error)
        {
            // console.warn('did not find gain node');
        }
        return this.gainNode;
    }

    /**
     * Looks for graphs and sets the graphNode property if some are found.
     * @return {boolean} true if graphs were found, false otherwise
     */
    graphWasFound(nodes)
    {
        if (!nodes || !nodes.length) return false;
        for (const node of nodes)
        {
            if (node.parentElement) // look one node of so we can do a query on all descendants
            {
                const graphNode = node.parentElement.querySelector("#balance-charts"); // there may be more than one, hard to know
                if (graphNode)
                {
                    this.graphNode = graphNode;
                    return true;
                }
            }
        }
        return false;
    }
}