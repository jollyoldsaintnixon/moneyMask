import {
    toDollars,
    dollarsToFloat,
    arrayToList,
 } from "./helpers";

export default class WidgetBase 
{
    static observerConfig = {
        childList: true,
        subtree: true,
    }

    maskValue = 100;
    isMaskOn = false;

    targetNodeList = arrayToList([]); // initialize as empty list 

    targetNodeSelector = 'body'; // * This should locate any target node. Overwrite in child.
    targetCommonAncestorSelector = 'body'; // * This should select the overarching container of the widget. Overwrite in child.
    wideAreaSearchSelector = 'body'; // probably does not need to be overwritten

    targetCommonAncestorNode = null; // * This is the overarching container of the widget.
    wideAreaSearchNode = null; // this should very likely be the entire body


    searchingObserver; // runs until targets found
    targetedObserver; // only watches targets

    constructor(maskValue = 100, isMaskOn = false) 
    {
        console.log("widget constuctor")
        this.maskValue = maskValue;
        this.isMaskOn = isMaskOn;
        this.activateSearchingObserver();
    }

    /**
     * Should be called whenever the user changes the desired
     * mask value in the pop up.
     * 
     * @param {int} maskValue 
     * @returns {void}
     */
    updateMaskValue(maskValue)
    {
        console.log("widget updateMaskValue", maskValue)
        this.maskValue = maskValue;
        // determine if we need to update the displayed mask
        if (this.isMaskOn)
        {
            this.updateDisplayedMaskValue();
        }
    }

    updateDisplayedMaskValue()
    {
        console.log("widget updateDisplayedMaskValue")
        for (const ele of this.targetNodeList)
        {
            ele.textContent = toDollars(this.maskValue);
        }
    }

    /**
     * This is the main function that should be called when the mask is toggled. Sets this.isMaskOn to the new value, then calls the appropriate function.
     * @param {bool} incomingIsMaskOn 
     */
    updateMaskActivated(incomingIsMaskOn)
    {
        console.log("widget updateMaskActivated", incomingIsMaskOn)
        if (incomingIsMaskOn)
        {
            if (!this.isMaskOn) // if the mask was down, save the values before putting it up
            {
                this.saveValues(this.targetNodeList);
            }
            this.maskUp();
        }
        else
        {
            this.maskDown();
        }
        this.isMaskOn = incomingIsMaskOn;
        // incomingIsMaskOn ? this.maskUp() : this.maskDown();
        // this.maskUpOrDownSwitch();
    }

    /**
     * Determines the action to take based on the current mask state.
     */
    maskUpOrDownSwitch()
    {
        if (this.isMaskOn)
        {
            this.updateDisplayedMaskValue();
        }
        else
        {
            this.saveValues(this.targetNodeList);
        }
    }
    
    /**
     * The central logic behind concealing the monetary value. Saves the node's
     * original value in the node's data attribute, then replaces the textContent
     */
    maskUp()
    {
        console.log("widget maskUp")

        // this.saveValues(this.targetNodeList);
        // for (const ele of this.targetNodeList)
        // {
        //     ele.textContent = toDollars(this.maskValue);
        // }
        this.updateDisplayedMaskValue();
        this.maskSecondaryEffects();
    }

    /**
     * Disconnects ann observers.
     */
    deactivate()
    {
        console.log("widget deactivate")
        if (this.searchingObserver)
        {
            this.searchingObserver.disconnect();
        }
        if (this.targetedObserver)
        {
            this.targetedObserver.disconnect();
        }
    }

    /**
     * Saves the original values of the node list in the node's data attribute.
     * 
     * @param {NodeList} nodeList
     */
    saveValues(nodeList)
    {
        console.log("widget saveValues", nodeList)
        if (nodeList.length)
        {
            for (const node of nodeList) // Node
            {
                this.saveValue(node);
            }
        }
    }

    /**
     * Save the original value of a single node so long as no original value has been saved OR the incoming value is not equal to the node's current textContent.
     * @param {Node} node 
     * @param {int|float} incomingValue: should be a number or a string representing a number 
     */
    saveValue(node, incomingValue = this.maskValue)
    {
        incomingValue = toDollars(incomingValue);
        // if (!node.dataset.originalValue // do save if nothing is there
        //     || node.dataset.originalValue == '' // do save if empty string
        //     // || node.textContent != toDollars(incomingValue))
        //     || node.textContent != incomingValue) // but if there is something there, do not save if the incoming value is the same as the current value
        // if (!node.dataset.originalValue) // save if not saved already // ! this works but I don't like it- we want to be able to see the changing values
        // if (this.isMaskOn) // this should only trigger when we are in the process of putting the mask on/up
        // {
            node.setAttribute('data-original-value', node.textContent);
        // }
    }

