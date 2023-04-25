// import SummarySidebarWidget from "../domains/fidelity/SummarySidebarWidget.js";
// import WidgetSearcher from "../domains/WidgetSearcher.js";
// import WidgetController from "../classes/WidgetController.js";
import FIDELITY_WIDGET_MAP from "../classes/UrlsToWidgetsMaps/FidelityUrlsToWidgetsMap.js";
import ContentScript from "../classes/ContentScript.js";
(new ContentScript(FIDELITY_WIDGET_MAP)).init();


// if (document.readyState === 'loading') 
// {
//   document.addEventListener('DOMContentLoaded', onDocumentLoaded);
// } 
// else 
// {
//   onDocumentLoaded();
// }

// async function onDocumentLoaded() 
// {
//   console.log('doc loaded');
//   sendMessageToBackgroundScript(); // let the background script know that we are up and running (and can thus receive messages)
//   const maskValue = await getInitialMaskValue();
//   const isMaskOn = await getInitialMaskActivated();
//   // const controller = setUpController(maskValue);
//   setUpController(maskValue, isMaskOn);

//   // const widgets = [
//   //   new SummarySidebarWidget(maskValue),
//   // ];

//   // setUpSearcher(new WidgetSearcher(widgets), maskValue);
// }

// function getInitialMaskValue() 
// {
//   return chrome.storage.sync.get('maskValue').then(data => data.maskValue ?? 1);
// }

// function getInitialMaskActivated()
// {
//   return chrome.storage.sync.get('isMaskOn').then(data => data.isMaskOn ?? true);
// }

// function setUpController(maskValue, isMaskOn)
// {
//   const controller = new WidgetController(maskValue, isMaskOn, FIDELITY_WIDGET_MAP);
//   chrome.runtime.onMessage.addListener(message => {
//     if (message.type === 'maskUpdate')
//     {
//       controller.updateMaskValue(message.value);
//     }
//     else if(message.type === 'pathUpdate')
//     {
//       controller.loadWidgets(message.value)
//     }
//     else if(message.type === "isMaskOn")
//     {
//       controller.updateMaskActivated(message.value);
//     }
//   })
//   controller.loadWidgets(window.location.href);
//   // return controller;
// }

// /**
//  * Lets the background script know that this content script is ready to receive messages. 
//  * Retries up to 5 times if the background script doesn't respond.
//  * @param {int} retryCount 
//  */
// function sendMessageToBackgroundScript(retryCount = 0) {
//     const maxRetries = 5;
//     const retryDelay = 500
//     // Send the "ready" message to the background script
//     chrome.runtime.sendMessage({ type: 'contentScriptReady' }, (response) => {
//       if (chrome.runtime.lastError || !response || !response.acknowledged) 
//       {
//         // If there's an error, no response, or the response doesn't have the expected property, retry
//         if (retryCount < maxRetries) 
//         {
//           setTimeout(() => sendMessageToBackgroundScript(++retryCount), retryDelay);
//         } 
//         else 
//         {
//           console.warn('Failed to establish connection with background script after', maxRetries, 'attempts');
//         }
//       } 
//       else 
//       {
//         console.log('Connection with background script established');
//       }
//     });
// }