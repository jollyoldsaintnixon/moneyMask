(async () => {
    const module = await import('./SummarySidebarWidget.js');
    const SummarySidebarWidget = module.default;
    // const src = chrome.runtime.getURL('./fidelity/fidelityContentScript.js');
    // const contentScript = await import(src);
    // contentScript.main();
  })();