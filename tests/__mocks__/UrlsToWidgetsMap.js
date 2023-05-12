export const classToUrlMapMock = {
    'ClassA': "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(positions|summary)",
    'ClassB': 'https://www.google.com/',
};

export const classConstructorMapMock = {  
    'ClassA': jest.fn(),
    'ClassB': jest.fn(),
}