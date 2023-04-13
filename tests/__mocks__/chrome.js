const mockStorage = {
    maskValue: '95',
    isMaskOn: true,
};

const chromeMock = {
    runtime: {
        connect: jest.fn(() => {
            return {
                onDisconnect: {
                    addListener: jest.fn()
                },
                onMessage: {
                    addListener: function(callback) {
                        this.trigger = callback;
                    }
                },
                postMessage: jest.fn(),
                triggerMessage: function(message) {
                    this.onMessage.trigger(message);
                },
                name: 'ContentScript',
            };
        }),
        id: 'mockId',
    },
    storage: {
        sync: {
            get: jest.fn((key, callback) => {
                return new Promise(resolve => {
                    console.log('in the mock get', key, callback)
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