import { BrowserRouter } from "react-router-dom";
import { TripProvider } from "./store";
import App from "./App";
import "./index.css";

// Mounts Jack Trip as a self-contained sub-app under the /jack-trip path.
// Nested BrowserRouter with basename keeps Jack Trip's own absolute routes
// (/expense, /map, ...) working while living inside studio-2026's router.
export default function JackTrip() {
  return (
    <BrowserRouter basename="/jack-trip">
      <TripProvider>
        <div id="jack-trip-root" className="jack-trip-root">
          <App />
        </div>
      </TripProvider>
    </BrowserRouter>
  );
}
