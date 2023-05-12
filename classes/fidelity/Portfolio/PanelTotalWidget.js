import { 
    stripToNumber, 
    toGraphDollars,
    toGainDollars,
    arrayToList
} from "../../helpers";
import OnlySecondaryWidgetBase from "../../OnlySecondaryWidgetBase";
import WidgetBase from "../../WidgetBase";

/**
 * This class targets a particular "square" in the summary panel that shows 
 * the total value of all accounts. It is a secondary widget because changes
 * are determined by changes in a node outside of its scope.
 * TODO: I need to add a listener that updates the graph labels whenever one of the four graphs is first clicked. They do not load until clicked the first time, and there is a delay.
 */
export default class PanelTotalWidget extends OnlySecondaryWidgetBase 
{
    targetNodeSelector = '.total-balance__value';
    targetCommonAncestorSelector = '.balance-overtime-card-container.helios-override'; // it is an element
    listenersInitiated = false; // this will listen for clicks on the common ancestor. The portfolio and gain nodes can be replaced when the user clicks on the common ancestor.
    catalystSelector = '.acct-selector__all-accounts > div:nth-child(2) > span:nth-child(2)';
    portfolioNode = null; // the node that shows the total portfolio value
    gainNodeSelector = '.today-change-value > span:first-child';
    gainNode = null; // this will be the node that shows the total portfolio gain/loss for the day
    percentNodeSelector = '.today-change-value > span:nth-child(2)';
    percentNode = null; // this represents the percent change for the day
   
