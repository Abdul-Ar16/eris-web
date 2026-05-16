import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import LoginPage from './components/LoginPage.jsx'
import ProfilePage from './components/ProfilePage.jsx'
import AuthService from './services/authService.js'
import AlertService from './services/alertService.js'
import StationService from './services/stationService.js'
import SensorService from './services/sensorService.js'
import MlPredictionService from './services/mlPredictionService.js'
import DashboardService from './services/dashboardService.js'
import StatisticsService from './services/statisticsService.js'
import LogService from './services/logService.js'
import NotificationService from './services/notificationService.js'
import { downloadCSV, downloadText } from './utils/exportUtils.js'
import LiveMap from './components/LiveMap.jsx'

/** Full-screen basin detail layouts (Kelani pattern) keyed by station id. */
const BASIN_DETAILS = {
  'KR-04': {
    subtitle: 'Critical flood status',
    riskTier: 'danger',
    riskLabel: 'Danger',
    headerAction: 'Issue evacuation',
    headerActionVariant: 'danger',
    metrics: [
      { label: 'Water level', value: '8.2 m' },
      { label: 'Rainfall (24h)', value: '148 mm' },
      { label: 'Flow rate', value: '4.1 m/s' },
      { label: 'Risk status', value: 'Danger', emphasis: 'danger' },
    ],
    mainChart: {
      title: 'Water level - past 24 hours',
      heights: [38, 40, 42, 44, 46, 48, 52, 55, 58, 62, 68, 74, 78, 82, 88, 95],
    },
    residents: {
      title: 'Nearby residents summary',
      rows: [
        { value: '1,248', label: 'In danger zone' },
        { value: '1,102', label: 'Notified via app' },
        { value: '482', label: 'Evacuated' },
      ],
    },
    secondaryChart: {
      title: 'Flow rate - past 24 hours',
      heights: [28, 30, 32, 34, 38, 42, 46, 50, 55, 62, 70, 78],
    },
  },
  'ML-09': {
    subtitle: 'Landslide watch — southern highlands',
    riskTier: 'danger',
    riskLabel: 'Danger',
    headerAction: 'Close access roads',
    headerActionVariant: 'danger',
    metrics: [
      { label: 'Soil saturation', value: '94%' },
      { label: 'Rainfall (24h)', value: '162 mm' },
      { label: 'Vibration peak', value: '8.2 Hz' },
      { label: 'Risk status', value: 'Danger', emphasis: 'danger' },
    ],
    mainChart: {
      title: 'Soil saturation - past 24 hours',
      heights: [45, 48, 50, 52, 55, 58, 60, 63, 68, 72, 78, 82, 86, 88, 91, 94],
    },
    residents: {
      title: 'Communities & assets',
      rows: [
        { value: '932', label: 'Households at risk' },
        { value: '887', label: 'SMS + app notified' },
        { value: '316', label: 'Sheltered / relocated' },
      ],
    },
    secondaryChart: {
      title: 'Slope movement index - past 12 hours',
      heights: [32, 34, 36, 38, 40, 44, 48, 52, 58, 64, 72, 80],
    },
  },
  'KG-02': {
    subtitle: 'River rise — advisory band',
    riskTier: 'warning',
    riskLabel: 'Warning',
    headerAction: 'Deploy field teams',
    headerActionVariant: 'warning',
    metrics: [
      { label: 'Water level', value: '5.9 m' },
      { label: 'Rainfall (24h)', value: '128 mm' },
      { label: 'Flow rate', value: '3.4 m/s' },
      { label: 'Risk status', value: 'Warning', emphasis: 'warning' },
    ],
    mainChart: {
      title: 'Water level - past 24 hours',
      heights: [30, 32, 34, 36, 38, 40, 42, 45, 48, 52, 56, 60, 64, 68, 72, 76],
    },
    residents: {
      title: 'Downstream exposure',
      rows: [
        { value: '804', label: 'Within warning buffer' },
        { value: '651', label: 'Voice + SMS reached' },
        { value: '124', label: 'Voluntary relocation' },
      ],
    },
    secondaryChart: {
      title: 'Discharge estimate - past 24 hours',
      heights: [22, 24, 26, 28, 30, 34, 38, 42, 46, 50, 54, 58],
    },
  },
  'KH-11': {
    subtitle: 'Hill country — elevated soil moisture',
    riskTier: 'caution',
    riskLabel: 'Caution',
    headerAction: 'Increase watch frequency',
    headerActionVariant: 'caution',
    metrics: [
      { label: 'Soil moisture', value: '78%' },
      { label: 'Rainfall (24h)', value: '140 mm' },
      { label: 'Stability index', value: '62%' },
      { label: 'Risk status', value: 'Caution', emphasis: 'caution' },
    ],
    mainChart: {
      title: 'Soil moisture trend - past 24 hours',
      heights: [28, 30, 32, 33, 35, 36, 38, 40, 42, 45, 48, 52, 55, 58, 62, 66],
    },
    residents: {
      title: 'Settlements overview',
      rows: [
        { value: '554', label: 'In caution footprint' },
        { value: '421', label: 'Advisory notifications' },
        { value: '38', label: 'Pre-emptive relocation' },
      ],
    },
    secondaryChart: {
      title: 'Tilt sensor variance - past 12 hours',
      heights: [20, 22, 24, 25, 26, 28, 30, 32, 34, 36, 38, 40],
    },
  },
}