    /**
     * Restore the original values of the target nodes.
     * Used when masking/demasking.
     */
    maskDown()
    {
        console.log("widget maskDown")
        // make sure we have values to restore
        for (const node of this.targetNodeList)
        {
            this.resetNodeValue(node);
        }
        this.resetSecondaryEffects();
        this.isMaskOn = false;
    }

    /**
     * Restore the original values of the node, but check first if the node has an original value saved.
     * @param {Node} node 
     */
    resetNodeValue(node)
    {
        console.log("widget resetNodeValue", node)
        if (node.dataset.originalValue)
        {
            node.textContent = node.dataset.originalValue;
        }
    }

    /**
     * The searchingObserver is called whenever the DOM updates
     * (eg returning AJAX requests). It searches for the element containing
     * the unmasked monetary value; once that element is loaded, it should deactivate.
     * Monitoring then passes to the targetedObserver, which only watches the 
     * specific elements we care about.
     * ?  could we simply change the wideAreaSearchSelector to the targetNodeList?
     */
    activateSearchingObserver() 
    {
        this.wideAreaSearchNode = this.wideAreaSearchNode ?? document.querySelectorAll(this.wideAreaSearchSelector); // set wideAreaSearchNode if it is not already set
        console.log("widget activateSearchingObserver")
        this.searchingObserver = WidgetBase.createObserver(this.wideAreaSearchNode, (mutations) => {
            console.log("widget activateSearchingObserver callback")
            console.log("search mutations.length: ", mutations.length)
            for (const mutation of mutations) 
            {
                if (
                    (mutation.type === 'childList' || mutation.type === 'subtree')
                    && this.getTargetNodes(mutation.addedNodes).length // checks for the targetNodes each time
                ) 
                {
                    try 
                    {    
                        // this triggers the very first time (and only the first time) that the target nodes are found. Save values regardless of isMaskOn state. Then maskUp if isMaskOn.
                        this.saveValues(this.targetNodeList);
                        if (this.isMaskOn)
                        {
                            this.maskUp();
                        }
                        this.activateTargetedObserver();
                    } 
                    catch (error) 
                    {
                        console.warn(error)
                    }
                    finally
                    {
                        this.searchingObserver.disconnect();
                        break;
                    }
                }
            }
        })
    }

    activateTargetedObserver() 
    {
        this.targetCommonAncestorNode = this.targetCommonAncestorNode ?? document.querySelectorAll(this.targetCommonAncestorSelector); // set targetCommonAncestorNode if it is not already set
        console.log("widget activateTargetedObserver")
        this.targetedObserver = WidgetBase.createObserver(this.targetCommonAncestorNode, (mutations) => {
            console.log("widget targetedObserver callback")
            console.log("target mutations.length: ", mutations.length)
            for (const mutation of mutations)
            {
                // if (!this.internalUpdate(mutation) 
                // && (mutation.type === 'childList' || mutation.type === 'subtree')
                if ((mutation.type === 'childList' || mutation.type === 'subtree')
                    && this.refreshTargetNodes(this.targetCommonAncestorNode).length) // this.targetNodeList will be set here
                {
                    if (this.unsavedNodes(this.targetNodeList)) // see if there are any nodes that have not been saved
                    {
                        this.saveValues(this.targetNodeList);
                    }
                    this.maskUpOrDownSwitch();
                    break; // break out of the loop for efficiency
                }
            }
        });
    }

    /**
     * Check if the node has dataset.originalValue set. Return true if not set.
     * @param {NodeList|Node} nodes 
     * @returns {boolean}
     */
    unsavedNodes(nodes)
    {
        if (nodes instanceof NodeList)
        {
            for (const node of nodes)
            {
                if (!node.dataset.originalValue)
                {
                    return true;
                }
            }
            return false;
        }
        else // single node
        {
            if (!nodes.dataset.originalValue)
            {
                return true;
            }
        }
    }

