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
 * @param {int|float} value 
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
 * Convert a value to a gain/loss value by prepending a "+" if positive.
 * @param {int|float} value 
 * @returns 
 */
export function toGainDollars(value)
{
    const gainDollars = toDollars(value);
    if (value > 0)
    {
        return `+${gainDollars}`;
    }
    return gainDollars
}

/**
 * Convert to dollars that show up on the Fidelity graphs.
 * @param {int|float} value
* @returns {string} value as dollars
 */
export function toGraphDollars(value)
{
    if (value > 1000) // more than 1,000
    {
        if (value < 1000000) // less than 1,000,000
        {
            return `${toDollars(value/1000).slice(0,-1)}K`;
        }
        else if (value < 1000000000) // ,pre than 1,000,000 but less than 1,000,000,000
        {
            return `${toDollars(value/1000000).slice(0,-1)}M`;
        }
        else // more than 1,000,000,000
        {
            return `${toDollars(value/1000000000).slice(0,-1)}B`;
        }
    }
    else // less than 1,000
    {
        return `${toDollars(value)}`;
    }
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

/**
 * Strip a string to a number
 * @param {float|int} value 
 * @returns 
 */
export function stripToNumber(value)
{
    return parseFloat(value.replace(/[^0-9.-]+/g,""));
}

/**
 * Call the func on a single element or each element in the iterable.
 * @param {Element|Iterable} elemOrList 
 * @param {*} func 
 * @param  {...any} args to pass in after element to func
 */
export function applyToSingleElemOrList(elemOrList, func, ...args)
{
    if (elemOrList.length)
    {
        for (const elem of elemOrList)
        {
            func(elem, ...args);
        }
    }
    else
    {
        func(elemOrList, ...args);
    }
}