import { useState, useEffect } from 'react';
import { ruleApi } from '../services/api';
import { Plus, Play, Square, Trash2 } from 'lucide-react';

export default function RulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await ruleApi.get('/CronPolicy/getall');
            if (res.data) setRules(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Cron Rules</h1>
                <button className="btn btn-primary"><Plus size={16} /> New Rule</button>
            </div>

            <div className="card">
                {loading ? (
                    <p>Loading rules...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--panel-border)' }}>
                                <th style={{ padding: 12 }}>Rule Name</th>
                                <th style={{ padding: 12 }}>Expression</th>
                                <th style={{ padding: 12 }}>Target</th>
                                <th style={{ padding: 12 }}>State</th>
                                <th style={{ padding: 12 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 12, textAlign: 'center' }}>No rules found</td></tr>
                            ) : (
                                rules.map(rule => (
                                    <tr key={rule.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                        <td style={{ padding: 12 }}>{rule.name}</td>
                                        <td style={{ padding: 12 }}>{rule.cronExpression}</td>
                                        <td style={{ padding: 12 }}>{rule.targetType}</td>
                                        <td style={{ padding: 12 }}>{rule.isActive ? 'Running' : 'Stopped'}</td>
                                        <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                                            <button className="btn" style={{ padding: '6px' }}>
                                                {rule.isActive ? <Square size={16} color="var(--danger)" /> : <Play size={16} color="var(--success)" />}
                                            </button>
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
