import WidgetBase from "../../../WidgetBase";
import { 
    stripToNumber,
    toDollars,
} from "../../../helpers";

export default class PlanningSummaryWidget extends WidgetBase
{
    commonAncestorSelector = 'section.acc-visualization'; // choose first one

    netWorthSelector = 'p.acc--net-val';
    netWorthNode = null;
    assetSelector = "div.acc--asset-val";
    assetNode = null;
    liabilitySelector = "div.acc--liability-val";
    liabilityNode = null;

    constructor(maskValue = 100, isMaskOn = false)
    {
        super(maskValue, isMaskOn);
        this.watchForCommonAncestor();
    }

    /************************ MASKERS ***********************/

    putMaskUp()
    {
        this.maskNetWorth();
        this.maskAssets();
        this.maskLiabilities();
    }

    maskNetWorth()
    {
        WidgetBase.maskUp(this.getNetWorthNode(), toDollars(this.maskValue));
    }

    maskAssets()
    {
        const netWorth = this.getNetWorthNode().textContent;
        const assets = this.getAssetNode().textContent;
        const proportion = this.getMaskedProportion(netWorth, assets);
        WidgetBase.maskUp(this.getAssetNode(), toDollars(proportion));
    }

    maskLiabilities()
    {
        const netWorth = this.getNetWorthNode().textContent;
        const liabilities = this.getLiabilityNode().textContent;
        const proportion = this.getMaskedProportion(netWorth, liabilities);
        WidgetBase.maskUp(this.getLiabilityNode(), toDollars(proportion));    
    }

    /************************ RESETTERS ***********************/

    resetNodes()
    {
        WidgetBase.unmask(this.getNetWorthNode());
        WidgetBase.unmask(this.getAssetNode());
        WidgetBase.unmask(this.getLiabilityNode());
    }    

    /************************ GETTERS ***********************/

    getNetWorthNode()
    {
        if (!WidgetBase.isConnected(this.netWorthNode))
        {
            this.netWorthNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.netWorthSelector);
        }
        return this.netWorthNode;
    }

    getAssetNode()
    {
        if (!WidgetBase.isConnected(this.assetNode))
        {
            this.assetNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.assetSelector);
        }
        return this.assetNode;
    }

    getLiabilityNode()
    {
        if (!WidgetBase.isConnected(this.liabilityNode))
        {
            this.liabilityNode = WidgetBase.getNodes(this.getCommonAncestorNode(), this.liabilitySelector);
        }
        return this.liabilityNode;
    }
    /************************ WATCHERS ***********************/

    activateWatchers()
    {
        this.watchForNetWorth();
    }

    /**
     * Watch for the net worth node to be added to the DOM.
     * Does not create observer if node already exists.
     * Disconnects once node found.
     */
    watchForNetWorth()
    {
        const _onFoundLogic = () => {
            this.putMaskUp();
        };
        const _watchLogic = (mutations) => {
            for (const mutation of mutations)
            {
                if (mutation.addedNodes.length && this.getNetWorthNode())
                {
                    _onFoundLogic();
                    this.tryDisconnect("netWorth");
                    break;
                }
            }
        }
        if (this.getNetWorthNode())
        {
            _onFoundLogic();
        }
        else
        {
            this.observers.netWorth = WidgetBase.createObserver(this.getCommonAncestorNode(), _watchLogic);
        }
    }
}