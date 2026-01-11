import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ExternalLink, CheckCircle, Clock, MapPin, Terminal, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io('http://localhost:5000');

const Dashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({ searched: 0, applied: 0 });
    const [logs, setLogs] = useState([]);
    const [isActive, setIsActive] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const logEndRef = useRef(null);

    useEffect(() => {
        fetchJobs();
        fetchStats();
        fetchProfile();

        socket.on('newJob', (job) => {
            setJobs(prev => [job, ...prev]);
        });

        socket.on('log', (log) => {
            setLogs(prev => [...prev.slice(-49), log]);
        });

        return () => {
            socket.off('newJob');
            socket.off('log');
        };
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const fetchProfile = async () => {
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
            setUserEmail(storedEmail);
            try {
                const res = await axios.get(`http://localhost:5000/api/user/profile?email=${storedEmail}`);
                if (res.data) setIsActive(res.data.isActive);
            } catch (err) { console.error(err); }
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/jobs');
            setJobs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/applications?email=${localStorage.getItem('userEmail')}`);
            setStats(prev => ({ ...prev, applied: res.data.length }));
        } catch (err) {
            console.error(err);
        }
    };

    const markApplied = async (jobId) => {
        try {
            await axios.post(`http://localhost:5000/api/jobs/apply/${jobId}`);
            setJobs(prev => prev.filter(job => job._id !== jobId));
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Failed to mark as applied. Please check your connection.');
        }
    };

    const toggleCampaign = async () => {
        if (!userEmail) {
            alert('Please set up your profile first!');
            return;
        }
        try {
            const newState = !isActive;
            await axios.post('http://localhost:5000/api/user/toggle-campaign', { email: userEmail, isActive: newState });
            setIsActive(newState);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Could not update campaign status. Try again later.';
            alert(errorMsg);
        }
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-muted)' }}>Real-time job matches based on your profile.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Matches</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{jobs.length}</h3>
                </div>
                <div className="glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Jobs Applied</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.applied}</h3>
                </div>
                <div className="glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Campaign Control</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: isActive ? '#10b981' : '#ef4444' }}>
                            {isActive ? 'Running' : 'Paused'}
                        </h3>
                        <button
                            onClick={toggleCampaign}
                            className="btn-primary"
                            style={{ padding: '4px 12px', background: isActive ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                        >
                            {isActive ? <Square size={14} /> : <Play size={14} />}
                            {isActive ? 'Stop' : 'Start'}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
                <section style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px' }}>Recent Matches</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <AnimatePresence>
                            {jobs.map((job) => (
                                <motion.div
                                    key={job._id || job.link}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="glass-card"
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h4 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{job.title}</h4>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '12px' }}>
                                                {job.platform}
                                            </span>
                                        </div>
                                        <p style={{ color: '#e2e8f0', marginBottom: '4px' }}>{job.company}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={14} /> {job.location}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} /> {new Date(job.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => markApplied(job._id)}
                                            className="btn-primary"
                                            style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <CheckCircle size={16} /> Mark Applied
                                        </button>
                                        <a
                                            href={job.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary"
                                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            Apply Now <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                <section style={{ width: '350px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Live Logs</h2>
                        <Terminal size={18} color="var(--text-muted)" />
                    </div>
                    <div className="glass-card" style={{ height: '500px', overflowY: 'auto', padding: '15px', background: 'rgba(0,0,0,0.3)', fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Waiting for activity...</p>}
                        {logs.map((log, i) => (
                            <div key={i} style={{ borderLeft: '2px solid var(--primary)', paddingLeft: '8px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <p style={{ marginTop: '2px', lineHeight: '1.4' }}>{log.message}</p>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
