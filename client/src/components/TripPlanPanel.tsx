import { useEffect, useRef, useState } from "react";
import { api, type TripDay, type TripWithDays } from "../api/client";
import { formatDate } from "../utils/dates";

interface TripPlanPanelProps {
  refreshSignal: number;
}

interface TripFormState {
  destination: string;
  start_date: string;
  end_date: string;
  notes: string;
}

interface DayFormState {
  day_number: string;
  date: string;
  summary: string;
  activities: string;
}

const emptyDayForm: DayFormState = { day_number: "", date: "", summary: "", activities: "" };

export function TripPlanPanel({ refreshSignal }: TripPlanPanelProps) {
  const [trip, setTrip] = useState<TripWithDays | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editingTrip, setEditingTrip] = useState(false);
  const [tripForm, setTripForm] = useState<TripFormState>({
    destination: "",
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [savingTrip, setSavingTrip] = useState(false);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  const [editingDayId, setEditingDayId] = useState<number | "new" | null>(null);
  const [dayForm, setDayForm] = useState<DayFormState>(emptyDayForm);
  const [savingDay, setSavingDay] = useState(false);
  const [confirmingDeleteDayId, setConfirmingDeleteDayId] = useState<number | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<number | null>(null);
  const dayNumberInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getTrip().then(setTrip).catch((err) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, [refreshSignal]);

  useEffect(() => {
    if (editingTrip) destinationInputRef.current?.focus();
  }, [editingTrip]);

  useEffect(() => {
    if (editingDayId !== null) dayNumberInputRef.current?.focus();
  }, [editingDayId]);

  const startEditTrip = () => {
    if (!trip) return;
    setTripForm({
      destination: trip.destination ?? "",
      start_date: trip.start_date ?? "",
      end_date: trip.end_date ?? "",
      notes: trip.notes ?? "",
    });
    setEditingTrip(true);
  };

  const saveTrip = async () => {
    setActionError(null);

    if (tripForm.start_date && tripForm.end_date && tripForm.end_date < tripForm.start_date) {
      setActionError("End date can't be before the start date");
      return;
    }

    setSavingTrip(true);
    try {
      const updated = await api.updateTrip({
        destination: tripForm.destination.trim() || null,
        start_date: tripForm.start_date.trim() || null,
        end_date: tripForm.end_date.trim() || null,
        notes: tripForm.notes.trim() || null,
      });
      setTrip((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditingTrip(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingTrip(false);
    }
  };

  const startEditDay = (day: TripDay) => {
    setDayForm({
      day_number: String(day.day_number),
      date: day.date ?? "",
      summary: day.summary ?? "",
      activities: day.activities.join("\n"),
    });
    setEditingDayId(day.id);
  };

  const startAddDay = () => {
    const nextNumber = trip ? trip.days.length + 1 : 1;
    setDayForm({ ...emptyDayForm, day_number: String(nextNumber) });
    setEditingDayId("new");
  };

  const saveDay = async () => {
    setActionError(null);
    const dayNumber = Number(dayForm.day_number);
    if (!Number.isInteger(dayNumber) || dayNumber < 1) {
      setActionError("Day number must be a positive whole number");
      return;
    }

    const activities = dayForm.activities
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);

    setSavingDay(true);
    try {
      if (editingDayId === "new") {
        await api.addTripDay({
          day_number: dayNumber,
          date: dayForm.date.trim() || undefined,
          summary: dayForm.summary.trim() || undefined,
          activities,
        });
      } else if (typeof editingDayId === "number") {
        await api.updateTripDay(editingDayId, {
          day_number: dayNumber,
          date: dayForm.date.trim(),
          summary: dayForm.summary.trim(),
          activities,
        });
      }
      const refreshed = await api.getTrip();
      setTrip(refreshed);
      setEditingDayId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingDay(false);
    }
  };

  const deleteDay = async (id: number) => {
    setActionError(null);
    setDeletingDayId(id);
    try {
      await api.deleteTripDay(id);
      setTrip((prev) => (prev ? { ...prev, days: prev.days.filter((d) => d.id !== id) } : prev));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmingDeleteDayId(null);
      setDeletingDayId(null);
    }
  };

  if (loadError) return <aside className="trip-panel error">Trip plan error: {loadError}</aside>;
  if (!trip)
    return (
      <aside className="trip-panel loading-state">
        <span className="spinner" /> Loading trip plan...
      </aside>
    );

  return (
    <aside className="trip-panel">
      <h2>Trip plan</h2>

      {actionError && <p className="error">{actionError}</p>}

      {editingTrip ? (
        <div className="trip-form">
          <label>
            Destination
            <input
              ref={destinationInputRef}
              value={tripForm.destination}
              onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
            />
          </label>
          <label>
            Start date
            <input
              type="date"
              value={tripForm.start_date}
              onChange={(e) => setTripForm({ ...tripForm, start_date: e.target.value })}
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={tripForm.end_date}
              onChange={(e) => setTripForm({ ...tripForm, end_date: e.target.value })}
            />
          </label>
          <label>
            Notes
            <textarea
              rows={3}
              value={tripForm.notes}
              onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
            />
          </label>
          <div className="trip-form-actions">
            <button onClick={saveTrip} disabled={savingTrip}>
              {savingTrip ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditingTrip(false)} disabled={savingTrip}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="trip-summary">
          <p>
            <strong>Destination:</strong> {trip.destination || "Not set yet"}
          </p>
          <p>
            <strong>Dates:</strong>{" "}
            {trip.start_date || trip.end_date
              ? `${trip.start_date ? formatDate(trip.start_date) : "?"} to ${
                  trip.end_date ? formatDate(trip.end_date) : "?"
                }`
              : "Not set yet"}
          </p>
          {trip.notes && <p className="trip-notes">{trip.notes}</p>}
          <button onClick={startEditTrip}>Edit</button>
        </div>
      )}

      <h3>Day-by-day</h3>
      {trip.days.length === 0 && editingDayId === null && <p className="trip-empty">No days planned yet.</p>}
      <ul className="trip-days">
        {trip.days.map((day) =>
          editingDayId === day.id ? (
            <li key={day.id} className="trip-day-form">
              <DayFormFields dayForm={dayForm} setDayForm={setDayForm} dayNumberInputRef={dayNumberInputRef} />
              <div className="trip-form-actions">
                <button onClick={saveDay} disabled={savingDay}>
                  {savingDay ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditingDayId(null)} disabled={savingDay}>
                  Cancel
                </button>
              </div>
            </li>
          ) : (
            <li key={day.id} className="trip-day">
              <div className="trip-day-header">
                <strong>
                  Day {day.day_number}
                  {day.date ? ` — ${formatDate(day.date)}` : ""}
                </strong>
                {confirmingDeleteDayId === day.id ? (
                  <span className="delete-confirm">
                    <span className="delete-confirm-warning">This can't be undone.</span>
                    <button
                      className="delete-button-confirm"
                      onClick={() => deleteDay(day.id)}
                      disabled={deletingDayId === day.id}
                    >
                      {deletingDayId === day.id ? "Deleting..." : "Confirm delete"}
                    </button>
                    <button onClick={() => setConfirmingDeleteDayId(null)} disabled={deletingDayId === day.id}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <span className="trip-day-actions">
                    <button onClick={() => startEditDay(day)}>Edit</button>
                    <button
                      className="delete-button"
                      onClick={() => setConfirmingDeleteDayId(day.id)}
                      aria-label={`Delete day ${day.day_number}`}
                    >
                      Delete
                    </button>
                  </span>
                )}
              </div>
              {day.summary && <p>{day.summary}</p>}
              {day.activities.length > 0 && (
                <ul className="trip-activities">
                  {day.activities.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </li>
          )
        )}
      </ul>

      {editingDayId === "new" ? (
        <div className="trip-day-form">
          <DayFormFields dayForm={dayForm} setDayForm={setDayForm} dayNumberInputRef={dayNumberInputRef} />
          <div className="trip-form-actions">
            <button onClick={saveDay} disabled={savingDay}>
              {savingDay ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditingDayId(null)} disabled={savingDay}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={startAddDay}>Add day</button>
      )}
    </aside>
  );
}

function DayFormFields({
  dayForm,
  setDayForm,
  dayNumberInputRef,
}: {
  dayForm: DayFormState;
  setDayForm: (form: DayFormState) => void;
  dayNumberInputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <label>
        Day number
        <input
          ref={dayNumberInputRef}
          type="number"
          min={1}
          value={dayForm.day_number}
          onChange={(e) => setDayForm({ ...dayForm, day_number: e.target.value })}
        />
      </label>
      <label>
        Date
        <input type="date" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} />
      </label>
      <label>
        Summary
        <input value={dayForm.summary} onChange={(e) => setDayForm({ ...dayForm, summary: e.target.value })} />
      </label>
      <label>
        Activities (one per line)
        <textarea
          rows={3}
          value={dayForm.activities}
          onChange={(e) => setDayForm({ ...dayForm, activities: e.target.value })}
        />
      </label>
    </>
  );
}
