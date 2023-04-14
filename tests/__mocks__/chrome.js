const mockStorage = {
    maskValue: '95',
    isMaskOn: true,
};

const chromePort = {
    onDisconnect: {
        addListener: jest.fn()
    },
    onMessage: {
        addListener: function(callback) {
            this.trigger = callback;
        }
    },
    postMessage: jest.fn(),
    triggerMessage: function(message) { // this is a hack to trigger the onMessage listener
        this.onMessage.trigger(message);
    },
    name: 'ContentScript',
};

const chromeMock = {
    runtime: {
        connect: jest.fn(() => {
            return chromePort;
        }),
        id: 'mockId',
    },
    storage: {
        sync: {
            get: jest.fn((key, callback) => {
                return new Promise(resolve => {
                    const data = { [key]: mockStorage[key] };
                    if (typeof callback === 'function')
                    {
                        callback(data);
                    }
                    resolve(data);
                })
            }),
        }
    }
};

export default chromeMock;