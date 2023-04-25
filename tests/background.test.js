import BackgroundScript from "../background";
const { chrome } = global; // this is the mock chrome object from jest-chrome
// import { chrome } from 'jest-chrome'; // this is the mock chrome object from jest-chrome
// import { chromeMock } from './__mocks__/chrome';

const targetUrl = 'https://www.fidelity.com';
debugger
describe('BackgroundScript', () => {
    let backgroundScript;

    beforeEach(() => {
        backgroundScript = new BackgroundScript();
        chrome.storage.local.clear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('starts with isMaskOn defaulted to undefined', () => {
        expect(new BackgroundScript().isMaskOn).toBeUndefined();
    })
    test('starts with an empty contentScriptPorts object', () => {
        expect(new BackgroundScript().contentScriptPorts).toEqual({});
    })
    test('starts with currentIconPath as empty string', () => {
        expect(new BackgroundScript().currentIconPath).toEqual('');
    })
    test('saves a connection with a content script when chrome.runtime.OnConnect event is triggered by a content script', () => {
        
    });
    test('handleTabActivated - tab activation event', async () => {
        // debugger
        // await backgroundScript.init();
        const tab = { id: 1, url: targetUrl };
        chrome.tabs.get.mockResolvedValue(tab);
        expect(chrome.tabs.onActivated.hasListeners()).toBe(true)
        chrome.tabs.onActivated.callListeners({ tabId: 1});
        debugger;
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(chrome.tabs.get).toHaveBeenCalledWith(1, expect.any(Function));
        expect(chrome.action.setIcon).toHaveBeenCalledWith(expect.objectContaining({ tabId: tab.id, }));
        expect(backgroundScript.sendMessageToContentScript).toHaveBeenCalledWith(tab.id, { 
            type: 'isMaskOn', 
            value: backgroundScript.isMaskOn 
        });


        // (new BackgroundScript());
        // chrome.tabs.onActivated.call({ tab: 1});
        // expect(chrome.browserAction.setIcon).toHaveBeenCalled();
    });
    test('updates icon when page is loaded', () => {
        (new BackgroundScript());
        chrome.webNavigation.onCompleted.call({ tabId: 1 });
        expect(chrome.browserAction.setIcon).toHaveBeenCalled();
    });
    test('updates icon when user selects mask on/off', () => {
        const backgroundScript = new BackgroundScript();
    });
    test('updates icon when user selects mask on/off', () => {

    });
    test('updates icon when run for the first time', () => {

    });
    test('upates icon when a tab is updated', () => {

    });
    test('informs all content scripts of the new maskValue', () => {

    });
    test('informs all content scripts when mask is put on or taken off', () => {

    });
    test('informs active tab when the URL path is updated', () => {

    });
});