    graphSelector = "#balance-charts";
    graphYAxisSelector = ".highcharts-yaxis-labels";
    graphNode = null;
    graphLabelNodes = arrayToList([]); 
    // graphObserver = null; // this will be the observer that watches for changes to a graph that reloads/replaces gain nodes

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.maskPortfolioTotalGainNode = this.maskPortfolioTotalGainNode.bind(this);
        // this.observers.graphObserver = null; // this will be the observer that watches for changes to a graph that reloads/replaces gain nodes
        this.maskUpOrDownSwitch(); // I couldn't figure out how to call this in OnlySecondaryWidgetBase constructor. The value of catalystSelector was that of OnlySecondaryWidgetBase, not PanelTotalWidget. Weird.
    }

    /**
     * Updates the "gain" node for each account (the gain/loss for the day).
     * Updates the sum value of all accounts.
     * ? is this ever called when the mask is down? if not, we can calculate the total much more easily.
     */
    maskSecondaryEffects()
    {
      // console.log('summaryBodyTotalWidget maskSecondaryEffects')
        if (!this.listenersInitiated) // only listen once
        {
            this.listenersInitiated = this.initiateListeners();
        }
        this.maskPortfolioTotalNode();
        this.maskPortfolioTotalGainNode();
        this.maskGraphLabels();
    }

    /**
     * Matches this widget's portfolio total node text with that of the catalyst node.
     */
    maskPortfolioTotalNode()
    {
        const catalystText = this.getCatalystText();
        if (catalystText.length) // we found the catalyst node and it had text
        {
            WidgetBase.maskUp(this.getPortfolioTotalNode(), catalystText);
        }
    }

    /**
     * The gain node should be related to the first target node found based on the common ancestor node.
     */
    maskPortfolioTotalGainNode()
    {
        const strippedTotal = this.getStrippedPortfolioTotal();
        const strippedPercentChange = this.getStrippedPercentChange();
        const gainDollars = toGainDollars(strippedTotal * (strippedPercentChange / 100));
        const gainNode = this.getGainNode(this.getPortfolioTotalNode());
        if (gainNode)
        {
            WidgetBase.maskUp(gainNode, gainDollars)
        }
    }

    maskGraphLabels()
    {
        const graphNode = this.getGraphNode();
        if (graphNode)
        {
            const yAxisNode = graphNode.querySelector(this.graphYAxisSelector);
            if (yAxisNode)
            {
                this.graphLabelNodes = yAxisNode.querySelectorAll('text' + WidgetBase.notCloneSelector);
                if (this.graphLabelNodes.length === 3) // there should only be three nodes
                {
                    const total = stripToNumber(this.getCatalystText());
                    WidgetBase.maskUp(this.graphLabelNodes[0], toGraphDollars(0));
                    WidgetBase.maskUp(this.graphLabelNodes[1], toGraphDollars(total/2));
                    WidgetBase.maskUp(this.graphLabelNodes[2], toGraphDollars(total));
                }
            }
        }
    }

    /**
     * Certain actions can reset/reload the gain nodes. These listen for those events
     * @returns boolean - true if successfully initiated
     */
    initiateListeners()
    {
        if (!this.getCommonAncestorNode()) // if the common ancestor isn't loaded, we can't initiate listeners. This will reattempt later.
        {
            return false;
        }
        this.initCommonAncestorListener();
        this.watchForHighCharts(); // the graphs are loaded after the page loads, so we need to watch for them
        return true;
    }

    initCommonAncestorListener()
    {
        const commonAncestor = this.getCommonAncestorNode();
        if (commonAncestor)
        {
            commonAncestor.addEventListener('click', () => {
                if (this.isMaskOn)
                {
                    this.maskPortfolioTotalGainNode();
                    this.maskGraphLabels();
                }
            });
        }
    }

    watchForHighCharts()
    {
        this.observers.graphObserver = WidgetBase.createObserver(this.getCommonAncestorNode(), (mutations) => {
          // console.log('summaryBodyTotalWidget watchForHighCharts callback');
            for (const mutation of mutations)
            {
                if ((mutation.addedNodes.length && mutation.type === 'childList' || mutation.type === 'subtree')
                    && this.getGraphNode(mutation.addedNodes))
                {
                    if (this.isMaskOn)
                    {
                        this.maskGraphLabels();
                    }
                    this.initHighChartsListener(); // this.graphNode is set by this.graphWasFound() if any nodes were found
                    this.observers.graphObserver.disconnect();
                    break;
                }
            }
        });
    }

    /**
     * 
     * @param {Node} graphNode 
     */
    initHighChartsListener()
    {
        this.getGraphNode().addEventListener('mouseleave', () => {
            if (this.isMaskOn)
            {
                this.maskPortfolioTotalGainNode(); // triggers when leaving 
                this.maskGraphLabels();
            }
        });
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

    getPercentNode()
    {
        let node = document.querySelector(this.percentNodeSelector);
        if (node && node.classList.contains(WidgetBase.cloneClass)) // if the node is a clone, we need to get the original
        {
            node = node.nextElementSibling;
        }
        return node;
    }

    /**
     * Gets the text of the catalyst node or its clone, depending on mask up/down state. Defaults to empty string
     * @returns {string} the text of the catalyst node or its clone
     */
    getCatalystText()
    {
        const catalystNode = document.querySelector(this.catalystSelector + WidgetBase.notCloneSelector); // requery this node each time since it can be nonexistent, removed, or reloaded
        if (catalystNode)
        {
            if (!this.isMaskOn) // mask is down, return original node text
            {
                return catalystNode.textContent;
            }
            else if (catalystNode.dataset.hasClone == "true") // mask is up, check for clone
            {
                return catalystNode.nextSibling.textContent;
            }
        }
        return ""; // default return empty string
    }

    /**
     * Gets the float representation of the portfolio total node or its clone, depending on mask up/down state. Defaults to 0.
     */
    getStrippedPortfolioTotal()
    {
        let total = "0";
        const portfolioNode = this.getPortfolioTotalNode();
        if (portfolioNode)
        {
            if (!this.isMaskOn) // mask is down, return original node text
            {
                total = portfolioNode.textContent;
            }
            else
            {
                if (portfolioNode.dataset.hasClone == "true") // mask is up and has clone
                {
                    total = portfolioNode.nextSibling.textContent;
                }
            }
        }
        return stripToNumber(total);
    }

    getStrippedPercentChange()
    {
        const percentNode = this.getPercentNode();
        if (percentNode)
        {
            return stripToNumber(percentNode.textContent);
        }
        else
        {
            return 0;
        }
    }

    /**
     * Get the gain/loss node for the given node.
     * The gain node is the node with the daily gain/loss value.
     * Memoize it since it should remain in place once added.
     * 
     * @returns Node|null
     */
    getGainNode()
    {
        // const commonAncestor = this.getCommonAncestorNode();
      // console.log('summaryBodyTotalWidget getGainNode', starterNode);
        // if (this.gainNode) return this.gainNode; // short circuit if already found
        let gainNode = null;
        try
        {
            // gainNode = starterNode.parentElement.nextElementSibling.childNodes[1];
            gainNode = this.getCommonAncestorNode().querySelector(this.gainNodeSelector);
        }
        catch (error)
        {
            gainNode = null;
        }
        return gainNode;
    }

    /**
     * 
     * @param {NodeList|Node} nodes defaul;ts to document
     * @returns 
     */
    getGraphNode(nodes = document)
    {
        // this.graphNode = this.graphNode ?? document.querySelector(this.graphSelector);
        if (!this.graphNode || !this.graphNode.isConnected)
        {
            this.graphNode = WidgetBase.getNodes(nodes, this.graphSelector);
        }
        return this.graphNode;
    }

    resetSecondaryEffects()
    {
      // console.log('summaryBodyTotalWidget resetSecondaryEffects');
        this.resetPortfolioTotalNode();
        this.resetPortfolioTotalGainNode();
        this.resetGraphLabels();
    }

    resetPortfolioTotalNode()
    {
        WidgetBase.unmask(this.getPortfolioTotalNode());
    }

    resetPortfolioTotalGainNode()
    {
        WidgetBase.unmask(this.getGainNode(this.getPortfolioTotalNode()));
    }

    resetGraphLabels()
    {
        if (this.graphLabelNodes && this.graphLabelNodes.length)
        {
            for (const node of this.graphLabelNodes)
            {
                WidgetBase.unmask(node);
            }
        }
    }

    /**
     *  Overwritten from parent since we don't want to trigger a maskUpOrDownSwitch whenever we scroll over Watches over only the set of nodes that are relevant to the widget.
     */
    activateTargetedObserver() 
    {
        this.targetCommonAncestorNode = this.targetCommonAncestorNode ?? document.querySelectorAll(this.targetCommonAncestorSelector); // set targetCommonAncestorNode if it is not already set
        // console.log("widget activateTargetedObserver")
        this.observers.targetedObserver = WidgetBase.createObserver(this.targetCommonAncestorNode, (mutations) => {
            // console.log("widget targetedObserver callback")
            // console.log("target mutations.length: ", mutations.length)
            for (const mutation of mutations)
            {
                if ((mutation.type === 'childList' || mutation.type === 'subtree')
                    && !this.graphScrollMutation() // ! this is the change from the parent
                    && this.refreshTargetNodes(this.targetCommonAncestorNode).length) // this.targetNodeList will be set here
                {
                    this.maskUpOrDownSwitch();
                    break; // break out of the loop for efficiency
                }
            }
        });
    }

    graphScrollMutation()
    {
        const graphNode = this.getGraphNode(this.getCommonAncestorNode());
        return (graphNode && graphNode.matches(":hover"));
    }
}