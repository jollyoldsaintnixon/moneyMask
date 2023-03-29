import { 
    arrayToList,
    toDollars
 } from "../helpers";

export default class FidelityWidgetBase 
{
    static observerConfig = {
        childList: true,
        subtree: true,
    }

    maskValue = 100;
    targetNodeList = arrayToList([]); 
    searchedNodeList = document.querySelectorAll('body'); // a bit hacky here...
    targetedNodesSelector = document.querySelectorAll('body'); // * Overwrite in child. a bit hacky here...
    searchingObserver;
    targetedObserver;

    constructor(maskValue = 100) 
    {
        console.log("widget constuctor")
        this.maskValue = maskValue;
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
        console.log("widget setMaskedValue")
        this.maskValue = maskValue;
        this.maskUp();
    }
    
    /**
     * The central logic behind concealing the monetary value.
     */
    maskUp()
    {
        console.log("widget maskUp")
        for (const ele of this.targetNodeList)
        {
            ele.textContent = toDollars(this.maskValue);
        }
    }

    deactivate()
    {
        this.targetedObserver.disconnect(); // ? does this truly get rid of it?
    }

    /**
     * The searchingObserver is called whenever the DOM updates
     * (eg returning AJAX requests). It searches for the element containing
     * the unmasked monetary value; once that element is loaded, it should deactivate.
     * Monitoring then passes to the targetedObserver, which only watches the 
     * specific elements we care about.
     */
    activateSearchingObserver() 
    {
        this.searchingObserver = FidelityWidgetBase.createObserver(this.searchedNodeList, (mutations) => {
            console.log("search mutations.length: ", mutations.length)
            for (const mutation of mutations) 
            {
                if (
                    (mutation.type === 'childList' || mutation.type === 'subtree')
                    && this.getTargetNodes(mutation.addedNodes).length // checks for the targetNodes each time
                ) 
                {
                    this.maskUp();
                    this.activateTargetedObserver();
                    this.searchingObserver.disconnect();
                    break;
                }
            }
        })
    }

    activateTargetedObserver() 
    {
        this.targetedObserver = FidelityWidgetBase.createObserver(this.targetNodeList, (mutations) => {
            console.log("target mutations.length: ", mutations.length)
            for (const mutation of mutations)
            {
                if (!this.internalUpdate(mutation) && 
                    (mutation.type === 'childList' || mutation.type === 'subtree')) 
                {
                    this.maskUp();
                }
            }
        });
    }

    /**
     * Returns true if the mutation was a result of our own maskUp. This is to
     * prevent infinite loops. (Technically returns true if the textContent of the mutated node is the same as this.maskValue.)
     * @param {MutationRecord} mutation 
     * @returns {boolean}
     */
    internalUpdate(mutation)
    {
        console.log("widget internalUpdate")
        return mutation.target.textContent == toDollars(this.maskValue)
    }

    getTargetNodes(nodeList = this.searchedNodeList)
    {
        console.log("widget targetNodeList")
        if (this.targetNodeList.length) // short circuit
        {
            return this.targetNodeList;
        }
        this.targetNodeList = this.findTargetNodes(nodeList);
        return this.targetNodeList;
    }
    /**
     * ! Be sure to overwrite "targetedNodesSelector" in child class. 
     * Returns the nodes that the widget should update. 
     * * Will overwrite this.targetNodeList if any matches are found.
     * 
     * @returns {List<Node>}
     */
    findTargetNodes(nodeList = this.nodeToSearch)
    {
        console.log("findTargetNodes")
        // const targetNodeList = []; // reset (apparently going from List -> array -> List is the best we can do)
        for (const node of nodeList)
        {
            // check if it's an element and if there are any sub elements that match our target selector
            if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll(this.targetedNodesSelector).length)
            {
                this.targetNodeList = node.querySelectorAll(this.targetedNodesSelector);
                break;
            }
        }
        return this.targetNodeList;
    }

    // static name()
    // {
    //     return this.name + "_";
    // }

    static createObserver(nodeList, observerCallBack)
    {
        console.log("base createObserver")
        const observer = new MutationObserver(observerCallBack);
    
        for (const node of nodeList)
        {
            observer.observe(node, FidelityWidgetBase.observerConfig);
        }
    
        return observer;
    }
}