export default function Dashboard() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>
            <div className="grid-3">
                <div className="card">
                    <h3>System Status</h3>
                    <p style={{ marginTop: 10, color: 'var(--success)' }}>All systems operational.</p>
                </div>
                <div className="card">
                    <h3>Active Cron Jobs</h3>
                    <p style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>5</p>
                </div>
                <div className="card">
                    <h3>Tracked Satellites</h3>
                    <p style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>12</p>
                </div>
            </div>
        </div>
    );
}
