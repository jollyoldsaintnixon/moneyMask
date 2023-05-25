import { 
    stripToNumber, 
    toGraphDollars,
    toGainDollars,
    arrayToList
} from "../../../helpers";
import WidgetBase from "../../../WidgetBase";

/**
 * This class targets a particular "square" in the summary panel that shows 
 * the total value of all accounts. It is a secondary widget because changes
 * are determined by changes in a node outside of its scope.
 * TODO: I need to add a listener that updates the graph labels whenever one of the four graphs is first clicked. They do not load until clicked the first time, and there is a delay.
 */
export default class PanelGraphWidget extends WidgetBase 
{
    totalSelector = '.total-balance__value'; // account or portfolio total depending on whether on a specific account page
    commonAncestorSelector = '.balance-overtime-card-container.helios-override';
    catalystSelector = '.acct-selector__all-accounts > div:nth-child(2) > span:nth-child(2)';
    totalNode = null; // the node that shows the total portfolio value
    gainNodeSelector = '.today-change-value > span:first-child';
    gainNode = null; // this will be the node that shows the total portfolio gain/loss for the day
    percentNodeSelector = '.today-change-value > span:nth-child(2)';
    percentNode = null; // this represents the percent change for the day
   
    graphSelector = "#balance-charts";
    graphYAxisSelector = ".highcharts-yaxis-labels";
    graphNode = null;
    graphLabelNodes = arrayToList([]); 

    constructor(maskValue = 100, isMaskOn = false) 
    {
        super(maskValue, isMaskOn);
        this.maskGainNode = this.maskGainNode.bind(this);
        this.watchForCommonAncestor();

    }

    /************************ MASKERS ***********************/

    putMaskUp()
    {
        this.maskTotalNode();
        this.maskGainNode();
        this.maskGraphLabels();
    }

    /**
     * Matches this widget's portfolio total node text with that of the catalyst node.
     */
    maskTotalNode()
    {
        const catalystText = this.getCatalystText();
        if (catalystText.length) // we found the catalyst node and it had text
        {
            WidgetBase.maskUp(this.getTotalNode(), catalystText);
        }
    }

    /**
     * The gain node should be related to the first target node found based on the common ancestor node.
     */
    maskGainNode()
    {
        const gainNode = this.getGainNode();
        if (gainNode)
        {
            const total = this.getTotalText();
            const percentChange = this.getPercentChange();
            const gainDollars = toGainDollars(total * (percentChange / 100));
            WidgetBase.maskUp(gainNode, gainDollars)
        }
    }

    maskGraphLabels()
    {
        const graphNode = this.getGraphNode();
        if (graphNode)
        {
            const yAxisNode = WidgetBase.getNodes(graphNode, this.graphYAxisSelector);
            if (yAxisNode)
            {
                this.graphLabelNodes = WidgetBase.getNodes(yAxisNode, 'text', true);
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

    /******************** RESETTERS **********************/

    resetNodes()
    {
        this.resetTotalNode();
        this.resetGainNode();
        this.resetGraphLabels();
    }

    resetTotalNode()
    {
        WidgetBase.unmask(this.getTotalNode());
    }

    resetGainNode()
    {
        WidgetBase.unmask(this.getGainNode());
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

    /************************ GETTERS ***********************/

    /**
     * Should be the first node in the list of target nodes under the common ancestor.
     * @param {Node|NodeList} parentNodes the parent nodes to search under
     * @returns {Node} the node that shows the total value of all accounts
     */
    getTotalNode(parentNodes = this.getCommonAncestorNode())
    {
        if (!WidgetBase.isConnected(this.totalNode))
        {
            this.totalNode = WidgetBase.getNodes(parentNodes, this.totalSelector);
        }
        return this.totalNode;
    }

    getPercentNode()
    {
        if (!WidgetBase.isConnected(this.percentNode))
        {
            this.percentNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.percentNodeSelector);
        }
        return this.percentNode;
    }

    /**
     * Gets the text of the catalyst node or its clone, depending on mask up/down state. Defaults to empty string
     * @returns {string} the text of the catalyst node or its clone
     */
    getCatalystText()
    {
        const catalystNode = WidgetBase.getNodes(document, this.catalystSelector); // requery this node each time since it can be nonexistent, removed, or reloaded
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
    getTotalText()
    {
        let total = "0";
        const totalNode = this.getTotalNode();
        if (totalNode)
        {
            if (!this.isMaskOn) // mask is down, return original node text
            {
                total = totalNode.textContent;
            }
            else
            {
                if (totalNode.dataset.hasClone == "true") // mask is up and has clone
                {
                    total = totalNode.nextSibling.textContent;
                }
            }
        }
        return stripToNumber(total);
    }

    getPercentChange()
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
        if (!WidgetBase.isConnected(this.gainNode))
        {
            this.gainNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.gainNodeSelector);
        }
        return this.gainNode;
    }

    /**
     * 
     * @param {NodeList|Node} parentNodes defaults to document
     * @returns 
     */
    getGraphNode(parentNodes = document)
    {
        if (!WidgetBase.isConnected(this.graphNode))
        {
            this.graphNode = WidgetBase.getNodes(parentNodes, this.graphSelector);
        }
        return this.graphNode;
    }

    /************************ WATCHERS ***********************/

    activateWatchers()
    {
        this.initCommonAncestorListener();
        this.watchForTotalNode();
        this.watchForHighCharts();
    }

    /**
     * Immediately runs wasFoundLogic if node already exists.
     * Always listens for adding of nodes.
     */
    watchForTotalNode() 
    {
        const _onFoundLogic = () => {
            this.maskSwitch();
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.addedNodes.length && (mutation.type === 'childlist' || mutation.type === 'subtree'))
                && !this.graphHoverMutation()
                && this.getTotalNode(mutation.addedNodes))
                { 
                    _onFoundLogic();
                } 
            }
        };
        if (this.getTotalNode())
        {
            _onFoundLogic();
        }
        this.observers.totalObserver = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
    }

    /**
     * Immediately runs wasFoundLogic if graph already exists.
     * Always listens for adding of graph.
     */
    watchForHighCharts()
    {
        const _onFoundLogic = () => {
            if (this.isMaskOn)
            {
                this.maskGraphLabels();
                this.initHighChartsListener();
            }
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if ((mutation.addedNodes.length && (mutation.type === 'childList' || mutation.type === 'subtree'))
                && this.getGraphNode(mutation.addedNodes)) // only proc if graph node is within the addedNodes
                { 
                    _onFoundLogic();
                } 
            }
        };
        if (this.getGraphNode())
        {
            _onFoundLogic();
        }
        this.observers.graphObserver = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
    }

    /************************ HELPERS ***********************/

    initCommonAncestorListener()
    {
        const commonAncestor = this.getCommonAncestorNode();
        if (commonAncestor)
        {
            commonAncestor.addEventListener('click', () => {
                if (this.isMaskOn)
                {
                    this.maskGainNode();
                    this.maskGraphLabels();
                }
            });
        }
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
                this.maskGainNode(); // triggers when leaving 
                this.maskGraphLabels();
            }
        });
    }

    /**
     * @returns {boolean} true if graph is being hovered over
     */
    graphHoverMutation()
    {
        const graphNode = this.getGraphNode(this.getCommonAncestorNode());
        return (graphNode && graphNode.matches(":hover"));
    }
}