import {
    toDollars,
    dollarsToFloat,
    arrayToList,
    applyToSingleElemOrList
 } from "./helpers";

export default class WidgetBase 
{
    static cloneClass = 'money-mask-clone';
    static notCloneSelector = ':not(.money-mask-clone)';
    static blurClass = 'money-mask-blurred';
    static observerConfig = { // default observer config
        childList: true,
        subtree: true,
    }


    maskValue = 100;
    isMaskOn = false;

    targetNodeList = arrayToList([]); // initialize as empty list 

    targetNodeSelector = 'body'; // This should locate any target node. // !Overwrite in child.
    targetCommonAncestorSelector = 'body'; // This should select the overarching container of the widget. // ! Overwrite in child.
    wideAreaSearchSelector = 'body'; // probably does not need to be overwritten

    targetCommonAncestorNode = null; // This is the overarching container of the widget.
    wideAreaSearchNode = null; // this should very likely be the entire body

    observers = {
        searchingObserver: null, // runs until targets found
        targetedObserver: null, // only watches targets
    }

    constructor(maskValue = 100, isMaskOn = false) 
    {
      // console.log("widget constuctor")
        this.maskValue = maskValue;
        this.isMaskOn = isMaskOn;
        this.activateWideSearchObserver();
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
      // console.log("widget updateMaskValue", maskValue)
        this.maskValue = maskValue;
        this.maskUpOrDownSwitch();
    }

    /**
     * This should be called when the mask up/down state is toggled. Sets this.isMaskOn to the new value, then calls the appropriate function.
     * @param {bool} isMaskOn 
     */
    updateMaskActivated(isMaskOn)
    {
        this.isMaskOn = isMaskOn;
        this.maskUpOrDownSwitch();
    }

    /**
     * Determines the action to take based on the current mask state.
     */
    maskUpOrDownSwitch()
    {
        if (this.isMaskOn)
        {
            WidgetBase.maskUp(this.getTargetNodes(), toDollars(this.maskValue));
            this.maskSecondaryEffects();
        }
        else
        {
            WidgetBase.unmask(this.getTargetNodes());
            this.resetSecondaryEffects();
        }
    }

    /**
     * Disconnects ann observers.
     */
    deactivate()
    {
        for (const key in this.observers)
        {
            if (this.observers.hasOwnProperty(key))
            {
                const observer = this.observers[key];
                if (observer) // make sure it is not set to null
                {
                    observer.disconnect();
                }
            }
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
    activateWideSearchObserver() 
    {
      // console.log("widget activateWideSearchObserver")
        this.observers.searchingObserver = WidgetBase.createObserver(this.getWideAreaSearchNode(), (mutations) => {
          // console.log("widget activateWideSearchObserver callback")
          // console.log("search mutations.length: ", mutations.length)
            for (const mutation of mutations) 
            {
                if (
                    (mutation.type === 'childList' || mutation.type === 'subtree')
                    && this.getTargetNodes(mutation.addedNodes).length // checks for the targetNodes each time
                ) 
                {
                    try 
                    { 
                        this.maskUpOrDownSwitch();
                        this.activateTargetedObserver();
                    } 
                    catch (error) 
                    {
                        console.warn(error)
                    }
                    finally
                    {
                        this.observers.searchingObserver.disconnect();
                        break;
                    }
                }
            }
        })
    }

    /**
     * Watches over only the set of nodes that are relevant to the widget.
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
                    && this.refreshTargetNodes(this.targetCommonAncestorNode).length) // this.targetNodeList will be set here
                {
                    this.maskUpOrDownSwitch();
                    break; // break out of the loop for efficiency
                }
            }
        });
    }

    /**
     * Search the nodeList for the target nodes. Short circuits if the targetNodeList already found.
     * Returns the targetNodeList and saves it to this.targetNodeList if it's empty.
     * @param {NodeList|Node} nodeList 
     */
    getTargetNodes(nodeList = this.getWideAreaSearchNode())
    {
      // console.log("widget targetNodeList")
        if (this.targetNodeList && this.targetNodeList.length) // short circuit
        {
            return this.targetNodeList;
        }
        this.targetNodeList = this.findTargetNodes(nodeList);
        return this.targetNodeList;
    }

    /**
     * Returns the wide area node to search for target nodes (defaults to 'body').
     * @returns {Node} wideAreaSearchNode
     */
    getWideAreaSearchNode()
    {
        if (!this.wideAreaSearchNode)
        {
            this.wideAreaSearchNode = document.querySelector(this.wideAreaSearchSelector);
        }
        return this.wideAreaSearchNode;
    }

    /**
     * Searches again for target nodes. If any found, resets current targetNodeList to the new targets nodes
     * @param {NodeList|Node} nodeList 
     * @returns {NodeList} targetNodeList
     */
    refreshTargetNodes(nodeList = this.getWideAreaSearchNode())
    {
      // console.log("widget refreshTargetNodes", nodeList)
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
      // console.log("widget findTargetNodes", nodeList)
        const _findTargetNodes = (node) => { // sub function for handling cases when a single node is passed in and when a nodeList is passed in
            // check if it's an element and if there are any sub elements that match our target selector
            if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll(this.targetNodeSelector + WidgetBase.notCloneSelector).length)
            {
                this.targetNodeList = node.querySelectorAll(this.targetNodeSelector);
                return true;
            }
        };
        applyToSingleElemOrList(nodeList, _findTargetNodes);
        return this.targetNodeList;
    }

    /**
     * Trigger any after/secondary mask up effects here. // ! This should be overwritten in child classes.
     * Effects should be determined by values in targetNodeList.
     * @returns {void}
     */
    maskSecondaryEffects()
    {
        return;
    }

    /**
     * Reset any after/secondary effects here. // ! This should be overwritten in child classes.
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
    getMaskedProportion(totalDollars, proportionDollars)
    {
        const proportion = dollarsToFloat(proportionDollars) / dollarsToFloat(totalDollars);
        return this.maskValue * proportion;
    }
    
    /**
     * The central logic behind concealing the monetary value. Reveals the clones, which will show the mask value, and hides the originals.
     * @param {Node|NodeList} nodes
     * @param {string} maskCurrencyString
     */
    static maskUp(nodes, maskCurrencyString)
    {
        const _maskUp = (node) => { // subfunction
                if (!node.dataset || !node.dataset.hasClone) // if it doesn't have a clone, create one
                {
                    WidgetBase.makeClones(node);
                }
                WidgetBase.hideNode(node); // hide the original node
                const clone = node.nextSibling;
                WidgetBase.showNode(clone); // reveal clone
                clone.textContent = maskCurrencyString;
        }
        applyToSingleElemOrList(nodes, _maskUp);
    }

    /**
     * Reveal the original nodes (which have the original values) and hide the clones (which have the masked value).
     * @param {NodeList|Node} nodes
     */
    static unmask(nodes)
    {
        const _unmask = (node) => {
            WidgetBase.showNode(node); // reveal the original node
            if (node.dataset.hasClone == "true") // ensure it does have a clone
            {
                WidgetBase.hideNode(node.nextSibling);// hide the clone
            }
        }
      // console.log("widget maskDown")
        // make sure we have values to restore
        applyToSingleElemOrList(nodes, _unmask);
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
     * @param {number} watchAncestorDepth how many levels up the tree to watch
     * @param {object} observerConfig defaults to WidgetBase.observerConfig
     * @returns 
     */
    static createObserver(nodes, observerCallBack, watchAncestor = false, watchAncestorDepth = 5, observerConfig = WidgetBase.observerConfig)
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
            observer.observe(node, observerConfig);
        }
        // console.log("base createObserver")    
        applyToSingleElemOrList(nodes, _watchNode, observer);
        return observer;
    }

