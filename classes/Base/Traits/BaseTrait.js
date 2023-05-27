/**
 * Traits/mixins should be instantiated and pushed inside a widgets trait array while in the widget's constructor call. All traits should take the widget's context (ie "this") as their first argument.  
 */
export default class BaseTrait
{
    constructor(context)
    {
        this.assignMethods(context);
    }

    assignMethods(context)
    {
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
        {
            if (typeof this[key] === 'function' 
                && key !== 'constructor' 
                && key !== 'assignMethods')
            {
                context[key] = this[key].bind(context);
            }
        }
    }

    /**
     * Used to update existing widget methods with trait logic.
     * @param {Context} context the widget's context
     * @param {string} methodName the name of the widget method to append to
     * @param {array} appendages array of objects. each object has a key of "func" pointing to an uninvoked function and a key of "args" pointing to an array of arguments to pass to the function.
     */
    static appendToMethodCall(context, methodName, appendages)
    {
        const originalMethod = context[methodName].bind(context); // make a copy of the method and bind it to the context
        context[methodName] = function() {
            originalMethod();
            appendages.forEach(appendage => {
                appendage.func.apply(context, appendage.args);
            });
        }  
    }
}