import SummarySidebarWidget from "../fidelity/SummarySidebarWidget";

export default {
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(positions|summary)": [
        SummarySidebarWidget,
    ],
}