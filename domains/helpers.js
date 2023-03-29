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

// export function createObserver(nodeList, observerCallBack)
// {
//     console.log("widget createObserver")
//     const observer = new MutationObserver(observerCallBack);

//     for (const node of nodeList)
//     {
//         observer.observe(node, FidelityWidgetBase.observerConfig);
//     }

//     return observer;
// }

/**
 * 
 * @param {int} value 
 * @returns {string} value as dollars
 */
export function toDollars(value)
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