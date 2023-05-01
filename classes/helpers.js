/**
 * For turning an array of Nodes back to a List<Node>.
 * Technically works for any <T>.
 * @param {array} nodeArray 
 */
export function arrayToList(nodeArray)
{
    return {
        length: nodeArray.length,
        item: function (index) {
            return nodeArray[index];
        },
        [Symbol.iterator]: function* () {
            for (let i = 0; i < nodeArray.length; i++) {
            yield nodeArray[i];
            }
        },
    };
}

/**
 * 
 * @param {int} value 
 * @returns {string} value as dollars
 */
export function toDollars(value)
{
    // console.log("helper toDollars")
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return formatter.format(value);
}

/**
 * 
 * @param {string} dollars 
 * @returns 
 */
export function dollarsToFloat(dollars)
{
    return parseFloat(dollars.replace(/[^0-9.-]+/g,""));
}

/**
 * Pass in "this" context to bind all instance handlers to "this".
 * The methods must be named "handle*".
 * @param {this} that 
 */
export function bindHandlers(that)
{
    // bind "that" to the instance for all handlers
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(that)))
    {
        if (typeof that[key] === 'function' && key !== 'constructor' && key.startsWith('handle'))
        {
            that[key] = that[key].bind(that);
        }
    }
}

export function stripToNumber(value)
{
    return parseFloat(value.replace(/[^0-9.-]+/g,""));
}