    // /**
    //  * Returns true if the mutation was a result of our own maskUp. This is to
    //  * prevent infinite loops. (Technically returns true if the textContent of the mutated node is the same as this.maskValue.)
    //  * @param {MutationRecord} mutation 
    //  * @returns {boolean}
    //  */
    // internalUpdate(mutation)
    // {
    //     console.log("widget internalUpdate")
    //     return mutation.target.textContent == toDollars(this.maskValue)
    // }

    /**
     * Search the nodeList for the target nodes. Short circuits if the targetNodeList already found.
     * Returns the targetNodeList and saves it to this.targetNodeList if it's empty.
     * @param {NodeList|Node} nodeList 
     */
    getTargetNodes(nodeList = this.wideAreaSearchNode)
    {
        console.log("widget targetNodeList")
        if (this.targetNodeList && this.targetNodeList.length) // short circuit
        {
            return this.targetNodeList;
        }
        this.targetNodeList = this.findTargetNodes(nodeList);
        return this.targetNodeList;
    }

    /**
     * Searches again for target nodes. If any found, resets current targetNodeList to the new targets nodes
     * @param {NodeList|Node} nodeList 
     * @returns {NodeList} targetNodeList
     */
    refreshTargetNodes(nodeList = this.wideAreaSearchNode)
    {
        console.log("widget refreshTargetNodes", nodeList)
        const targetNodeList = this.findTargetNodes(nodeList);
        if (targetNodeList.length)
        {
            this.targetNodeList = targetNodeList;
        }
        return targetNodeList;
    }

    /**
     * ! Be sure to overwrite "targetNodeSelector" in child class. 
     * Returns the nodes that the widget should update. 
     * * Will overwrite this.targetNodeList if any matches are found.
     * 
     * @returns {NodeList|Node} targetNodeList
     */
    findTargetNodes(nodeList = this.nodeToSearch)
    {
        console.log("widget findTargetNodes", nodeList)
        const _findTargetNodes = (node) => { // sub function for handling cases when a single node is passed in and when a nodeList is passed in
            // check if it's an element and if there are any sub elements that match our target selector
            if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll(this.targetNodeSelector).length)
            {
                this.targetNodeList = node.querySelectorAll(this.targetNodeSelector);
                return true;
            }
        };
        if (nodeList instanceof NodeList) // is NodeList
        {
            for (const node of nodeList)
            {
                if (_findTargetNodes(node))
                {
                    break;
                }
            }
        }
        else // is single node
        {
            _findTargetNodes(nodeList);
        }
        return this.targetNodeList;
    }

    /**
     * Trigger any after/secondary effects here. This should be overwritten in child classes.
     * Effects should be determined by values in targetNodeList.
     * @returns {void}
     */
    maskSecondaryEffects()
    {
        return;
    }

    /**
     * Reset any after/secondary effects here. This should be overwritten in child classes.
     * @returns {void}
     */
    resetSecondaryEffects()
    {
        return;
    }

    /**
     * Convert the old fraction to a amount based on the mask value.
     * @param {string} totalDollars the original total
     * @param {string} proportionDollars the fraction of the totalDollars
     * @returns {float}
     */
    makeProportions(totalDollars, proportionDollars)
    {
        const proportion = dollarsToFloat(proportionDollars) / dollarsToFloat(totalDollars);
        return this.maskValue * proportion;
    }

    /**
     * Create an observer over each node in the node list.
     * Set "watchAncestor" to true if you want to watch an ancestor node instead of the node itself.
     * Watching the ancestor allows for the callback to be triggered when the target node is removed
     * from the DOM.
     * 
     * @param {NodeList|Node} nodes 
     * @param {Function} observerCallBack 
     * @param {boolean} watchAncestor whether to watch the parent node or the node itself
     * @returns 
     */
    static createObserver(nodes, observerCallBack, watchAncestor = false, watchAncestorDepth = 5)
    {
        const observer = new MutationObserver(observerCallBack);
        const _watchNode = (node, observer) => { // subfunction to call on each node in nodes
            if (watchAncestor) // if we want to watch the ancestor, crawl on up the tree. the loop count is based on trial and error.
            {
                for (let i=0; i<watchAncestorDepth; i++)
                {
                    node = node.parentElement;
                }
            }
            observer.observe(node, WidgetBase.observerConfig);
        }
        // console.log("base createObserver")    
        if (nodes instanceof NodeList) // is NodeList
        {
            for (let node of nodes)
            {
                _watchNode(node, observer);
            }
        }
        else // is single node
        {
            _watchNode(nodes, observer);
        }
        return observer;
    }
}