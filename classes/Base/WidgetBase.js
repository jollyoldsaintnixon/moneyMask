import {
    stripToNumber,
    applyToSingleElemOrList
 } from "../helpers";

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

    commonAncestorSelector = 'body'; // This should select the overarching container of the widget. // ! Overwrite in child.
    wideAreaSearchSelector = 'body'; // Selects the node within which to search for the common ancestor of the widget (probably does not need to be overwritten)

    commonAncestorNode = null; // This is the overarching container of the widget.
    wideAreaSearchNode = null; // Node within which to to search for the common ancestor

    observers = { // whenever observers are added by the widget, ensure they are stored here so they can be disconnected later. Key is the string name of the observer, value is the observer itself.
    }

    traits = []; // list of traits that the widget has. should be used in the widget's constructor by instantiating the trait inside this array. this is really used only to document the traits that the widget has so it is more clear why we are instantiating other classes inside the widget's constructor.

    constructor(maskValue = 100, isMaskOn = false) // ! each child should define its own constructor and call this.watchForCommonAncestor() after super.
    {
        this.maskValue = maskValue;
        this.isMaskOn = isMaskOn;
    }

    /******************** CORE **********************/

    /**
     * Should be called whenever the user changes the desired
     * mask value in the pop up.
     * @param {int} maskValue 
     * @returns {void}
     */
    updateMaskValue(maskValue)
    {
        this.maskValue = maskValue;
        this.maskSwitch();
    }

    /**
     * This should be called when the mask up/down state is toggled. Sets this.isMaskOn to the new value, then calls the appropriate function.
     * @param {bool} isMaskOn 
     */
    updateMaskActivated(isMaskOn)
    {
        this.isMaskOn = isMaskOn;
        this.maskSwitch();
    }

    /**
     * Determines the action to take based on the current mask state.
     */
    maskSwitch()
    {
        if (this.isMaskOn)
        {
            this.putMaskUp(); // * overwrite in child
        }
        else
        {
            this.resetNodes(); // * overwrite in child
        }
    }

    /**
     * Called when removing the widget. Disconnects any observers.
     */
    deactivate()
    {
        for (const key in this.observers)
        {
            if (this.observers.hasOwnProperty(key))
            {
                this.tryDisconnect(key);
            }
        }
    }

    /******************** MASKERS **********************/

    /**
     * Call the masking logic. // ! This should be overwritten in child classes.
     */
    putMaskUp()
    {
        return;
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

    /******************** RESETTERS **********************/

    /**
     * Reset any after/secondary effects here. // ! This should be overwritten in child classes.
     * @returns {void}
     */
    resetNodes()
    {
        return;
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
        applyToSingleElemOrList(nodes, _unmask);
    }

    /**
     * Call unmask on all nodes in the tree.
     * @param {NodeList|Node} nodes 
     */
    static unmaskTree(nodes)
    {
        const _unmaskTree = (node) => {
            if (!node || node.nodeType !== Node.ELEMENT_NODE) 
            {
                return; // only care about element nodes
            }
            WidgetBase.unmask(node); // unmask this node
            for (const child of node.childNodes)
            {
                if (child.classList && child.classList.contains(WidgetBase.cloneClass)) // skip clones
                {
                    continue;
                }
                _unmaskTree(child); // recurse on down
            }
        }
        applyToSingleElemOrList(nodes, _unmaskTree);
    }

    /******************** GETTERS **********************/
        
    /**
     * @param {NodeList|Node} nodes
     * @returns {Node} common ancestor of the target nodes
     */
    getCommonAncestorNode(nodes = this.getWideAreaSearchNode())
    {
        if (!WidgetBase.isConnected(this.commonAncestorNode))
        {
            this.commonAncestorNode = WidgetBase.getNodes(nodes, this.commonAncestorSelector);
        }
        return this.commonAncestorNode;
    }

    /**
     * Returns the wide area node to search for common ancestor within (defaults to 'body').
     * @returns {Node} wideAreaSearchNode
     */
    getWideAreaSearchNode()
    {
        if (!WidgetBase.isConnected(this.wideAreaSearchNode))
        {
            this.wideAreaSearchNode = WidgetBase.getNodes(document, this.wideAreaSearchSelector);
        }
        return this.wideAreaSearchNode;
    }

    /**
     * Return a node found within a node list. If selectAll is true, return a list of nodes.
     * Excludes clones.
     * @param {NodeList|Node|null} parentNodes nodes to search under. can be single node.
     * @param {string} selector 
     * @param {boolean} selectAll whether to select all nodes that match the selector or just the first. defaults to false.
     * @returns {Node|NodeList|null}
     */
    static getNodes(parentNodes, selector, selectAll = false)
    {
        if (!parentNodes || (typeof parentNodes[Symbol.iterator] === 'function' && !parentNodes.length) || !WidgetBase.isConnected(parentNodes)) // if no parent nodes or not connected, return null
        {
            return null;
        }
        selector += WidgetBase.notCloneSelector; // exclude clones
        let target = null;
        const _getNodes = (node) => {
            if ((!target // if we found what we are looking for, do nothing
                || (typeof target[Symbol.iterator] === 'function' && !target.length)) // case it is an empty list
                && (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_NODE))
            {
                target = selectAll ? node.querySelectorAll(selector) : node.querySelector(selector);
            }
        }
        applyToSingleElemOrList(parentNodes, _getNodes); // should set target
        return target;
    }

    /**
     * Get the clone of the node. Returns null if none found.
     * @param {Node} node
     * @returns {Node|null} the clone of the node 
     */
    static getClone(node)
    {
        let clone = null;
        const sibling = node.nextSibling;
        if (sibling && sibling.classList.contains(WidgetBase.cloneClass))
        {
            clone = sibling;
        }
        return clone;
    }

    /******************** WATCHERS **********************/

    /**
     * This is called from the WidgetBase constructor. It watches for the common ancestor node to be added to the DOM. The common ancestor node is the node that delineates the boundary of the widget; all nodes that the widget updates should be within its boundaries.
     * - Calls activateWatchers() when the common ancestor node is found.
     * - Does not initiate observer if common ancestor node already exists, instead calls activateWatchers() immediately.
     * - Disconnects when common ancestor node is found.
     */
    watchForCommonAncestor()
    {
        const _onFoundLogic = () => {
            this.activateWatchers();
        }
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if (mutation.addedNodes.length && (mutation.type === 'childList' || mutation.type === 'subtree')
                    && this.getCommonAncestorNode())
                {
                    _onFoundLogic();
                    this.tryDisconnect("commonAncestor");
                    break;
                }
            }
        };
        if (this.getCommonAncestorNode()) // common ancestor already exists, so we don't need to watch for it
        {
            _onFoundLogic();
        }
        else // common ancestor does not exist, so we need to watch for it
        {
            this.observers.commonAncestor = WidgetBase.createObserver(this.getWideAreaSearchNode(), _watchLogic);
        }
    }

    /**
     * ! OVERWRITE IN CHILD
     * This is called when the widget's common ancestor is added to the DOM. It should activate all watchers of nodes that the widget updates or otherwise observers.
     */
    activateWatchers()
    {
        return;
    }

    /**
     * 
     * @param {string} observerName
     */
    tryDisconnect(observerName)
    {
        const observer = this.observers[observerName];
        if (observer instanceof MutationObserver)
        {
            observer.disconnect();
        }
        this.observers[observerName] = null;
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
        applyToSingleElemOrList(nodes, _watchNode, observer);
        return observer;
    }

    /******************** HELPERS **********************/

    /**
     * Convert the old fraction to a amount based on the mask value.
     * @param {string} totalDollars the original total
     * @param {string} proportionDollars the fraction of the totalDollars
     * @returns {float}
     */
    getMaskedProportion(totalDollars, proportionDollars)
    {
        const proportion = stripToNumber(proportionDollars) / stripToNumber(totalDollars);
        return this.maskValue * proportion;
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

    /**
     * Takes in a single node or a list of nodes. If any node is no longer connected to the DOM, returns false. Also returns false if the node is null or the list is empty.
     * NB: We don't call applyToSingleElemOrList here because it is more efficient to do a modified "some" loop
     * @param {Node|Nodelist} nodes
     * @returns {boolean} whether the node or all nodes in list is/are connected to the DOM
     */
    static isConnected(nodes)
    {
        const _isConnected = (node) => {
            return node.isConnected;
        }
        if (!nodes || (typeof nodes[Symbol.iterator] === 'function' && nodes.length === 0)) // return false if no nodes
        { 
            return false;
        }
        else if (typeof nodes[Symbol.iterator] === 'function') // list of nodes
        {
            for (const node of nodes)
            {
                if (!_isConnected(node))
                {
                    return false;
                }
            }
            return true;
        }
        else // single node
        {
            return _isConnected(nodes);
        }
    }
}