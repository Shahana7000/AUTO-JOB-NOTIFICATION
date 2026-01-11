import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Briefcase, Trash2 } from 'lucide-react';

const History = () => {
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/applications');
            setApplications(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this history item?')) {
            try {
                await axios.delete(`http://localhost:5000/api/applications/${id}`);
                setApplications(prev => prev.filter(app => app._id !== id));
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Application History</h1>
                <p style={{ color: 'var(--text-muted)' }}>Tracking all the jobs you've applied to.</p>
            </header>

            <div className="glass-card">
                {applications.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No applications tracked yet.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Job Title</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Company</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Platform</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Status</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Date</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((app) => (
                                <tr key={app._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '16px' }}>{app.jobId?.title || 'N/A'}</td>
                                    <td style={{ padding: '16px' }}>{app.jobId?.company || 'N/A'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '12px' }}>
                                            {app.jobId?.platform || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Briefcase size={14} /> {app.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        {new Date(app.appliedAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <a href={app.jobId?.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                View <ExternalLink size={14} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(app._id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default History;
