import { Outlet, NavLink } from 'react-router-dom';
import { Activity, Radio, Target, Gauge, Satellite } from 'lucide-react';

export default function Layout() {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Activity color="#3b82f6" />
                    <h1>YarganUI</h1>
                </div>
                <nav className="nav-links">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Gauge size={20} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/devices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Radio size={20} />
                        Devices & PAGs
                    </NavLink>
                    <NavLink to="/rules" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Target size={20} />
                        Cron Rules
                    </NavLink>
                    <NavLink to="/satops" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Satellite size={20} />
                        Satellite Ops
                    </NavLink>
                </nav>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
