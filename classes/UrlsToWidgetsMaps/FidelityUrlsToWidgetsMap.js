import PanelIraWidget from "../fidelity/PanelIraWidget";
import PanelTotalWidget from "../fidelity/PanelTotalWidget";
import SummarySidebarWidget from "../fidelity/SummarySidebarWidget";

export default {
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary": [
        SummarySidebarWidget, 
        PanelTotalWidget,
        PanelIraWidget,
    ],
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(positions|summary)": [
        SummarySidebarWidget,
    ],
}