    /**
     * Makes clones of the nodes or node
     * @param {NodeList|Node} nodes 
     */
    static makeClones(nodes)
    {
        const _makeClone = (node) => {
            if (!node.dataset || node.dataset.hasClone == "true")
            {
                return; // do not make a clone if it already has one
            }
            const clone = node.cloneNode(true);
            clone.classList.add(WidgetBase.cloneClass); // add class to the clone so we can target later
            // append the node after the original node
            if (node.nextSibling)
            {
                node.parentNode.insertBefore(clone, node.nextSibling);
            }
            else
            {
                node.parentNode.appendChild(clone);
            }
            // update original node to show it has a clone
            node.setAttribute('data-has-clone', "true");

        };
        applyToSingleElemOrList(nodes, _makeClone);
    }

    /**
     * Hide the node by memoizing the original display value in the dataset and then 
     * setting the display to none. We do this way instead of adding a class because some 
     * pre-existing CSS selectors may override our class.
     * @param {Node} node
     */
    static hideNode(node)
    {
        if (!node.dataset)
        {
            node.dataset = {};
        }
        if (node.dataset.originalDisplay === undefined) // don't accidentally overwrite with "none"
        {
            node.dataset.originalDisplay = node.style.display ? node.style.display : ""; // the empty string defaults to the element's default display value
        }
        node.style.display = "none";
    }

    /**
     * Restore the node's display value to the original value. We do this way instead of adding a 
     * class because some pre-existing CSS selectors may override our class.
     * @param {Node} node 
     */
    static showNode(node)
    {
        if (node.style.display == "none")
        {
            if (node.dataset && node.dataset.originalDisplay !== false) // make sure it has been set
            {
                node.style.display = node.dataset.originalDisplay;
            }
            else
            {
                node.style.display = ""; // the empty string defaults to the element's default display value
            }
        }
        // do nothing if it is not hidden
    }

    static tryDisconnect(observer)
    {
        if (observer instanceof MutationObserver)
        {
            observer.disconnect();
        }
    }

    /**
     * Return a node found within a node list. If selectAll is true, return a list of nodes.
     * @param {NodeList|Node|null} nodes 
     * @param {string} selector 
     * @param {boolean} selectAll whether to select all nodes that match the selector or just the first
     * @returns {Node|NodeList|null}
     */
    static getNodeFromList(nodes, selector, selectAll = false)
    {
        let needleNode = null;
        const _getNodeFromList = (node) => {
            if ((!needleNode // if we found what we are looking for, do nothing
                || (typeof needleNode[Symbol.iterator] === 'function' && !needleNode.length)) // case it is an empty list
                && node.nodeType === Node.ELEMENT_NODE)
            {
                needleNode = selectAll ? node.querySelectorAll(selector) : node.querySelector(selector);
            }
        }
        applyToSingleElemOrList(nodes, _getNodeFromList); // should set needleNode
        return needleNode;
    }
}