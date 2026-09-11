import { useState, useEffect } from 'react';
import { satopsApi } from '../services/api';
import { Plus, Power, Trash2 } from 'lucide-react';

export default function SatopsPage() {
    const [passes, setPasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoStart, setAutoStart] = useState(false);

    useEffect(() => {
        fetchPasses();
    }, []);

    const fetchPasses = async () => {
        try {
            setLoading(true);
            const res = await satopsApi.get('/SatellitePass/getallpasses');
            if (res.data) setPasses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAutoStart = async () => {
        try {
            await satopsApi.put(`/SatellitePass/autostartorstop?status=${!autoStart}`);
            setAutoStart(!autoStart);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Satellite Operations</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn" onClick={toggleAutoStart} style={{ background: autoStart ? 'var(--success)' : '#15171c', border: '1px solid var(--panel-border)' }}>
                        <Power size={16} /> Auto Start/Stop
                    </button>
                    <button className="btn btn-primary"><Plus size={16} /> Add Pass</button>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <p>Loading bypasses...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--panel-border)' }}>
                                <th style={{ padding: 12 }}>Satellite ID</th>
                                <th style={{ padding: 12 }}>AOS (Acquisition)</th>
                                <th style={{ padding: 12 }}>LOS (Loss of Signal)</th>
                                <th style={{ padding: 12 }}>Status</th>
                                <th style={{ padding: 12 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passes.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 12, textAlign: 'center' }}>No satellite passes found</td></tr>
                            ) : (
                                passes.map(sp => (
                                    <tr key={sp.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                        <td style={{ padding: 12 }}>{sp.satelliteId}</td>
                                        <td style={{ padding: 12 }}>{new Date(sp.aos).toLocaleString()}</td>
                                        <td style={{ padding: 12 }}>{new Date(sp.los).toLocaleString()}</td>
                                        <td style={{ padding: 12 }}>{sp.status || 'Pending'}</td>
                                        <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                                            <button className="btn" style={{ padding: '6px', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
