import React from "react";
import ReactDOM from "react-dom/client";
import { Activity, Clock3, Edit3, Plus, RefreshCw, Server, Trash2, X } from "lucide-react";
import "./styles.css";

type HealthCheck = {
  id: number;
  ok: boolean;
  status_code: number | null;
  response_time_ms: number | null;
  error: string | null;
  created_at: string;
};

type Service = {
  id: number;
  name: string;
  url: string;
  expected_status: number;
  created_at: string;
  latest_check: HealthCheck | null;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function App() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [expectedStatus, setExpectedStatus] = React.useState(200);
  const [loading, setLoading] = React.useState(true);
  const [checkingId, setCheckingId] = React.useState<number | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [checkHistory, setCheckHistory] = React.useState<HealthCheck[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const loadServices = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/services`);
      if (!response.ok) throw new Error("Unable to load services");
      setServices(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadServices();
  }, [loadServices]);

  async function saveService(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const endpoint = editingId ? `${apiBaseUrl}/services/${editingId}` : `${apiBaseUrl}/services`;
    const response = await fetch(endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, expected_status: expectedStatus }),
    });

    if (!response.ok) {
      setError("Check the service name, URL, and expected status.");
      return;
    }

    setName("");
    setUrl("");
    setExpectedStatus(200);
    setEditingId(null);
    await loadServices();
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setName(service.name);
    setUrl(service.url);
    setExpectedStatus(service.expected_status);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setUrl("");
    setExpectedStatus(200);
    setError(null);
  }

  async function deleteService(id: number) {
    const confirmed = window.confirm("Delete this service and its health-check history?");
    if (!confirmed) return;

    setError(null);
    const response = await fetch(`${apiBaseUrl}/services/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to delete service.");
      return;
    }

    if (selectedService?.id === id) {
      setSelectedService(null);
      setCheckHistory([]);
    }
    if (editingId === id) cancelEdit();
    await loadServices();
  }

  async function checkService(id: number) {
    setCheckingId(id);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/services/${id}/check`, { method: "POST" });
      if (!response.ok) throw new Error("Health check failed to run");
      await loadServices();
      await loadHistory(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCheckingId(null);
    }
  }

  async function loadHistory(id: number) {
    setError(null);
    const response = await fetch(`${apiBaseUrl}/services/${id}/checks`);
    if (!response.ok) {
      setError("Unable to load check history.");
      return;
    }
    setCheckHistory(await response.json());
  }

  async function selectService(service: Service) {
    setSelectedService(service);
    await loadHistory(service.id);
  }

  const onlineCount = services.filter((service) => service.latest_check?.ok).length;
  const averageLatency = Math.round(
    services.reduce((total, service) => total + (service.latest_check?.response_time_ms ?? 0), 0) /
      Math.max(services.filter((service) => service.latest_check?.response_time_ms).length, 1),
  );

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <span className="eyebrow">Service Reliability</span>
          <h1>PulseBoard</h1>
        </div>
        <button className="icon-button" onClick={loadServices} aria-label="Refresh services">
          <RefreshCw size={18} />
        </button>
      </section>

      <section className="metrics-grid">
        <Metric icon={<Server size={20} />} label="Services" value={services.length.toString()} />
        <Metric icon={<Activity size={20} />} label="Online" value={onlineCount.toString()} />
        <Metric icon={<Clock3 size={20} />} label="Avg latency" value={`${averageLatency}ms`} />
      </section>

      <section className="workspace">
        <form className="panel form-panel" onSubmit={saveService}>
          <div className="panel-heading">
            <h2>{editingId ? "Edit Service" : "Add Service"}</h2>
            {editingId ? (
              <button className="icon-button subtle" type="button" onClick={cancelEdit} aria-label="Cancel edit">
                <X size={18} />
              </button>
            ) : null}
          </div>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Main API" />
          </label>
          <label>
            URL
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" />
          </label>
          <label>
            Expected status
            <input
              type="number"
              min="100"
              max="599"
              value={expectedStatus}
              onChange={(event) => setExpectedStatus(Number(event.target.value))}
            />
          </label>
          <button className="primary-button" type="submit">
            {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
            {editingId ? "Save changes" : "Add service"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>

        <section className="panel services-panel">
          <h2>Monitored Services</h2>
          {loading ? <p className="muted">Loading services...</p> : null}
          {!loading && services.length === 0 ? <p className="muted">No services yet.</p> : null}
          <div className="service-list">
            {services.map((service) => (
              <article className="service-card" key={service.id}>
                <div>
                  <div className="service-title-row">
                    <span className={service.latest_check?.ok ? "status-dot online" : "status-dot"} />
                    <h3>{service.name}</h3>
                  </div>
                  <p>{service.url}</p>
                </div>
                <div className="service-meta">
                  <span>Status {service.latest_check?.status_code ?? "not checked"}</span>
                  <span>{service.latest_check?.response_time_ms ?? 0}ms</span>
                </div>
                <div className="action-row">
                  <button className="secondary-button" onClick={() => checkService(service.id)}>
                    <RefreshCw size={16} />
                    {checkingId === service.id ? "Checking" : "Run check"}
                  </button>
                  <button className="square-button" onClick={() => startEdit(service)} aria-label={`Edit ${service.name}`}>
                    <Edit3 size={16} />
                  </button>
                  <button className="square-button danger" onClick={() => deleteService(service.id)} aria-label={`Delete ${service.name}`}>
                    <Trash2 size={16} />
                  </button>
                  <button className="secondary-button" onClick={() => selectService(service)}>
                    History
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {selectedService ? (
        <section className="panel history-panel">
          <div className="panel-heading">
            <h2>Recent Checks: {selectedService.name}</h2>
            <button className="icon-button subtle" onClick={() => setSelectedService(null)} aria-label="Close history">
              <X size={18} />
            </button>
          </div>
          {checkHistory.length === 0 ? <p className="muted">No health checks recorded yet.</p> : null}
          <div className="history-list">
            {checkHistory.map((check) => (
              <article className="history-row" key={check.id}>
                <span className={check.ok ? "status-pill online" : "status-pill"}>{check.ok ? "Online" : "Failed"}</span>
                <span>Status {check.status_code ?? "none"}</span>
                <span>{check.response_time_ms ?? 0}ms</span>
                <span>{new Date(check.created_at).toLocaleString()}</span>
                {check.error ? <span className="history-error">{check.error}</span> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
