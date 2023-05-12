import ContentScript from "../classes/ContentScript";
import WidgetController from "../classes/WidgetController";
import {
    classConstructorMapMock,
    classToUrlMapMock,
} from "./__mocks__/UrlsToWidgetsMap";
import chromeMock from './__mocks__/chrome';
global.chrome = chromeMock;

describe('ContentScript', () => {
    beforeEach(() => {
        // reset chrome runtime connect mock
        chrome.runtime.connect.mockClear();
    }) 
    test('should instantiate with a passed-in widget map', () => {
        const contentScript = new ContentScript(classConstructorMapMock, classToUrlMapMock);
        expect(contentScript.classToUrlMap).toEqual(classToUrlMapMock);
        expect(contentScript.classConstructorMap).toEqual(classConstructorMapMock);
        expect(contentScript.classToUrlMapMock).not.toEqual({});
    });
    test('should instantiate with an empty object as a default widget map when none is passed in', () => {
        const contentScript = new ContentScript();
        expect(contentScript.classToUrlMapMock).toEqual({});
    });
    test('should establish a connection with the background script when this.init() is called', async () => {
        // set up contentScript
        const contentScript = new ContentScript();
        // call init
        getToInit(contentScript);
        // wait for handleDocumentLoaded to be called
        await new Promise(resolve => setTimeout(resolve, 0));
        // call the tests
        expect(chrome.runtime.connect).toHaveBeenCalled();
        expect(chrome.runtime.connect).toHaveBeenCalledWith({ 
            name: "ContentScript",
         });
        expect(contentScript.backgroundScriptPort.name).toEqual("ContentScript");       
    });
    test('should set up a controller', async () => {
        // set up contentScript
        const mockController = await setUpController();
        const contentScript = new ContentScript(urlsToWidgetsMapMock);
        // call init
        getToInit(contentScript);
        // wait for handleDocumentLoaded to be called
        await new Promise(resolve => setTimeout(resolve, 0));
        // call the tests
        expect(contentScript.controller).toEqual(mockController);
    });
    test('should receive mask value updates from the background script and update controller', async () => {
        // mock the handleMessageFromBackgroundScript method on the ContentScript class. NB: this need to happen before instantiating the contentScript
        const handleMessageFromBackgroundScriptMock = jest.spyOn(ContentScript.prototype, 'handleMessageFromBackgroundScript');
        // mock the controller.updateMaskValue method
        const updateMaskValueMock = jest.spyOn(WidgetController.prototype, 'updateMaskValue');
        // handle message sending
        const message = { type: 'maskUpdate', value: 55 }
        await receiveMessageFromBackgroundScript(message);
        // tests
        expect(handleMessageFromBackgroundScriptMock).toHaveBeenCalledWith(message);
        expect(updateMaskValueMock).toHaveBeenCalledWith(message.value);
    });
    test('should receive mask on/off updates from the background script and pass to controller', async () => {
        // mock the handleMessageFromBackgroundScript method on the ContentScript class. NB: this need to happen before instantiating the contentScript
        const handleMessageFromBackgroundScriptMock = jest.spyOn(ContentScript.prototype, 'handleMessageFromBackgroundScript');
        // mock the controller.updateMaskValue method
        const updateIsMaskOnMock = jest.spyOn(WidgetController.prototype, 'updateMaskActivated');
        // handle message sending
        const message = { type: 'isMaskOn', value: false }
        await receiveMessageFromBackgroundScript(message);
        // call the tests
        expect(handleMessageFromBackgroundScriptMock).toHaveBeenCalledWith(message);
        expect(updateIsMaskOnMock).toHaveBeenCalledWith(message.value);
    });
    test('should receive url updates from the background script and pass to controller', async () => {
        // mock the handleMessageFromBackgroundScript method on the ContentScript class. NB: this need to happen before instantiating the contentScript
        const handleMessageFromBackgroundScriptMock = jest.spyOn(ContentScript.prototype, 'handleMessageFromBackgroundScript');
        // mock the controller.updateMaskValue method
        const loadWidgetsMock = jest.spyOn(WidgetController.prototype, 'loadWidgets');
        // handle message sending
        const message = { type: 'historyUpdate', value: 'https://www.google.com' }
        await receiveMessageFromBackgroundScript(message);
        // call the tests
        expect(handleMessageFromBackgroundScriptMock).toHaveBeenCalledWith(message);
        expect(loadWidgetsMock).toHaveBeenCalledWith(message.value);
    });
});

/**
 * Set up for and call contentScript.init()
 * @param {ContentScript} contentScript
 */
async function getToInit(contentScript)
{
    // mock handleDocumentLoaded
    const originalHandleDocumentLoaded = contentScript.handleDocumentLoaded;
    contentScript.handleDocumentLoaded = jest.fn(async function() {
        await originalHandleDocumentLoaded.call(this);
    });
    // mock document.readyState
    Object.defineProperty(document, 'readyState', {
        value: 'interactive',
        writable: true,
    });
    // initialize contentScript
    contentScript.init();
}

/**
 * set up and return mock controller
 * @returns {WidgetController}
 */
async function setUpController()
{
    // set up parameters
    let maskValue = await chromeMock.storage.sync.get('maskValue');
    maskValue = maskValue.maskValue; // technically chrome.storage.sync.get() returns an object, and I couldn't key in until after it returned.
    let isMaskOn = await chromeMock.storage.sync.get('isMaskOn');
    isMaskOn = isMaskOn.isMaskOn;
    // set up mock controller
    const mockController = new WidgetController(maskValue, isMaskOn, urlsToWidgetsMapMock);
    jest.spyOn(WidgetController.prototype, 'constructor').mockReturnValue(mockController);
    return mockController;
}

/**
 * Creates content script and controller. inits content script. Sends message to content script.
 * @param {Object} message 
 * @returns {ContentScript}
 */
async function receiveMessageFromBackgroundScript(message = {})
{
        // set up content script and controller
        const contentScript = new ContentScript(urlsToWidgetsMapMock);
        await setUpController();
        // call init and wait for handleDocumentLoaded to be called
        getToInit(contentScript);
        await new Promise(resolve => setTimeout(resolve, 0));
        // send message
        contentScript.backgroundScriptPort.triggerMessage(message)
        return contentScript;
}