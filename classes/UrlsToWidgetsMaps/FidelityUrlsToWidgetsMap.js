import PanelIraWidget from "../fidelity/PanelIraWidget";
import PanelTotalWidget from "../fidelity/PanelTotalWidget";
import PositionsRowWidget from "../fidelity/PositionsRowWidget";
import SummarySidebarWidget from "../fidelity/SummarySidebarWidget";
import PopOutTradesWidget from "../fidelity/Trade/PopOutTradesWidget";

export default {
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary": [
        SummarySidebarWidget, 
        PanelTotalWidget,
        PanelIraWidget,
        PopOutTradesWidget,
    ],
    "http[s]?:\/\/.+fidelity\.com\/.*portfolio\/positions": [
        SummarySidebarWidget,
        PositionsRowWidget,
        PopOutTradesWidget,
    ],
}