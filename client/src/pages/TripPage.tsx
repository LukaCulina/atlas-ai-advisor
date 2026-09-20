import { TripPlanPanel } from "../components/TripPlanPanel";

// TripPlanPanel already renders its own "Trip plan" heading (used as the
// chat sidebar's panel title), so this page doesn't repeat it — that
// heading is promoted to page-title size via .trip-page CSS instead.
export function TripPage() {
  return (
    <div className="trip-page">
      <TripPlanPanel refreshSignal={0} />
    </div>
  );
}
