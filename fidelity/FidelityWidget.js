export default class FidelityWidget 
{
    static observerConfig = {
        childList: true,
        subtree: true,
    }
    maskValue = 100;
    targetNodes; // overwrite in child's constructor
    searchingObserver;
    targetedObserver;
    wasUpatedInternally = false // the targetedObserver watches for changes of the targetNodes. When any occur, it overrides those changes. this bool helps us avoid infinite loops.

    constructor(maskValue = 100) 
    {
        console.log("widget constuctor")
        this.maskValue = maskValue;
        this.targetNodes = this.getTargetNodes();
        this.activateSearchingObserver();
    }

    /**
     * Should be called whenever the user changes the desired
     * mask value in the pop up.
     * 
     * @param {int} maskValue 
     * @returns {void}
     */
    setMaskedValue(maskValue)
    {
        console.log("widget setMaskedValue")
        this.maskValue = maskValue;
    }
    
    /**
     * The central logic behind concealing the monetary value.
     */
    maskUp()
    {
        console.log("widget maskUp")
        for (const ele of this.targetNodes)
        {
            ele.textContent = FidelityWidget.toDollars(this.maskValue);
        }
    }

    /**
     * The searchingObserver is called whenever the DOM updates
     * (eg returning AJAX requests). It searches for the element containing
     * the unmasked monetary value; once that element is loaded, it should deactivate.
     * Monitoring then passes to the targetedObserver.
     */
    activateSearchingObserver() 
    {
        console.log("widget activeSearchingObserver")
        const observer = new MutationObserver((mutations) => {
            console.log("widget searchObserver callback")
            for (const mutation of mutations) 
            {
                if (mutation.type === 'childList' || mutation.type === 'subtree') 
                {
                    this.maskUp();
                    this.activateTargetedObserver();
                    observer.disconnect();
                }
            }
        });

        observer.observe(document.body, this.observerConfig);
        this.searchingObserver = observer;
    }

    activateTargetedObserver() 
    {
        console.log("widget activateTargetedObserver")
        const observer = new MutationObserver((mutations) => {
            console.log("widget targetedObserver callback")
            for (const mutation of mutations)
            {
                if (!this.internalUpdate(mutation) && 
                    (mutation.type === 'childList' || mutation.type === 'subtree')) 
                {
                    this.maskUp();
                }
            }
        });

        observer.observe(this.targetNodes, this.observerConfig);
        this.targetedObserver = observer;
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
        return mutation.target.textContent == FidelityWidget.toDollars(this.maskValue)
    }

    /**
     * Overwrite in child class. Return the nodes that the widget
     * should update.
     * @returns {Array<Node>}
     */
    getTargetNodes()
    {
        console.log("widget getTargetNodes")
        return [document.body];
    }

    /**
     * 
     * @param {int} value 
     * @returns {string} value as dollars
     */
    static toDollars(value)
    {
        console.log("widget toDollars")
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
        return formatter.format(value);
    }
}