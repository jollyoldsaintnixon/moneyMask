import SummaryBodyTotalWidget from "../fidelity/SummaryBodyTotalWidget";
import SummarySidebarWidget from "../fidelity/SummarySidebarWidget";

export default {
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary": [
        SummarySidebarWidget, 
        SummaryBodyTotalWidget,
    ],
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(positions|summary)": [
        SummarySidebarWidget,
    ],
}