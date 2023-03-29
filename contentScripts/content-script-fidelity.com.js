// import SummarySidebarWidget from "../domains/fidelity/SummarySidebarWidget.js";
// import WidgetSearcher from "../domains/WidgetSearcher.js";
import WidgetController from "../domains/WidgetController.js";
import FIDELITY_WIDGET_MAP from "../domains/fidelity/FidelityWidgetMap.js";

if (document.readyState === 'loading') 
{
  document.addEventListener('DOMContentLoaded', onDocumentLoaded);
} 
else 
{
  onDocumentLoaded();
}

async function onDocumentLoaded() 
{
  chrome.runtime.sendMessage({ type: 'contentScriptReady' }); // let the background script know that we are up and running (and can thus receive messages)
  console.log('doc loaded');
  const maskValue = await getInitialMaskValue();
  const maskActivated = await getInitialMaskActivated();
  // const controller = setUpController(maskValue);
  setUpController(maskValue, maskActivated);

  // const widgets = [
  //   new SummarySidebarWidget(maskValue),
  // ];

  // setUpSearcher(new WidgetSearcher(widgets), maskValue);
}

function getInitialMaskValue() 
{
  return chrome.storage.sync.get('selectedValue').then(data => data.selectedValue ?? 1);
}

function getInitialMaskActivated()
{
  return chrome.storage.sync.get('maskActivated').then(data => data.maskActivated ?? true);
}

function setUpController(maskValue, maskActivated)
{
  const controller = new WidgetController(maskValue, maskActivated, FIDELITY_WIDGET_MAP);
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'maskUpdate')
    {
      controller.updateMaskValue(message.value);
    }
    else if(message.type === 'pathUpdate')
    {
      controller.loadWidgets(message.value)
    }
    else if(message.type === "maskActivated")
    {
      controller.updateMaskActivated(message.value);
    }
  })
  controller.loadWidgets(window.location.href);
  // return controller;
}