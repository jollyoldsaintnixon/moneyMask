import SummarySidebarWidget from "./SummarySidebarWidget.js";
// (async () => {
//   const src = chrome.extension.getURL('fidelity/fidelityMain.js');
//   const contentScript = await import(src);
//   contentScript.main();
// })();
function main()
{
  console.log("on fidelityContentScript")
  document.addEventListener('DOMContentLoaded', () => {
    console.log('doc loaded')
    const widgets = [
      new SummarySidebarWidget(getMaskValue()),
    ];
    // changeText();
    // observeDOMChanges();
  });
}
// let count = 0;
// function changeText() {
//   console.log("count: ", ++count);
//   const divs = document.querySelectorAll('[class$="_acct-balance"]');
//   const maskValue = getMaskValue(); // memoize outside of for loop
//   for (const div of divs) {
//     const spans = div.getElementsByTagName('span');
//     console.log("in div")
//     if (spans.length >= 2) {
//       // remove old mutation observer and replace with a new one that only triggers on the appropriate spans
//       console.log("in span")
//       // const maskValue = chrome.storage.sync.get('selectedValue').then(data => data.selectedValue ?? 1)
//       spans[1].textContent = maskValue; 
//     }
//   }
// }

function getMaskValue() {
  return chrome.storage.sync.get('selectedValue').then(data => data.selectedValue ?? 1);
}

// // Run the function after the DOM has loaded
// if (document.readyState === 'loading') {
//   console.log('1')
//   document.addEventListener('DOMContentLoaded', changeText);
// } else {
//   console.log('2')
//   changeText();
// }


// function observeDOMChanges() {
//   const observer = new MutationObserver((mutations) => {
//     for (const mutation of mutations) {
//       if (mutation.type === 'childList' || mutation.type === 'subtree') {
//         changeText();
//         break;
//       }
//     }
//   });

//   const observerConfig = {
//     childList: true,
//     subtree: true,
//   };

//   observer.observe(document.body, observerConfig);
// }

// run the function after the DOM has loaded
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', () => {
//     // changeText();
//     // observeDOMChanges();
//   });
// } else {
  // changeText();
  // observeDOMChanges();
// }

// document.addEventListener('DOMContentLoaded', () => {
//   const widgets = [
//     new SummarySidebarWidget(getMaskValue()),
//   ];
//   // changeText();
//   // observeDOMChanges();
// });

  "acct-selector__all-accounts-balance" // total for all accounts
  "acct-selector__acct-balance" // specific account, it's a div and the actual balance is the second span