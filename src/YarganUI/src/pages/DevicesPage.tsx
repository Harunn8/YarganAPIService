import { useState, useEffect } from 'react';
import { deviceApi } from '../services/api';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function DevicesPage() {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const res = await deviceApi.get('/Device/GetAllDevice');
            if (res.data) setDevices(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Devices & PAGs</h1>
                <button className="btn btn-primary"><Plus size={16} /> Add Device</button>
            </div>

            <div className="card">
                {loading ? (
                    <p>Loading devices...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--panel-border)' }}>
                                <th style={{ padding: 12 }}>Name</th>
                                <th style={{ padding: 12 }}>IP Address</th>
                                <th style={{ padding: 12 }}>Type</th>
                                <th style={{ padding: 12 }}>Status</th>
                                <th style={{ padding: 12 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 12, textAlign: 'center' }}>No devices found</td></tr>
                            ) : (
                                devices.map(device => (
                                    <tr key={device.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                        <td style={{ padding: 12 }}>{device.name}</td>
                                        <td style={{ padding: 12 }}>{device.ipAddress}</td>
                                        <td style={{ padding: 12 }}>{device.type || 'Unknown'}</td>
                                        <td style={{ padding: 12 }}>
                                            <span style={{ color: device.isActive ? 'var(--success)' : 'var(--danger)' }}>
                                                {device.isActive ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                                            <button className="btn" style={{ padding: '6px' }}><Edit size={16} /></button>
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
