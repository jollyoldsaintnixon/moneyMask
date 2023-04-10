import SummarySidebarWidget from "./SummarySidebarWidget";

export default {
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(positions|summary)": [
        SummarySidebarWidget,
    ],
}