/** Per-basin copy for sidebar sections (Overview, Thresholds, Assets, Logs). */
const BASIN_PAGES = {
  'KR-04': {
    overview: {
      summary:
        'Kelani carries the largest urban exposure in the network: Colombo–Gampaha corridors, leveed reaches, and tide–river interaction on spring tides.',
      bullets: [
        'Upstream peaks from Seethawaka and Avissawella are arriving within one forecast cycle of each other.',
        'Hanwella gauge agrees with Kelani Bridge backup within 9 cm after QA.',
        'Evacuation messaging is prioritising wards below 8 m stage with bus staging at Kirindiwela.',
      ],
      stats: [
        { label: 'Catchment', value: '2,292 km²' },
        { label: '6 h forecast max', value: '8.6 m' },
        { label: 'Bridges instrumented', value: '6' },
        { label: 'Field teams deployed', value: '4 units' },
      ],
    },
    thresholdRows: [
      { metric: 'Main stem (Hanwella)', band: 'Safe < 4.0 · Warn 4.0–6.0 · Danger > 6.0 m', state: 'Danger' },
      { metric: 'Surface velocity (index)', band: 'Safe < 2.2 · Warn 2.2–3.6 · Danger > 3.6 m/s', state: 'Danger' },
      { metric: 'Basin rain (avg 24 h)', band: 'Safe < 75 · Warn 75–120 · Danger > 120 mm', state: 'Warn' },
      { metric: 'Tidal assist window', band: 'High tide +120 min hold', state: 'Watch' },
    ],
    assets: [
      { code: 'KR-G1', name: 'Hanwella ultrasonic stage', role: 'Primary stage', status: 'Online' },
      { code: 'KR-G2', name: 'Kelani Bridge redundant radar', role: 'Validation', status: 'Online' },
      { code: 'KR-C3', name: 'Nagalagam Street camera', role: 'Visual inundation', status: 'Online' },
      { code: 'KR-S1', name: 'Peliyagoda siren array', role: 'Public alert', status: 'Standby' },
    ],
    logs: [
      { time: '12:14', tag: 'AUTO', text: 'DANGER template pushed to DS divisions (eastern bank).' },
      { time: '11:58', tag: 'OPS', text: 'K. Perera acknowledged cross-check with Irrigation telemetry.' },
      { time: '11:22', tag: 'FIELD', text: 'Team 2 reported debris partial blockage — cleared, flow restored.' },
      { time: '10:40', tag: 'MODEL', text: 'ML ensemble nudged peak +0.3 m vs 06:00 run.' },
      { time: '09:05', tag: 'SYS', text: 'Backup gauge KR-G2 latency restored under 30 s.' },
    ],
    mapCaption: 'Kelani main stem — Hanwella to estuary',
  },
  'ML-09': {
    overview: {
      summary:
        'Southern highland ridge: deep colluvium, road cuts, and tea-estate terraces. Saturation is outpacing drainage; vibration cluster suggests shallow slip planes.',
      bullets: [
        'NBRO cumulative rainfall thresholds exceeded for 72 h window on two sub-catchments.',
        'Matara–Deniyaya road chainage 14–19 km flagged for night closure if rain persists.',
        'Community hubs activated in Akuressa and Kotapola for shelter overflow.',
      ],
      stats: [
        { label: 'Slope sectors watched', value: '11' },
        { label: 'Highest 24 h rain', value: '162 mm' },
        { label: 'Inclinometers live', value: '8 / 8' },
        { label: 'Road segments locked', value: '2' },
      ],
    },
    thresholdRows: [
      { metric: 'Soil saturation (root zone)', band: 'OK < 70 · Watch 70–85 · Danger > 85 %', state: 'Danger' },
      { metric: 'Cumulative rain (72 h)', band: 'NBRO advisory 200 · Danger > 250 mm', state: 'Danger' },
      { metric: 'Vibration RMS', band: 'OK < 4 · Watch 4–7 · Danger > 7 Hz', state: 'Watch' },
      { metric: 'Pore pressure trend', band: 'Stable · Rising (12 h) · Rapid rise', state: 'Rising' },
    ],
    assets: [
      { code: 'ML-I1', name: 'Kirinda inclinometer chain', role: 'Deep movement', status: 'Online' },
      { code: 'ML-R2', name: 'Deniyaya tipping bucket', role: 'Rain intensity', status: 'Online' },
      { code: 'ML-V3', name: 'Hakmana geophone cluster', role: 'Vibration', status: 'Online' },
      { code: 'ML-C1', name: 'Urubokka trail cam', role: 'Visual', status: 'Degraded' },
    ],
    logs: [
      { time: '12:02', tag: 'NBRO', text: 'Advisory level escalated; district geologist notified.' },
      { time: '11:18', tag: 'FIELD', text: 'Minor slump at CH 16+200 — cones placed, single lane.' },
      { time: '10:51', tag: 'AUTO', text: 'SMS burst to 887 households in ML-09 footprint.' },
      { time: '09:33', tag: 'OPS', text: 'Bus diversion route D2 published to traffic police.' },
    ],
    mapCaption: 'Matara highlands — ridge sectors & access roads',
  },
  'KG-02': {
    overview: {
      summary:
        'Kalu carries large volumes from central hills; downstream Kalutara–Mathugama plains have long inundation tails. Current band is warning-only but rising slowly.',
      bullets: [
        'No levee overtopping on telemetry; concern is agricultural blocks and minor roads.',
        'Upstream Ratnapura cluster easing — local peaks may still propagate.',
        'Irrigation sluice coordination call at 13:00 if rain band stalls.',
      ],
      stats: [
        { label: 'Basin length instrumented', value: '186 km' },
        { label: 'Forecast 12 h stage', value: '6.1 m' },
        { label: 'Villages in buffer', value: '37' },
        { label: 'ADCP health', value: 'Good' },
      ],
    },
    thresholdRows: [
      { metric: 'Millakanda reference stage', band: 'Safe < 3.5 · Warn 3.5–5.5 · Danger > 5.5 m', state: 'Warning' },
      { metric: 'Discharge (modelled)', band: 'Safe < 2.8k · Warn 2.8–3.9k · Danger > 3.9k m³/s', state: 'Warning' },
      { metric: 'Tributary flash index', band: 'Low · Moderate · High', state: 'Moderate' },
      { metric: 'Sediment load proxy', band: 'Normal · Elevated', state: 'Elevated' },
    ],
    assets: [
      { code: 'KG-G1', name: 'Millakanda stage + ADCP', role: 'Discharge', status: 'Online' },
      { code: 'KG-G2', name: 'Mathugama bridge radar', role: 'Downstream stage', status: 'Online' },
      { code: 'KG-R1', name: 'Ratnapura rain composite', role: 'Areal rain', status: 'Online' },
      { code: 'KG-L1', name: 'Kalutara levee tilt', role: 'Structure', status: 'Maintenance' },
    ],
    logs: [
      { time: '11:47', tag: 'OPS', text: 'Voice tree call initiated for downstream GS divisions.' },
      { time: '10:55', tag: 'MODEL', text: 'Routing model switched to wet-antecedent parameters.' },
      { time: '09:12', tag: 'FIELD', text: 'Mathugama market sump pumps verified operational.' },
    ],
    mapCaption: 'Kalu Ganga — Millakanda to estuary corridor',
  },
  'KH-11': {
    overview: {
      summary:
        'Central hill country: steep residential cuts, estate roads, and shallow bedrock in places. Moisture is high but kinematics remain subdued — caution posture, not evacuation.',
      bullets: [
        'Tea-estate access roads flagged for heavy vehicle curfew if rain exceeds 40 mm in 6 h.',
        'Groundwater wells in selected GN divisions on weekly manual read until index improves.',
        'Kandy MC coordination for hospital access route KH-A maintained open.',
      ],
      stats: [
        { label: 'GN divisions in footprint', value: '14' },
        { label: 'Tilt sensors (active)', value: '22' },
        { label: 'Stability index floor', value: '62%' },
        { label: 'Next flyover drone', value: 'Tomorrow 07:00' },
      ],
    },
    thresholdRows: [
      { metric: 'Soil moisture (profile avg)', band: 'OK < 65 · Caution 65–80 · Warn > 80 %', state: 'Caution' },
      { metric: 'Rain (24 h rolling)', band: 'OK < 100 · Caution 100–140 · Warn > 140 mm', state: 'Caution' },
      { metric: 'Tilt delta (24 h)', band: 'OK < 0.6 · Watch 0.6–1.2 · Alert > 1.2 mm/m', state: 'OK' },
      { metric: 'Community advisory tier', band: 'Green · Yellow · Orange', state: 'Yellow' },
    ],
    assets: [
      { code: 'KH-T5', name: 'Hantana tilt array', role: 'Slope', status: 'Online' },
      { code: 'KH-R1', name: 'Peradeniya met station', role: 'Rain', status: 'Online' },
      { code: 'KH-G1', name: 'Mahaweli tributary mini-gauge', role: 'Stage', status: 'Online' },
      { code: 'KH-U2', name: 'Katugastota uplink repeater', role: 'Comms', status: 'Online' },
    ],
    logs: [
      { time: '11:05', tag: 'OPS', text: 'Yellow advisory posted to Kandy DMC channel + app.' },
      { time: '08:40', tag: 'AUTO', text: 'Watch frequency increased to 15 min ingest.' },
      { time: 'Yesterday', tag: 'FIELD', text: 'Cleared culvert at Galaha road — no sensor damage.' },
    ],
    mapCaption: 'Kandy hills — residential terraces & estate roads',
  },
}

const BASIN_NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'live-map', label: 'Live Map' },
  { id: 'thresholds', label: 'Thresholds' },
  { id: 'assets', label: 'Assets' },
  { id: 'logs', label: 'Logs' },
  { id: 'issue-alert', label: 'Issue alert', danger: true },
]

const BASIN_DETAIL_IDS = Object.keys(BASIN_DETAILS)

