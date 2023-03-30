import { 
    arrayToList,
    toDollars,
    dollarsToFloat,
 } from "../helpers";

export default class FidelityWidgetBase 
{
    static observerConfig = {
        childList: true,
        subtree: true,
    }

    maskValue = 100;
    isMaskOn = false;

    originalValuesSaved = false;

    targetNodeList = arrayToList([]); 
    targetedNodesSelector = document.querySelectorAll('body'); // * Overwrite in child. a bit hacky here...
    // afterEffectsSelectors = []; // an array of selector strings corresponding to each after effect. update in child classes.
    // afterEffectsNodeLists = []; // an array of node lists that need to be updated after the mask is applied. filled when targets are first found.
    searchedNodeList = document.querySelectorAll('body'); // a bit hacky here...

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
        console.log("widget setMaskedValue")
        this.maskValue = maskValue;
        this.maskUp();
    }

    updateMaskActivated(isMaskOn)
    {
        this.isMaskOn = isMaskOn;
        if (isMaskOn)
        {
            this.maskUp();
        }
        else
        {
            this.restoreOriginalValues();
        }
    }
    
    /**
     * The central logic behind concealing the monetary value. Saves the node's
     * original value in the node's data attribute, then replaces the textContent
     */
    maskUp()
    {
        console.log("widget maskUp")
        // we only want to change things if the mask if activated
        if (!this.isMaskOn)
        {
            return;
        }
        if (!this.originalValuesSaved)
        {
            this.saveOriginalValues();
        }
        for (const ele of this.targetNodeList)
        {
            ele.textContent = toDollars(this.maskValue);
        }
        this.afterEffects();
    }

    /**
     * Disconnects ann observers.
     */
    deactivate()
    {
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
     * Saves the original values of the target nodes in the node's data attribute.
     * Used when masking/demasking
     * 
     * @param {NodeList} nodeList
     */
    saveOriginalValues()
    {
        // const nodeLists = [this.targetNodeList].concat(this.afterEffectsNodeLists); // array of NodeLists
        // for (const nodeList of nodeLists) // NodeList
        // {
        if (this.targetNodeList.length)
        {
            for (const ele of this.targetNodeList) // Node
            {
                ele.setAttribute('data-original-value', ele.textContent);
            }
            this.originalValuesSaved = true;
        }
        // }
    }

    /**
     * Restore the original values of the target nodes.
     * Used when masking/demasking.
     */
    restoreOriginalValues()
    {
        // const nodeLists = [this.targetNodeList].concat(this.afterEffectsNodeLists);
        // for (const nodeList of nodeLists)
        // {
        for (const ele of this.targetNodeList)
        {
            ele.textContent = ele.dataset.originalValue;
        }
        this.afterEffects();
        // }
    }

    /**
     * The searchingObserver is called whenever the DOM updates
     * (eg returning AJAX requests). It searches for the element containing
     * the unmasked monetary value; once that element is loaded, it should deactivate.
     * Monitoring then passes to the targetedObserver, which only watches the 
     * specific elements we care about.
     * ?  could we simply change the searchedNodeList to the targetNodeList?
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
                    // this.fillAfterEffectsList();
                    this.saveOriginalValues()
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
                    this.saveOriginalValues();
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
                // this.fillAfterEffectsList();
                break;
            }
        }
        return this.targetNodeList;
    }

    /**
     * Trigger any after/secondary effects here. This should be overwritten in child classes.
     * Effects should be determined by values in targetNodeList.
     * @returns {void}
     */
    afterEffects()
    {
        return;
    }

    /**
     * Convert the old fraction to a amount based on the mask value.
     * @param {string} totalDollars the original total
     * @param {string} proportionDollars the fraction of the totalDollars
     * @returns 
     */
    makeProportions(totalDollars, proportionDollars)
    {
        const proportion = dollarsToFloat(proportionDollars) / dollarsToFloat(totalDollars);
        return toDollars(this.maskValue * proportion);
    }

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