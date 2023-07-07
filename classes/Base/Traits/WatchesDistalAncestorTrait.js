import WidgetBase from '../WidgetBase';
import BaseTrait from './BaseTrait';

/**
 * Used as a trait for widgets that need to watch for changes in a node that is an ancestor of the commonAncestorNode. This is useful when it wouldn't be effiecient to trigger the widget's core logic when the distal ancestor is loaded (vs waiting for the common ancestor), but the widget still needs to be able to respond to changes in the distal ancestor (often due to account swaps).
 */
export default class WatchesDistalAncestorTrait extends BaseTrait
{
    // * These properties are listed here for documentation purposes.
    distalAncestorSelector = ""; // points to the node that watches for the common ancestor's removal
    distalAncestorNode = null;

    /**
     * Pass in the widget's context and the selector for the distal ancestor node.
     * @param {Context} context 
     * @param {string} distalAncestorSelector 
     */
    constructor(context, distalAncestorSelector)
    {
        super(context);
        context.distalAncestorSelector = distalAncestorSelector;
        context.distalAncestorNode = null;
        // append to widget activateWatcher method
        const watcherAppendages = [
            { 
                func: context.watchForCommonAncestorRemoval,
                args: []
            }
        ];
        BaseTrait.appendToMethodCall(context, context.activateWatchers.name, watcherAppendages);
    }

    getDistalAncestorNode()
    {
        if (!WidgetBase.isConnected(this.distalAncestorNode))
        {
            this.distalAncestorNode = WidgetBase.getNodes(document, this.distalAncestorSelector);
        }
        return this.distalAncestorNode;
    }

    /**
     * When the user switches from account to account, a history update is not triggered. We need to therefore watch for the account swap and re-watch for commonAncestor.
     * Tries to run immediately.
     * Does not disconnect. Will short circuit if observer already exists.
     */
    watchForCommonAncestorRemoval()
    {
        if (!this.observers.commonAncestorRemoval)
        {
            const _onRemovedLogic = () => {
                this.watchForCommonAncestor();
            };
            const _watchLogic = (mutations) => {
                for (const mutation of mutations) 
                {
                    if (mutation.removedNodes.length 
                        && !WidgetBase.isConnected(this.commonAncestorNode))
                    {
                        this.tryDisconnect("commonAncestorRemoval");
                        _onRemovedLogic();
                        break;
                    }
                }
            };
            if (!WidgetBase.isConnected(this.commonAncestorNode)) // common ancestor was already removed
            {
                _onRemovedLogic();
            }
                this.observers.commonAncestorRemoval = WidgetBase.createObserver(this.getDistalAncestorNode(), _watchLogic);
        }
        // }
    }
}