function BasinWorkspace({ station, config, onClose }) {
  const [basinNav, setBasinNav] = useState('overview')
  const [alertSeverity, setAlertSeverity] = useState('warning')
  const [alertChannels, setAlertChannels] = useState({ sms: true, app: true, radio: false })
  const [alertNote, setAlertNote] = useState('')

  useEffect(() => {
    setBasinNav('overview')
    setAlertSeverity(config.riskTier === 'caution' ? 'caution' : config.riskTier === 'danger' ? 'danger' : 'warning')
    setAlertChannels({ sms: true, app: true, radio: false })
    setAlertNote('')
  }, [station.id, config.riskTier])

  const {
    subtitle,
    riskTier,
    riskLabel,
    headerAction,
    headerActionVariant,
    metrics,
    mainChart,
    residents,
    secondaryChart,
    overview,
    thresholdRows,
    assets,
    logs,
    mapCaption,
  } = config

  const navLabel = BASIN_NAV.find((n) => n.id === basinNav)?.label ?? ''

  const thresholdPillTone = (state) => {
    const s = String(state).toLowerCase()
    if (s.includes('danger')) return 'danger'
    if (s.includes('warn')) return 'warning'
    if (s.includes('caution') || s.includes('yellow')) return 'caution'
    if (s.includes('watch') || s.includes('rising') || s.includes('moderate') || s.includes('elevated')) return 'watch'
    if (s === 'ok') return 'safe'
    return 'neutral'
  }

  const toggleChannel = (key) => {
    setAlertChannels((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const headerCta =
    basinNav === 'live-map' || basinNav === 'overview'
      ? { label: headerAction, variant: headerActionVariant }
      : basinNav === 'thresholds'
        ? { label: 'Request threshold change', variant: 'caution' }
        : basinNav === 'assets'
          ? { label: 'Export asset list', variant: 'caution' }
          : basinNav === 'logs'
            ? { label: 'Download audit slice', variant: 'caution' }
            : null

  return (
    <main className="basin-view">
      <aside className="basin-sidebar">
        <div className="brand">THE SENTINEL</div>
        <div className="station-pill">
          <div className="station-title">{station.id}</div>
          <div className={`station-subtitle ${riskTier}`}>{subtitle}</div>
        </div>
        {BASIN_NAV.map((item) =>
          item.danger ? (
            <button
              key={item.id}
              type="button"
              className={`danger-btn${basinNav === item.id ? ' active' : ''}`}
              onClick={() => setBasinNav(item.id)}
            >
              {item.label}
            </button>
          ) : (
            <button
              key={item.id}
              type="button"
              className={`nav-item${basinNav === item.id ? ' active' : ''}`}
              onClick={() => setBasinNav(item.id)}
            >
              {item.label}
            </button>
          ),
        )}
      </aside>

      <section className="basin-content">
        <header className="basin-header">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Back to basin map
          </button>
          <div className="basin-header-titles">
            <h1>
              {station.name} — {station.id}
            </h1>
            <p className="basin-section-eyebrow">{navLabel}</p>
          </div>
          <div className={`risk-chip ${riskTier}`}>{riskLabel}</div>
          {headerCta ? <div className={`header-actions ${headerCta.variant}`}>{headerCta.label}</div> : <div />}
        </header>

        {basinNav === 'overview' && (
          <div className="basin-page basin-page-overview">
            <p className="basin-lead">{overview.summary}</p>
            <ul className="basin-bullet-list">
              {overview.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="basin-stat-grid">
              {overview.stats.map((s) => (
                <article key={s.label} className="basin-stat-card">
                  <span>{s.label}</span>
                  <strong>{s.value}</strong>
                </article>
              ))}
            </div>
          </div>
        )}

        {basinNav === 'live-map' && (
          <div className="basin-page">
            <div className="basin-fake-map" aria-hidden>
              <div className="basin-fake-map-canvas" style={{ height: '400px' }}>
                <LiveMap 
                  stations={[station]} 
                  center={[station.latitude || 7.8731, station.longitude || 80.7718]}
                  zoom={12}
                  selectedBasinId={station.id}
                />
              </div>
              <p className="basin-fake-map-caption">{mapCaption}</p>
            </div>

            <div className="metric-grid">
              {metrics.map((m) => (
                <article key={m.label} className={m.emphasis ? `metric-card ${m.emphasis}` : 'metric-card'}>
                  <p>{m.label}</p>
                  <h2>{m.value}</h2>
                </article>
              ))}
            </div>

            <div className="basin-panels">
              <article className="panel wide">
                <h3>{mainChart.title}</h3>
                <div className="bar-chart">
                  {mainChart.heights.map((h, i) => (
                    <span key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </article>
              <article className="panel">
                <h3>{residents.title}</h3>
                <div className="resident-grid">
                  {residents.rows.map((row) => (
                    <div key={row.label}>
                      <strong>{row.value}</strong>
                      <small>{row.label}</small>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel">
                <h3>{secondaryChart.title}</h3>
                <div className="mini-bars">
                  {secondaryChart.heights.map((h, i) => (
                    <span key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </article>
            </div>
          </div>
        )}

        {basinNav === 'thresholds' && (
          <div className="basin-page">
            <div className="basin-table-wrap">
              <table className="basin-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Configured bands</th>
                    <th>Live posture</th>
                  </tr>
                </thead>
                <tbody>
                  {thresholdRows.map((row) => (
                    <tr key={row.metric}>
                      <td>{row.metric}</td>
                      <td>{row.band}</td>
                      <td>
                        <span className={`basin-pill-tag tone-${thresholdPillTone(row.state)}`}>{row.state}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="basin-footnote">Values are indicative for demo purposes; production would bind to NBRO / Irrigation signed-off tables.</p>
          </div>
        )}

        {basinNav === 'assets' && (
          <div className="basin-page basin-page-assets">
            <div className="basin-asset-grid">
              {assets.map((a) => (
                <article key={a.code} className="basin-asset-card">
                  <header>
                    <span className="basin-asset-code">{a.code}</span>
                    <span className={`basin-asset-status ${a.status === 'Online' ? 'ok' : 'warn'}`}>{a.status}</span>
                  </header>
                  <h4>{a.name}</h4>
                  <p>{a.role}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {basinNav === 'logs' && (
          <div className="basin-page basin-page-logs">
            <ol className="basin-log-timeline">
              {logs.map((log) => (
                <li key={`${log.time}-${log.text}`}>
                  <time>{log.time}</time>
                  <span className="basin-log-tag">{log.tag}</span>
                  <p>{log.text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {basinNav === 'issue-alert' && (
          <div className="basin-page basin-page-alert">
            <div className="basin-alert-grid">
              <div className="basin-alert-panel">
                <h3>Compose advisory</h3>
                <p className="basin-muted">Broadcast scope defaults to this station footprint and linked GN divisions.</p>
                <label className="basin-field-label">Severity</label>
                <div className="basin-severity-row">
                  {['caution', 'warning', 'danger'].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      className={`basin-chip-btn${alertSeverity === sev ? ' active' : ''} ${sev}`}
                      onClick={() => setAlertSeverity(sev)}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
                <label className="basin-field-label">Channels</label>
                <div className="basin-check-row">
                  <label>
                    <input type="checkbox" checked={alertChannels.sms} onChange={() => toggleChannel('sms')} /> SMS
                  </label>
                  <label>
                    <input type="checkbox" checked={alertChannels.app} onChange={() => toggleChannel('app')} /> Sentinel app
                  </label>
                  <label>
                    <input type="checkbox" checked={alertChannels.radio} onChange={() => toggleChannel('radio')} /> Community radio
                  </label>
                </div>
                <label className="basin-field-label" htmlFor="basin-alert-body">
                  Message body
                </label>
                <textarea
                  id="basin-alert-body"
                  className="basin-textarea"
                  rows={5}
                  value={alertNote}
                  onChange={(e) => setAlertNote(e.target.value)}
                  placeholder={`[${station.id}] Add situation text for duty officers…`}
                />
                <div className="basin-alert-actions">
                  <button type="button" className="basin-btn-primary">
                    Queue broadcast
                  </button>
                  <button type="button" className="basin-btn-ghost">
                    Save draft
                  </button>
                </div>
              </div>
              <aside className="basin-alert-preview">
                <h3>Preview</h3>
                <div className={`basin-preview-card ${alertSeverity}`}>
                  <div className="basin-preview-station">
                    {station.name} · {station.id}
                  </div>
                  <div className="basin-preview-severity">{alertSeverity.toUpperCase()}</div>
                  <p>{alertNote || 'No custom text yet — template will include latest sensor snapshot.'}</p>
                  <ul>
                    <li>SMS: {alertChannels.sms ? 'On' : 'Off'}</li>
                    <li>App: {alertChannels.app ? 'On' : 'Off'}</li>
                    <li>Radio: {alertChannels.radio ? 'On' : 'Off'}</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function App() {
  // ─── Auth state ────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isLoggedIn())
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser())

  const [activePage, setActivePage] = useState('live')
  const [selectedBasin, setSelectedBasin] = useState(null)
  const [activeSettingsTab, setActiveSettingsTab] = useState('Users & roles')
  const [showProfile, setShowProfile] = useState(false)

  // ─── Live API data state ───────────────────────────────────────────────────
  const [apiAlerts, setApiAlerts] = useState([])
  const [apiStations, setApiStations] = useState([])
  const [apiUsers, setApiUsers] = useState([])
  const [apiDashboard, setApiDashboard] = useState(null)
  const [apiStats, setApiStats] = useState([])
  const [apiLogs, setApiLogs] = useState([])
  const [apiMlLatest, setApiMlLatest] = useState(null)
  const [apiMlHistory, setApiMlHistory] = useState([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  // ─── Listen for forced logout ──────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setIsLoggedIn(false)
      setCurrentUser(null)
    }
    window.addEventListener('eris-logout', handler)
    return () => window.removeEventListener('eris-logout', handler)
  }, [])

  // ─── Fetch all live data from the backend ──────────────────────────────────
  const fetchAllData = useCallback(async () => {
    if (!isLoggedIn) return
    setApiLoading(true)
    setApiError('')
    try {
      const [alerts, stations, users, dashboard, stats, logs, mlLatest, mlHistory] = await Promise.allSettled([
        AlertService.getAll(),
        StationService.getAll(),
        AuthService.getAllUsers(),
        DashboardService.getSummary(),
        StatisticsService.getAll(),
        LogService.getAll(),
        MlPredictionService.getLatest(),
        MlPredictionService.getHistory(),
      ])

      if (alerts.status === 'fulfilled') setApiAlerts(Array.isArray(alerts.value) ? alerts.value : [])
      if (stations.status === 'fulfilled') setApiStations(Array.isArray(stations.value) ? stations.value : [])
      if (users.status === 'fulfilled') setApiUsers(Array.isArray(users.value) ? users.value : [])
      if (dashboard.status === 'fulfilled') setApiDashboard(dashboard.value)
      if (stats.status === 'fulfilled') setApiStats(Array.isArray(stats.value) ? stats.value : [])
      if (logs.status === 'fulfilled') setApiLogs(Array.isArray(logs.value) ? logs.value : [])
      if (mlLatest.status === 'fulfilled') setApiMlLatest(mlLatest.value)
      if (mlHistory.status === 'fulfilled') setApiMlHistory(Array.isArray(mlHistory.value) ? mlHistory.value : [])
      setLastRefresh(new Date())
    } catch (err) {
      setApiError(err.message || 'Failed to fetch data')
    } finally {
      setApiLoading(false)
    }
  }, [isLoggedIn])

  // ─── Auto-refresh every 30 seconds ─────────────────────────────────────────
  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  // ─── Login handler ─────────────────────────────────────────────────────────
  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true)
    setCurrentUser({
      id: data.id,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      district: data.district,
      phoneNumber: data.phoneNumber,
    })
  }

  // ─── Logout handler ───────────────────────────────────────────────────────
  const handleLogout = () => {
    AuthService.logout()
  }

  // ─── Show login if not authenticated ───────────────────────────────────────
  // (Moved to the bottom, before main return, to satisfy React Hooks rules)

  // ─── Derive user initials ─────────────────────────────────────────────────
  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  // ─── Compute live counts from API data ─────────────────────────────────────
  const activeAlertCount = apiAlerts.filter(a => a.status === 'ACTIVE').length
  const dangerAlerts = apiAlerts.filter(a => a.riskLevel === 'DANGER' && a.status === 'ACTIVE')
  const warningAlerts = apiAlerts.filter(a => a.riskLevel === 'WARNING' && a.status === 'ACTIVE')
  const onlineStations = apiStations.filter(s => s.status === 'ACTIVE').length
  const totalStations = apiStations.length

  // ─── Fallback static stations for the live map ─────────────────────────────
  const stations = useMemo(
    () => [
      { id: 'KR-04', name: 'Kelani River Basin', risk: 'danger', hazard: 'flood', people: 1248, waterLevel: '8.2 m', latitude: 6.95, longitude: 79.95 },
      { id: 'ML-09', name: 'Matara Highlands', risk: 'danger', hazard: 'landslide', people: 932, waterLevel: '6.7 m', latitude: 6.12, longitude: 80.55 },
      { id: 'KG-02', name: 'Kalu Ganga', risk: 'warning', hazard: 'flood', people: 804, waterLevel: '5.9 m', latitude: 6.58, longitude: 80.20 },
      { id: 'KH-11', name: 'Kandy Hills', risk: 'caution', hazard: 'landslide', people: 554, waterLevel: '4.3 m', latitude: 7.29, longitude: 80.63 },
    ],
    [],
  )

  const [liveAlertFilter, setLiveAlertFilter] = useState('all')
  const [mapBase, setMapBase] = useState('terrain')
  const [mapLayers, setMapLayers] = useState({
    floodOverlay: false,
    landslideZones: false,
    evacuationRoutes: false,
  })
  const [mapZoom, setMapZoom] = useState(7)
  
  // Analytics State
  const [analyticsFilter, setAnalyticsFilter] = useState({ date: 'Last 30 days', type: 'All types', province: 'All provinces' })
  
  // Alerts State
  const [alertQuickFilter, setAlertQuickFilter] = useState('All alerts')
  const [alertSearch, setAlertSearch] = useState('')
  
  // Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({ fullName: '', email: '', password: '', role: 'USER', district: '', phoneNumber: '' })

  const [showStationModal, setShowStationModal] = useState(false)
  const [stationForm, setStationForm] = useState({ name: '', district: '', location: '', latitude: '', longitude: '', type: 'FLOOD', status: 'ACTIVE' })

  const filteredLiveStations = useMemo(() => {
    if (liveAlertFilter === 'all') return stations
    return stations.filter((s) => s.hazard === liveAlertFilter)
  }, [stations, liveAlertFilter])

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await httpClient.put(`/api/auth/users/${editingUser.id}`, userForm)
      } else {
        await httpClient.post('/api/auth/register', userForm)
      }
      const usersData = await httpClient.get('/api/auth/users')
      setApiUsers(usersData)
      setShowUserModal(false)
    } catch (err) {
      alert('Failed to save user: ' + err.message)
    }
  }

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setUserForm({ 
        fullName: user.fullName || '', 
        email: user.email || '', 
        password: '', 
        role: user.role || 'USER', 
        district: user.district || '', 
        phoneNumber: user.phoneNumber || '' 
      })
    } else {
      setEditingUser(null)
      setUserForm({ fullName: '', email: '', password: '', role: 'USER', district: '', phoneNumber: '' })
    }
    setShowUserModal(true)
  }

  const handleSaveStation = async () => {
    try {
      await httpClient.post('/api/stations', stationForm)
      const stationsData = await httpClient.get('/api/stations')
      setApiStations(stationsData)
      setShowStationModal(false)
    } catch (err) {
      alert('Failed to save station: ' + err.message)
    }
  }

  const openStationModal = () => {
    setStationForm({ name: '', district: '', location: '', latitude: '', longitude: '', type: 'FLOOD', status: 'ACTIVE' })
    setShowStationModal(true)
  }

  const toggleMapLayer = (key) => {
    setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const activeStation = selectedBasin
    ? stations.find((station) => station.id === selectedBasin)
    : null

  const basinDetail = activeStation ? BASIN_DETAILS[activeStation.id] : null

  const alertFrequency = [45, 58, 74, 70, 49, 43, 56, 79, 85, 102, 94, 81]
  const responseTrend = [2.6, 2.9, 2.8, 2.7, 2.9, 2.8, 2.6]
  const monthlyAlerts = [
    { station: 'Kelani River Basin', code: 'KR-04', type: 'Flood', status: 'Danger', trigger: 'Water 8.2m | Flow 4.1m/s', people: '18,400', time: '21 min ago', action: 'Alert' },
    { station: 'Matara Highlands', code: 'ML-09', type: 'Landslide', status: 'Danger', trigger: 'Soil 94% | Vibration 8', people: '23,900', time: '34 min ago', action: 'Alert' },
    { station: 'Kalu Ganga', code: 'KG-02', type: 'Flood', status: 'Warning', trigger: 'Water 5.7m | Rain 148mm', people: '9,200', time: '1 hr ago', action: 'Monitor' },
    { station: 'Kandy Hills', code: 'KH-11', type: 'Landslide', status: 'Caution', trigger: 'Soil 78% | Rain 140mm', people: '6,100', time: '2 hr ago', action: 'Monitor' },
    { station: 'Gampaha District', code: 'GP-07', type: 'Flood', status: 'Resolved', trigger: 'Water 2.8m (normal)', people: '3,200', time: '5 hr ago', action: 'History' },
  ]
  const recentReports = [
    {
      id: 'SLR-2026-042',
      title: 'Situation report - Kelani River danger event',
      description: 'Real-time flood alert, affected population, response actions',
      generatedOn: '08 Apr 2026 - 14:11',
      type: 'PDF',
      size: '2.7 MB',
      category: 'Situation report',
      status: 'new',
    },
    {
      id: 'SUM-2026-03',
      title: 'Monthly summary - March 2026',
      description: '32 alerts, 480K people warned, model performance metrics',
      generatedOn: '01 Apr 2026 - 09:00',
      type: 'PDF',
      size: '5.1 MB',
      category: 'Monthly summary',
      status: 'published',
    },
    {
      id: 'MLV-Q1-2026',
      title: 'ML model validation - Q1 2026',
      description: 'Flood: 95.2% accuracy, Landslide: 93.7% accuracy, F1 score',
      generatedOn: '31 Mar 2026 - 17:16',
      type: 'PDF',
      size: '3.8 MB',
      category: 'Model validation',
      status: 'published',
    },
    {
      id: 'SEA-2026-MON',
      title: 'Seasonal analysis - Northeast monsoon 2025/26',
      description: 'High-risk zones, trend analysis, preparedness recommendations',
      generatedOn: '13 Mar 2026 - 11:26',
      type: 'PDF',
      size: '7.2 MB',
      category: 'Seasonal analysis',
      status: 'published',
    },
    {
      id: 'REC-2026-Q1',
      title: 'Monthly summary - February 2026',
      description: '44 alerts, Cyclone Driya aftermath, recovery status',
      generatedOn: '01 Mar 2026 - 09:05',
      type: 'PDF',
      size: '6.4 MB',
      category: 'Monthly summary',
      status: 'published',
    },
  ]
  const includeSections = [
    'Executive summary',
    'Alert log',
    'Sensor data',
    'ML performance',
    'Recommendations',
  ]
  const scheduledReports = [
    { report: 'Daily situation report', frequency: 'Daily 08:00', nextRun: 'Tomorrow 08:00' },
    { report: 'Monthly summary', frequency: '1st of month', nextRun: '01 May 2026' },
    { report: 'Seasonal analysis', frequency: 'Quarterly', nextRun: '01 Jul 2026' },
  ]
  const settingsMenu = [
    'General',
    'Users & roles',
    'Monitoring stations',
    'Alert thresholds',
    'Notification channels',
    'Security & access',
    'API integration',
    'Language & region',
    'Audit log',
  ]
  const [generalSettings, setGeneralSettings] = useState([
    {
      title: 'Auto-broadcast on DANGER',
      description: 'Automatically send push + SMS when a station reaches DANGER threshold',
      enabled: true,
    },
    {
      title: 'Require manual confirmation for alerts',
      description: 'Require a second officer to confirm before broadcasting national alerts',
      enabled: true,
    },
    {
      title: 'Sensor failure alerts',
      description: 'Notify operations team when a monitoring station goes offline',
      enabled: true,
    },
    {
      title: 'Automated daily reports',
      description: 'Generate and email situation report every morning at 08:00 IST',
      enabled: true,
    },
    {
      title: 'Dark mode',
      description: 'Switch dashboard appearance',
      enabled: false,
    },
  ])
  const users = [
    { initials: 'AD', name: 'A. Dhanssuri', role: 'Super admin · DMC' },
    { initials: 'KP', name: 'K. Perera', role: 'Operations officer' },
    { initials: 'RM', name: 'R. Mendis', role: 'Field supervisor' },
    { initials: 'SJ', name: 'S. Jayawardena', role: 'Read-only viewer' },
  ]
  const monitoringStations = [
    { code: 'KR-04', name: 'Kelani River', status: 'Online', action: 'Configure' },
    { code: 'ML-09', name: 'Matara Highlands', status: 'Online', action: 'Configure' },
    { code: 'KG-02', name: 'Kalu Ganga', status: 'Online', action: 'Configure' },
    { code: 'GP-07', name: 'Gampaha', status: 'Offline', action: 'Diagnose' },
    { code: 'NW-12', name: 'North Western', status: 'Offline', action: 'Diagnose' },
  ]
  const floodThresholds = [
    { metric: 'Safe threshold (m)', value: '4.0' },
    { metric: 'Warning threshold (m)', value: '6.0' },
    { metric: 'Danger threshold (m)', value: '8.0' },
  ]
  const landslideThresholds = [
    { metric: 'Rain safe (mm/24h)', value: '100' },
    { metric: 'NBRO warning (mm/24h)', value: '150' },
    { metric: 'NBRO danger (mm/72h)', value: '250' },
  ]

  const newUsers = [
    { initials: 'AD', name: 'A. Dharmasiri', role: 'Super admin - DMC' },
    { initials: 'KP', name: 'K. Perera', role: 'Operations officer' },
    { initials: 'RM', name: 'R. Mendis', role: 'Field supervisor' },
    { initials: 'SJ', name: 'S. Jayawardena', role: 'Read-only viewer' },
  ]

  const newStations = [
    { id: 'KR-04', name: 'Kelani River', lastReading: '2 minutes ago', status: 'Online' },
    { id: 'ML-09', name: 'Matara Highlands', lastReading: '1 minute ago', status: 'Online' },
    { id: 'JN-02', name: 'Jaffna North', lastReading: '45 minutes ago', status: 'Offline' },
  ]

  const [newThresholds, setNewThresholds] = useState([
    { name: 'River Water Level', min: '2.5m', max: '8.0m' },
    { name: 'Soil Moisture', min: '20%', max: '85%' },
    { name: 'Daily Rainfall', min: '10mm', max: '150mm' },
  ])

  const [newChannels, setNewChannels] = useState([
    { icon: '✉️', name: 'Email', detail: 'ops-team@example.com', active: true },
    { icon: '📱', name: 'SMS', detail: '+94 77 123 4567', active: false },
    { icon: '💬', name: 'Slack', detail: '#water-alerts channel', active: true },
    { icon: '🔗', name: 'Webhook', detail: 'https://api.example.com/alerts', active: false },
  ])

  const newApiIntegrations = [
    { name: 'Weather API', desc: 'Real-time weather data integration', status: 'Connected', icon: '✓' },
    { name: 'Database Sync', desc: 'Sync data with external PostgreSQL database', status: 'Disconnected', icon: '⚠' },
    { name: 'Analytics Platform', desc: 'Send metrics to third-party analytics', status: 'Connected', icon: '✓' },
  ]

  const [newLanguageSettings, setNewLanguageSettings] = useState([
    { label: 'Language', value: 'English (US)', options: ['English (US)', 'Sinhala', 'Tamil'] },
    { label: 'Region', value: 'Sri Lanka', options: ['Sri Lanka', 'Global'] },
    { label: 'Timezone', value: 'Asia/Colombo (UTC+5:30)', options: ['Asia/Colombo (UTC+5:30)', 'UTC'] },
    { label: 'Date format', value: 'DD/MM/YYYY', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
  ])

  const [securitySettings, setSecuritySettings] = useState([
    { name: 'Two-factor authentication', desc: 'Require 2FA for all users', active: true },
    { name: 'IP whitelisting', desc: 'Restrict access to specific IP addresses', active: false },
    { name: 'API key rotation', desc: 'Rotate API keys every 90 days', active: true },
    { name: 'Password policy', desc: 'Minimum 12 characters, uppercase, numbers, symbols', active: true },
  ])
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes')

  const newAuditLogs = [
    { action: 'User login', detail: 'K. Perera logged in from 192.168.1.50', time: 'Today 09:45' },
    { action: 'Failed login attempt', detail: 'Invalid credentials from 203.94.115.220', time: 'Today 09:32' },
    { action: 'Threshold updated', detail: 'A. Dharmasiri modified pH threshold to 6.0-8.5', time: 'Today 08:20' },
    { action: 'Station went offline', detail: 'Monitoring station JN-02 lost connection', time: 'Today 07:15' },
    { action: 'User created', detail: 'New user S. Jayawardena added as Read-only viewer', time: 'Yesterday 14:30' },
  ]

  if (activeStation && basinDetail) {
    const pages = BASIN_PAGES[activeStation.id]
    return (
      <BasinWorkspace
        station={activeStation}
        config={{ ...basinDetail, ...pages }}
        onClose={() => setSelectedBasin(null)}
      />
    )
  }

  const renderLiveMap = () => (
    <>
      <section className="body-grid">
        <aside className="left-panel">
          <h2>Active Alerts</h2>
          <div className="tabs" role="tablist" aria-label="Filter active alerts">
            <button
              type="button"
              role="tab"
              aria-selected={liveAlertFilter === 'all'}
              className={liveAlertFilter === 'all' ? 'active' : ''}
              onClick={() => setLiveAlertFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={liveAlertFilter === 'flood'}
              className={liveAlertFilter === 'flood' ? 'active' : ''}
              onClick={() => setLiveAlertFilter('flood')}
            >
              Flood
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={liveAlertFilter === 'landslide'}
              className={liveAlertFilter === 'landslide' ? 'active' : ''}
              onClick={() => setLiveAlertFilter('landslide')}
            >
              Landslide
            </button>
          </div>
          {filteredLiveStations.length === 0 ? (
            <p className="live-filter-empty">No active alerts for this hazard type.</p>
          ) : (
            filteredLiveStations.map((station) => (
              <button
                key={station.id}
                type="button"
                className={`alert-card ${station.risk}`}
                onClick={() => BASIN_DETAIL_IDS.includes(station.id) && setSelectedBasin(station.id)}
              >
                <strong>{station.name}</strong>
                <small>
                  {station.id} · {station.hazard === 'flood' ? 'Flood' : 'Landslide'} · {station.risk.toUpperCase()}
                </small>
                {BASIN_DETAIL_IDS.includes(station.id) && <em>Open basin view</em>}
              </button>
            ))
          )}

          <h2>Live Sensors</h2>
          <ul className="sensor-list">
            <li><span>Water level KR-04</span><strong>8.2 m</strong></li>
            <li><span>Soil moisture ML-09</span><strong>94%</strong></li>
            <li><span>Rainfall KG-02</span><strong>148 mm</strong></li>
            <li><span>Vibration KH-11</span><strong>3.2 Hz</strong></li>
          </ul>
        </aside>

        <section className="map-panel">
          <div className="map-toolbar">
            <div className="map-tools-left">
              <button
                type="button"
                className="icon-btn"
                aria-label="Zoom in"
                onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
              >
                +
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Zoom out"
                onClick={() => setMapZoom((z) => Math.max(4, z - 1))}
              >
                −
              </button>
              <button
                type="button"
                className={`text-btn${mapBase === 'terrain' ? ' active' : ''}`}
                aria-pressed={mapBase === 'terrain'}
                onClick={() => setMapBase('terrain')}
              >
                Terrain
              </button>
              <button
                type="button"
                className={`text-btn${mapBase === 'satellite' ? ' active' : ''}`}
                aria-pressed={mapBase === 'satellite'}
                onClick={() => setMapBase('satellite')}
              >
                Satellite
              </button>
              <button
                type="button"
                className={`text-btn${mapLayers.floodOverlay ? ' active' : ''}`}
                aria-pressed={mapLayers.floodOverlay}
                onClick={() => toggleMapLayer('floodOverlay')}
              >
                Flood overlay
              </button>
              <button
                type="button"
                className={`text-btn${mapLayers.landslideZones ? ' active' : ''}`}
                aria-pressed={mapLayers.landslideZones}
                onClick={() => toggleMapLayer('landslideZones')}
              >
                Landslide zones
              </button>
              <button
                type="button"
                className={`text-btn${mapLayers.evacuationRoutes ? ' active' : ''}`}
                aria-pressed={mapLayers.evacuationRoutes}
                onClick={() => toggleMapLayer('evacuationRoutes')}
              >
                Evacuation routes
              </button>
            </div>
            <div className="map-tools-center">
              <span className="dot danger"></span> Danger <span className="dot warning"></span> Warning <span className="dot safe"></span> Safe
            </div>
            <div className="map-tools-right">
              <button className="btn-primary" onClick={() => setShowBroadcastModal(true)}>Broadcast alert</button>
              <button 
                className="btn-secondary" 
                style={{marginLeft: '8px'}}
                onClick={() => downloadCSV(filteredLiveStations, 'eris_live_map_stations')}
              >
                Export
              </button>
            </div>
          </div>
          <div className="map-canvas">
            <LiveMap 
              stations={filteredLiveStations}
              center={[7.8731, 80.7718]}
              zoom={mapZoom}
              mapBase={mapBase}
              mapLayers={mapLayers}
              onStationClick={setSelectedBasin}
              selectedBasinId={selectedBasin}
            />
          </div>
        </section>

        <aside className="right-panel">
          <h2>National Risk Level</h2>
          <div className="risk-meter"><span className="safe" /><span className="warning" /><span className="danger" /></div>
          <p className="headline">{dangerAlerts.length > 0 ? `High - ${dangerAlerts.length} active danger zone${dangerAlerts.length > 1 ? 's' : ''}` : 'High - 2 active danger zones'}</p>

          {apiMlLatest && (
            <>
              <h2>ML Prediction (Live)</h2>
              <div className="ml-live-card">
                <div className={`ml-status ${apiMlLatest.predictionResult === 'DISASTER' ? 'danger' : 'safe'}`}>
                  {apiMlLatest.predictionResult}
                </div>
                <p><strong>Confidence:</strong> {apiMlLatest.confidencePct?.toFixed(1)}%</p>
                <p><strong>District:</strong> {apiMlLatest.district || 'N/A'}</p>
                <p><strong>Flood risk:</strong> {apiMlLatest.floodRisk || 'N/A'}</p>
                <p><strong>Landslide risk:</strong> {apiMlLatest.landslideRisk || 'N/A'}</p>
                <small>Updated: {apiMlLatest.receivedAt ? new Date(apiMlLatest.receivedAt).toLocaleString() : 'Unknown'}</small>
              </div>
            </>
          )}

          <h2>Quick Actions</h2>
          <button className="quick-action">Broadcast danger alert</button>
          <button className="quick-action">Activate evacuation routes</button>
          <button className="quick-action">Send SMS blast</button>
          <button className="quick-action" onClick={fetchAllData} disabled={apiLoading}>{apiLoading ? 'Refreshing…' : 'Refresh all data'}</button>
          <h2>Event Timeline</h2>
          <ul className="timeline">
            {apiAlerts.length > 0 ? (
              apiAlerts.slice(0, 4).map((a, i) => (
                <li key={a.id || i}>{a.title || `${a.type} alert`} — {a.district} ({a.riskLevel})</li>
              ))
            ) : (
              <>
                <li>Kelani crossed danger threshold</li>
                <li>Matara vibration spike</li>
                <li>Kalu Ganga upgraded to warning</li>
                <li>Push alerts sent to 24,100 users</li>
              </>
            )}
          </ul>
        </aside>
      </section>
      <footer className="status-grid">
        <div><small>Danger zones</small><strong>{dangerAlerts.length || 2}</strong><span className="detail">{dangerAlerts.length > 0 ? dangerAlerts.map(a => a.district).join(', ') : 'Kelani, Matara'}</span></div>
        <div><small>Warning zones</small><strong>{warningAlerts.length || 2}</strong><span className="detail">{warningAlerts.length > 0 ? warningAlerts.map(a => a.district).join(', ') : 'Kalu, Kandy'}</span></div>
        <div><small>Stations online</small><strong>{totalStations > 0 ? `${onlineStations} / ${totalStations}` : '16 / 18'}</strong><span className="detail">{totalStations > 0 ? `${totalStations - onlineStations} offline` : '2 offline'}</span></div>
        <div><small>Alert latency</small><strong>2.4 min</strong><span className="detail">Target {'<'} 5 min ✓</span></div>
        <div><small>ML model</small><strong>{apiMlLatest ? apiMlLatest.predictionResult : '—'}</strong><span className="detail">{apiMlLatest ? `${apiMlLatest.confidencePct?.toFixed(1)}% confidence` : 'No predictions yet'}</span></div>
      </footer>
    </>
  )

  const renderAnalytics = () => (
    <section className="page-shell">
      <aside className="filter-sidebar">
        <h3>Filters</h3>
        <label>Date range<select value={analyticsFilter.date} onChange={e => setAnalyticsFilter(prev => ({...prev, date: e.target.value}))}><option>Last 30 days</option><option>Last 7 days</option><option>This Year</option></select></label>
        <label>Disaster type<select value={analyticsFilter.type} onChange={e => setAnalyticsFilter(prev => ({...prev, type: e.target.value}))}><option>All types</option><option>Flood</option><option>Landslide</option></select></label>
        <label>Province<select value={analyticsFilter.province} onChange={e => setAnalyticsFilter(prev => ({...prev, province: e.target.value}))}><option>All provinces</option><option>Western</option><option>Central</option><option>Southern</option></select></label>
        <button className="btn-primary" onClick={() => alert(`Applied filters: ${JSON.stringify(analyticsFilter)}`)}>Apply filters</button>

        <h3>Key metrics</h3>
        <div className="mini-kpis">
          <p><strong>284</strong><span>Total alerts</span></p>
          <p><strong>1.2M</strong><span>People warned</span></p>
          <p><strong>2.8 min</strong><span>Avg response</span></p>
          <p><strong>1.4%</strong><span>False alert rate</span></p>
        </div>
      </aside>

      <div className="main-analytics">
        <header className="page-header">
          <div>
            <h1>Analytics & reports</h1>
            <p>Disaster trends, response performance and model quality</p>
          </div>
          <div className="header-buttons">
            <button 
              className="btn-secondary"
              onClick={() => {
                const analyticsData = [
                  { Metric: 'Total Alerts', Value: '284' },
                  { Metric: 'People Warned', Value: '1.2M' },
                  { Metric: 'Avg Response', Value: '2.8 min' },
                  { Metric: 'False Alert Rate', Value: '1.4%' },
                  { Metric: 'Flood Alerts', Value: '164' },
                  { Metric: 'Landslide Alerts', Value: '120' },
                  { Metric: 'SMS Delivered', Value: '98.2%' },
                  { Metric: 'Model Accuracy', Value: '94.6%' },
                  { Metric: 'Server Uptime', Value: '99.8%' }
                ];
                downloadCSV(analyticsData, 'eris_analytics_summary');
              }}
            >
              Export CSV
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                alert("This will open the browser print dialog. You can 'Save as PDF' from there to generate the report.");
                window.print();
              }}
            >
              Generate report
            </button>
          </div>
        </header>

        <div className="kpi-row">
          <article><span>Flood alerts</span><strong>164</strong><small>58% of total</small></article>
          <article><span>Landslide alerts</span><strong>120</strong><small>42% of total</small></article>
          <article><span>SMS delivered</span><strong>98.2%</strong><small>Delivery ratio</small></article>
          <article><span>Model accuracy</span><strong>94.6%</strong><small>ML prediction</small></article>
          <article><span>Server uptime</span><strong>99.8%</strong><small>All stations</small></article>
        </div>

        <div className="chart-grid">
          <article className="chart-card">
            <h4>Alert frequency - past 12 months</h4>
            <div className="bars">
              {alertFrequency.map((value, index) => (
                <span key={index} style={{ height: `${value}%` }} title={`${value} alerts`} />
              ))}
            </div>
            <div className="axis">{['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((month) => <small key={month}>{month}</small>)}</div>
          </article>

          <article className="chart-card donut-wrap">
            <h4>Alert breakdown by type</h4>
            <div className="donut" />
            <ul className="legend">
              <li><span className="flood-dot" />Flood - 164 (58%)</li>
              <li><span className="landslide-dot" />Landslide - 120 (42%)</li>
              <li><span className="false-dot" />False positive - 4 (1.4%)</li>
            </ul>
          </article>

          <article className="chart-card">
            <h4>Alert response time (min)</h4>
            <div className="response-bars">
              {responseTrend.map((time, index) => (
                <span key={index} style={{ height: `${(time / 3.2) * 100}%` }}>{time}</span>
              ))}
            </div>
            <div className="axis">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <small key={day}>{day}</small>)}</div>
          </article>

          <article className="chart-card">
            <h4>Sensor reliability by station</h4>
            <div className="reliability">
              <p><span>KR-04 Kelani</span><strong>98%</strong></p>
              <p><span>ML-09 Matara</span><strong>99.2%</strong></p>
              <p><span>KG-02 Kalu</span><strong>98.7%</strong></p>
              <p><span>KH-11 Kandy</span><strong>92.4%</strong></p>
              <p><span>JP-01 Jaffna</span><strong>100%</strong></p>
            </div>
          </article>
        </div>
      </div>
    </section>
  )

  const renderAlerts = () => (
    <section className="page-shell">
      <aside className="filter-sidebar">
        <h3>Alert summary</h3>
        <div className="mini-kpis">
          <p><strong>4</strong><span>Active now</span></p>
          <p><strong>7</strong><span>Resolved today</span></p>
          <p><strong>68</strong><span>Total this month</span></p>
        </div>

        <h3>Quick filters</h3>
        <div className="quick-tags">
          {['All alerts', 'Danger only', 'Warning only', 'Flood', 'Landslide', 'Resolved'].map(filter => (
            <button 
              key={filter} 
              className={alertQuickFilter === filter ? 'active' : ''} 
              onClick={() => setAlertQuickFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className="btn-danger" onClick={() => setShowIssueModal(true)}>Issue new alert</button>
      </aside>

      <div className="main-alerts">
        <header className="page-header">
          <div>
            <h1>Alert management</h1>
            <p>View, filter and manage all disaster alerts</p>
          </div>
          <div className="header-buttons">
            <input className="search-box" placeholder="Search alerts..." value={alertSearch} onChange={e => setAlertSearch(e.target.value)} />
            <button 
              className="btn-secondary"
              onClick={() => downloadCSV(monthlyAlerts, 'eris_alert_history')}
            >
              Export
            </button>
            <button className="btn-danger" onClick={() => setShowIssueModal(true)}>Issue alert</button>
          </div>
        </header>

        <div className="table-wrap">
          <table className="alert-table">
            <thead>
              <tr>
                <th>Station / location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Trigger values</th>
                <th>Citizens affected</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {monthlyAlerts
                .filter(alert => {
                  if (alertSearch && !alert.station.toLowerCase().includes(alertSearch.toLowerCase())) return false;
                  if (alertQuickFilter === 'All alerts') return true;
                  if (alertQuickFilter === 'Danger only') return alert.status === 'Danger';
                  if (alertQuickFilter === 'Warning only') return alert.status === 'Warning';
                  if (alertQuickFilter === 'Flood') return alert.type === 'Flood';
                  if (alertQuickFilter === 'Landslide') return alert.type === 'Landslide';
                  if (alertQuickFilter === 'Resolved') return alert.status === 'Resolved';
                  return true;
                })
                .map((alert) => (
                <tr key={alert.code}>
                  <td><strong>{alert.station}</strong><small>{alert.code}</small></td>
                  <td><span className={`pill ${alert.type.toLowerCase()}`}>{alert.type}</span></td>
                  <td><span className={`pill status ${alert.status.toLowerCase()}`}>{alert.status}</span></td>
                  <td>{alert.trigger}</td>
                  <td>{alert.people}</td>
                  <td>{alert.time}</td>
                  <td>
                    <button 
                      className="table-btn" 
                      onClick={() => {
                        if (alert.action === 'Alert') {
                          setShowIssueModal(true);
                        } else if (alert.action === 'Monitor') {
                          setActivePage('live');
                        } else {
                          window.alert(`Viewing historical log for ${alert.station}`);
                        }
                      }}
                    >
                      {alert.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )

  const renderReports = () => (
    <section className="reports-page">
      <aside className="reports-sidebar">
        <h3>Generate report</h3>
        <label>
          Report type
          <select defaultValue="Situation report">
            <option>Situation report</option>
            <option>Monthly summary</option>
            <option>ML model validation</option>
            <option>Seasonal analysis</option>
          </select>
        </label>

        <label>
          Date range
          <select defaultValue="Today">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Custom range</option>
          </select>
        </label>

        <div className="report-section-picks">
          <p>Include sections</p>
          {includeSections.map((section) => (
            <label key={section} className="checkbox-row">
              <input type="checkbox" defaultChecked />
              <span>{section}</span>
            </label>
          ))}
        </div>

        <label>
          Format
          <select defaultValue="PDF (.pdf)">
            <option>PDF (.pdf)</option>
            <option>Word (.docx)</option>
            <option>CSV (.csv)</option>
          </select>
        </label>

        <button 
          className="btn-primary" 
          onClick={() => {
            alert("This will open the browser print dialog. You can 'Save as PDF' from there to generate the report.");
            window.print();
          }}
        >
          Generate & download
        </button>
      </aside>

      <div className="reports-main">
        <header className="reports-header">
          <div>
            <h1>Reports & documentation</h1>
            <p>Situation reports, monthly summaries, model validation</p>
          </div>
          <div className="header-buttons">
            <input className="search-box" placeholder="Search reports..." />
            <button className="btn-secondary">Filter</button>
          </div>
        </header>

        <section className="reports-card">
          <div className="reports-card-head">
            <h2>Recent reports</h2>
          </div>
          <div className="reports-list">
            {recentReports.map((report) => (
              <article className="report-row" key={report.id}>
                <div className="report-row-main">
                  <h3>{report.title}</h3>
                  <p>{report.description}</p>
                  <small>
                    Generated {report.generatedOn} - {report.type} - {report.size}
                  </small>
                </div>
                <div className="report-row-actions">
                  {report.status === 'new' && <span className="report-tag">New</span>}
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      const win = window.open('', '_blank');
                      win.document.write(`<pre style="font-family: monospace; padding: 20px;">ERIS SYSTEM REPORT PREVIEW\n\nTitle: ${report.title}\nDescription: ${report.description}\nGenerated: ${report.generatedOn}\nType: ${report.type}\n\n[End of Preview]</pre>`);
                    }}
                  >
                    Preview
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      const content = `ERIS SYSTEM REPORT\n\nTitle: ${report.title}\nDescription: ${report.description}\nGenerated: ${report.generatedOn}\nType: ${report.type}\n\n---\nReport data goes here...`;
                      downloadText(content, report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase());
                    }}
                  >
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="reports-card">
          <div className="reports-card-head">
            <h2>Scheduled reports</h2>
          </div>
          <div className="reports-schedule">
            <div className="schedule-head">
              <span>Report</span>
              <span>Frequency</span>
              <span>Next run</span>
            </div>
            {scheduledReports.map((item) => (
              <div className="schedule-row" key={item.report}>
                <span>{item.report}</span>
                <span>{item.frequency}</span>
                <span>{item.nextRun}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )

  const renderSettings = () => (
    <section className="settings-page">
      <aside className="settings-sidebar">
        <h3>Settings</h3>
        <nav className="settings-nav">
          {settingsMenu.map((item) => (
            <button 
              key={item} 
              className={activeSettingsTab === item ? 'settings-nav-item active' : 'settings-nav-item'}
              onClick={() => setActiveSettingsTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div className="settings-main">
        {activeSettingsTab === 'General' && (
          <>
            <header className="settings-header">
              <div>
                <h1>General settings</h1>
                <p>Configure automation, access, station monitoring and thresholds.</p>
              </div>
            </header>
            <section className="settings-card">
              <div className="settings-grid">
                {generalSettings.map((setting) => (
                  <article key={setting.title} className="setting-row">
                    <div>
                      <h3>{setting.title}</h3>
                      <p>{setting.description}</p>
                    </div>
                    <button 
                      className={setting.enabled ? 'switch on' : 'switch'} 
                      aria-label={setting.title}
                      onClick={() => {
                        setGeneralSettings(prev => prev.map(s => 
                          s.title === setting.title ? { ...s, enabled: !s.enabled } : s
                        ));
                      }}
                    >
                      <span />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {activeSettingsTab === 'Users & roles' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>Users & roles</h2>
              <p>Manage user accounts and permissions ({apiUsers.length > 0 ? `${apiUsers.length} users from API` : 'demo data'})</p>
            </div>
            <div className="dark-entity-list">
              {(apiUsers.length > 0 ? apiUsers : newUsers.map((u, i) => ({ id: i, fullName: u.name, role: u.role, email: '' }))).map((user) => (
                <div className="dark-entity-row" key={user.id || user.fullName}>
                  <div className="dark-entity-row-left">
                    <div className="dark-entity-avatar">
                      {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                    </div>
                    <div className="dark-entity-details">
                      <h3>{user.fullName || user.name}</h3>
                      <p>{user.role}{user.email ? ` · ${user.email}` : ''}</p>
                    </div>
                  </div>
                  <button className="dark-entity-action" onClick={() => openUserModal(user)}>Edit</button>
                </div>
              ))}
            </div>
            <button className="dark-add-button" onClick={() => openUserModal()}>+ Add user</button>
          </section>
        )}

        {activeSettingsTab === 'Monitoring stations' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>Monitoring stations</h2>
              <p>Configure and manage sensor locations</p>
            </div>
            <div className="dark-entity-list">
              {(apiStations.length > 0 ? apiStations : newStations).map((station) => (
                <div className="dark-entity-row" key={station.id}>
                  <div className="dark-entity-details">
                    <h3>{station.id} - {station.name}</h3>
                    <p>Last reading: {station.lastReading || 'N/A'}</p>
                  </div>
                  <div className={`dark-status-chip ${(station.status || '').toLowerCase()}`}>{station.status}</div>
                </div>
              ))}
            </div>
            <button className="dark-add-button" onClick={openStationModal}>+ Add station</button>
          </section>
        )}

        {activeSettingsTab === 'Alert thresholds' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>Alert thresholds</h2>
              <p>Define alert levels for water parameters</p>
            </div>
            <div className="dark-threshold-list">
              {newThresholds.map((t, index) => (
                <div className="dark-threshold-item" key={t.name}>
                  <div className="dark-threshold-header">
                    <h3>{t.name}</h3>
                    <span>Status: Active</span>
                  </div>
                  <div className="dark-threshold-inputs">
                    <label>Min: <input type="text" value={t.min} onChange={(e) => {
                      const updated = [...newThresholds];
                      updated[index].min = e.target.value;
                      setNewThresholds(updated);
                    }} /></label>
                    <label>Max: <input type="text" value={t.max} onChange={(e) => {
                      const updated = [...newThresholds];
                      updated[index].max = e.target.value;
                      setNewThresholds(updated);
                    }} /></label>
                  </div>
                </div>
              ))}
            </div>
            <button className="dark-save-button" onClick={() => alert('Thresholds saved successfully!')}>Save thresholds</button>
          </section>
        )}

        {activeSettingsTab === 'Notification channels' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>Notification channels</h2>
              <p>Configure how alerts are delivered</p>
            </div>
            <div className="dark-entity-list">
              {newChannels.map((channel) => (
                <div className="dark-entity-row" key={channel.name}>
                  <div className="dark-entity-row-left">
                    <div className="channel-icon">{channel.icon}</div>
                    <div className="dark-entity-details">
                      <h3>{channel.name}</h3>
                      <p>{channel.detail}</p>
                    </div>
                  </div>
                  <div 
                    className={`dark-switch ${channel.active ? 'on' : ''}`}
                    onClick={() => {
                      setNewChannels(prev => prev.map(c => 
                        c.name === channel.name ? { ...c, active: !c.active } : c
                      ));
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="dark-switch-knob"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSettingsTab === 'Security & access' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>Security & access</h2>
              <p>Manage authentication and permissions</p>
            </div>
            <div className="dark-security-list">
              {securitySettings.map((sec) => (
                <div className="dark-security-item" key={sec.name}>
                  <div className="dark-security-info">
                    <h3>{sec.name}</h3>
                    <p>{sec.desc}</p>
                  </div>
                  <div 
                    className={`dark-switch ${sec.active ? 'on' : ''}`}
                    onClick={() => setSecuritySettings(prev => prev.map(s => s.name === sec.name ? { ...s, active: !s.active } : s))}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="dark-switch-knob"></div>
                  </div>
                </div>
              ))}
              <div className="dark-security-item block">
                <div className="dark-security-info">
                  <h3>Session timeout</h3>
                  <p>Auto-logout after specified minutes of inactivity</p>
                </div>
                <input 
                  type="text" 
                  className="dark-full-input" 
                  value={sessionTimeout} 
                  onChange={(e) => setSessionTimeout(e.target.value)} 
                />
              </div>
            </div>
            <button className="dark-save-button" onClick={() => alert('Security settings successfully updated.')}>Update security settings</button>
          </section>
        )}

        {activeSettingsTab === 'API integration' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>API integrations</h2>
              <p>Connect external services and data sources</p>
            </div>
            <div className="dark-entity-list">
              {newApiIntegrations.map((api) => (
                <div className="dark-api-row" key={api.name}>
                  <div>
                    <div className="dark-api-info">
                      <h3>{api.name}</h3>
                      <p>{api.desc}</p>
                    </div>
                    <div className={`dark-api-status ${api.status.toLowerCase()}`}>
                      {api.icon} {api.status}
                    </div>
                  </div>
                  <button className="dark-text-button">Settings</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSettingsTab === 'Language & region' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>Language & region</h2>
              <p>Customize localization settings</p>
            </div>
            <div className="dark-form-list">
              {newLanguageSettings.map((setting) => (
                <div className="dark-form-group" key={setting.label}>
                  <label>{setting.label}</label>
                  <div className="dark-select-wrapper">
                    <select 
                      value={setting.value}
                      onChange={(e) => {
                        setNewLanguageSettings(prev => prev.map(s => 
                          s.label === setting.label ? { ...s, value: e.target.value } : s
                        ))
                      }}
                    >
                      {setting.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="dark-select-arrow">▼</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="dark-save-button" onClick={() => alert('Language & region preferences saved!')}>Save preferences</button>
          </section>
        )}

        {activeSettingsTab === 'Audit log' && (
          <section className="dark-settings-card">
            <div className="dark-settings-header">
              <h2>Audit log</h2>
              <p>Track all system and user activities ({apiLogs.length > 0 ? `${apiLogs.length} entries from API` : 'demo data'})</p>
            </div>
            <div className="dark-entity-list">
              {(apiLogs.length > 0 ? apiLogs.slice(0, 20).map(log => ({
                action: log.category || 'System',
                detail: log.message || log.details || '',
                time: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown',
              })) : newAuditLogs).map((log, i) => (
                <div className="dark-audit-row" key={i}>
                  <div className="dark-audit-info">
                    <h3>{log.action}</h3>
                    <p>{log.detail}</p>
                  </div>
                  <div className="dark-audit-time">{log.time}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  )

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <main className="dashboard">
      <header className="top-bar">
        <div className="logo">ERIS Gov Operations Centre</div>
        <nav className="menu">
          <button className={activePage === 'live' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActivePage('live')}>Live map</button>
          <button className={activePage === 'analytics' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActivePage('analytics')}>Analytics</button>
          <button className={activePage === 'alerts' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActivePage('alerts')}>Alerts{activeAlertCount > 0 ? ` (${activeAlertCount})` : ''}</button>
          <button className={activePage === 'reports' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActivePage('reports')}>Reports</button>
          <button className={activePage === 'settings' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActivePage('settings')}>Settings</button>
        </nav>
        <div className="top-actions">
          {apiLoading && <span className="api-loading-dot" title="Syncing with backend…">⟳</span>}
          {apiError && <span className="api-error-dot" title={apiError}>⚠</span>}
          <button className="refresh-btn" onClick={fetchAllData} title="Refresh data" disabled={apiLoading}>↻</button>
          <span className="live-dot">Live</span>
          <span className="time-display">{lastRefresh ? lastRefresh.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="user-name-label" title={currentUser?.email}>{currentUser?.fullName || 'User'}</span>
          <div className="avatar" title="Open profile" onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}>{userInitials}</div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">⏻</button>
        </div>
      </header>
      {activePage === 'live' && renderLiveMap()}
      {activePage === 'analytics' && renderAnalytics()}
      {activePage === 'alerts' && renderAlerts()}
      {activePage === 'reports' && renderReports()}
      {activePage === 'settings' && renderSettings()}
      {showProfile && (
        <ProfilePage
          currentUser={currentUser}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={(data) => {
            setCurrentUser(prev => ({ ...prev, ...data }))
          }}
        />
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="pp-overlay" onClick={() => setShowBroadcastModal(false)} style={{alignItems: 'center', justifyContent: 'center'}}>
          <div className="pp-panel" onClick={e => e.stopPropagation()} style={{height: 'auto', width: '500px', borderRadius: '12px'}}>
            <h2 style={{color: '#e2ecff', marginTop: 0}}>Broadcast Emergency Alert</h2>
            <p style={{color: '#5a7ba6', fontSize: '14px', marginBottom: '20px'}}>This will send a high-priority push notification and SMS to all users in affected regions.</p>
            <label className="pp-edit-label" style={{marginBottom: '12px'}}>Title<input type="text" placeholder="e.g. Critical Flood Warning" /></label>
            <label className="pp-edit-label">Message<textarea placeholder="Evacuate immediately..." style={{minHeight: '80px', width: '100%', background: 'rgba(6,11,24,0.7)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: '10px', color: '#dce8ff', padding: '10px', marginTop: '5px', resize: 'vertical'}}/></label>
            <div style={{display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end'}}>
              <button className="pp-btn pp-btn-ghost" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
              <button className="pp-btn pp-btn-danger" onClick={() => { alert('Alert broadcasted successfully via backend API.'); setShowBroadcastModal(false); }}>Broadcast Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Alert Modal */}
      {showIssueModal && (
        <div className="pp-overlay" onClick={() => setShowIssueModal(false)} style={{alignItems: 'center', justifyContent: 'center'}}>
          <div className="pp-panel" onClick={e => e.stopPropagation()} style={{height: 'auto', width: '500px', borderRadius: '12px'}}>
            <h2 style={{color: '#e2ecff', marginTop: 0}}>Issue New Alert</h2>
            <div className="pp-edit-form">
              <label className="pp-edit-label">Station / Area
                <select>
                  {stations.map(s => <option key={s.id}>{s.name} ({s.id})</option>)}
                </select>
              </label>
              <label className="pp-edit-label">Disaster Type
                <select>
                  <option>Flood</option>
                  <option>Landslide</option>
                </select>
              </label>
              <label className="pp-edit-label">Severity Level
                <select>
                  <option>Danger</option>
                  <option>Warning</option>
                  <option>Caution</option>
                </select>
              </label>
            </div>
            <div style={{display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end'}}>
              <button className="pp-btn pp-btn-ghost" onClick={() => setShowIssueModal(false)}>Cancel</button>
              <button className="pp-btn pp-btn-danger" onClick={() => { alert('Alert issued and saved to database.'); setShowIssueModal(false); }}>Issue Alert</button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="pp-overlay" onClick={() => setShowUserModal(false)} style={{alignItems: 'center', justifyContent: 'center'}}>
          <div className="pp-panel" onClick={e => e.stopPropagation()} style={{height: 'auto', width: '500px', borderRadius: '12px'}}>
            <h2 style={{color: '#e2ecff', marginTop: 0}}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <div className="pp-edit-form">
              <label className="pp-edit-label">Full Name
                <input type="text" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} />
              </label>
              <label className="pp-edit-label">Email
                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </label>
              {!editingUser && (
                <label className="pp-edit-label">Password
                  <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                </label>
              )}
              <label className="pp-edit-label">Role
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="pp-edit-label">District
                <input type="text" value={userForm.district} onChange={e => setUserForm({...userForm, district: e.target.value})} />
              </label>
              <label className="pp-edit-label">Phone Number
                <input type="text" value={userForm.phoneNumber} onChange={e => setUserForm({...userForm, phoneNumber: e.target.value})} />
              </label>
            </div>
            <div style={{display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end'}}>
              <button className="pp-btn pp-btn-ghost" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="pp-btn pp-btn-danger" onClick={handleSaveUser}>{editingUser ? 'Save Changes' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Station Modal */}
      {showStationModal && (
        <div className="pp-overlay" onClick={() => setShowStationModal(false)} style={{alignItems: 'center', justifyContent: 'center'}}>
          <div className="pp-panel" onClick={e => e.stopPropagation()} style={{height: 'auto', width: '500px', borderRadius: '12px'}}>
            <h2 style={{color: '#e2ecff', marginTop: 0}}>Add New Station</h2>
            <div className="pp-edit-form">
              <label className="pp-edit-label">Station Name
                <input type="text" value={stationForm.name} onChange={e => setStationForm({...stationForm, name: e.target.value})} />
              </label>
              <label className="pp-edit-label">District
                <input type="text" value={stationForm.district} onChange={e => setStationForm({...stationForm, district: e.target.value})} />
              </label>
              <label className="pp-edit-label">Location (e.g. Village/Town)
                <input type="text" value={stationForm.location} onChange={e => setStationForm({...stationForm, location: e.target.value})} />
              </label>
              <div style={{display: 'flex', gap: '10px'}}>
                <label className="pp-edit-label" style={{flex: 1}}>Latitude
                  <input type="number" step="0.0001" value={stationForm.latitude} onChange={e => setStationForm({...stationForm, latitude: e.target.value})} />
                </label>
                <label className="pp-edit-label" style={{flex: 1}}>Longitude
                  <input type="number" step="0.0001" value={stationForm.longitude} onChange={e => setStationForm({...stationForm, longitude: e.target.value})} />
                </label>
              </div>
              <label className="pp-edit-label">Station Type
                <select value={stationForm.type} onChange={e => setStationForm({...stationForm, type: e.target.value})}>
                  <option value="FLOOD">FLOOD</option>
                  <option value="LANDSLIDE">LANDSLIDE</option>
                </select>
              </label>
              <label className="pp-edit-label">Initial Status
                <select value={stationForm.status} onChange={e => setStationForm({...stationForm, status: e.target.value})}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="MALFUNCTIONING">MALFUNCTIONING</option>
                </select>
              </label>
            </div>
            <div style={{display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end'}}>
              <button className="pp-btn pp-btn-ghost" onClick={() => setShowStationModal(false)}>Cancel</button>
              <button className="pp-btn pp-btn-danger" onClick={handleSaveStation}>Create Station</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
