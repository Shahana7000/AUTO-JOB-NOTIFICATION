import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Briefcase, FileText, User, Filter, X, Save, Star, Trash2, Bell, ExternalLink, Linkedin, Globe, Zap } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Candidates = () => {
    const [candidates, setCandidates] = useState([]);
    const [requirements, setRequirements] = useState([]);
    const [liveMatches, setLiveMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState('internal'); // 'internal' or 'global'
    const [activeRequirement, setActiveRequirement] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [filters, setFilters] = useState({
        skills: '',
        location: '',
        minExperience: 0
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (searchMode === 'internal') {
            searchCandidates();
        }
        fetchRequirements();

        socket.on('recruiter-match', (data) => {
            setLiveMatches(prev => [data, ...prev].slice(0, 10));
            if (activeRequirement && data.requirementId === activeRequirement._id) {
                setCandidates(prev => [data.candidate, ...prev]);
            }
        });

        return () => socket.off('recruiter-match');
    }, [activeRequirement, searchMode]);

    const fetchRequirements = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/recruiter/requirements');
            setRequirements(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const searchCandidates = async () => {
        setLoading(true);
        setActiveRequirement(null);
        try {
            const endpoint = searchMode === 'internal'
                ? 'http://localhost:5000/api/recruiter/candidates'
                : 'http://localhost:5000/api/recruiter/global-search';

            const res = await axios.get(endpoint, {
                params: filters
            });
            setCandidates(res.data);
        } catch (err) {
            console.error(err);
            setMessage('Discovery failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadRequirementMatches = async (req) => {
        setLoading(true);
        setSearchMode('internal');
        setActiveRequirement(req);
        setFilters({
            skills: req.skills.join(', '),
            location: req.location || '',
            minExperience: req.minExperience || 0
        });
        try {
            const res = await axios.get(`http://localhost:5000/api/recruiter/requirements/${req._id}/matches`);
            setCandidates(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const saveAsRequirement = async () => {
        const title = prompt('Enter a name for this Talent Campaign:');
        if (!title) return;

        try {
            await axios.post('http://localhost:5000/api/recruiter/requirements', {
                title,
                skills: filters.skills ? filters.skills.split(',').map(s => s.trim()) : [],
                location: filters.location,
                minExperience: filters.minExperience,
                recruiterEmail: 'recruiter@example.com'
            });
            setMessage('Campaign Saved!');
            fetchRequirements();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error saving campaign');
        }
    };

    const deleteRequirement = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete campaign?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/recruiter/requirements/${id}`);
            fetchRequirements();
            if (activeRequirement?._id === id) {
                setActiveRequirement(null);
                searchCandidates();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleClear = () => {
        setFilters({ skills: '', location: '', minExperience: 0 });
        setActiveRequirement(null);
        if (searchMode === 'internal') searchCandidates();
        else setCandidates([]);
    };

    return (
        <div className="animate-fade-in">
            {selectedCandidate && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '30px', position: 'relative' }}>
                        <X size={24} style={{ position: 'absolute', right: '20px', top: '20px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelectedCandidate(null)} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={40} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{selectedCandidate.name}</h2>
                                {selectedCandidate.email && <p style={{ color: 'var(--text-muted)' }}>{selectedCandidate.email}</p>}
                                <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>{selectedCandidate.platform || 'Internal'} Talent</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expertise</p>
                                <p style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={16} /> {selectedCandidate.title || 'Professional'}</p>
                            </div>
                            <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Location</p>
                                <p style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> {selectedCandidate.location || (selectedCandidate.jobRequirements?.city || 'Remote')}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Professional Profiles</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedCandidate.link && (
                                    <a href={selectedCandidate.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ExternalLink size={18} /> Visit Profile on {selectedCandidate.platform}</span>
                                        <ExternalLink size={16} />
                                    </a>
                                )}

                                {selectedCandidate.linkedinUrl && (
                                    <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(0, 119, 181, 0.1)', color: '#0077b5', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Linkedin size={18} /> LinkedIn Profile</span>
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            {selectedCandidate.resumeUrl && (
                                <a href={selectedCandidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <FileText size={18} /> Download Resume
                                </a>
                            )}
                            <button className="btn-primary" style={{ flex: 1, background: '#10b981' }} onClick={() => alert('Hiring request sent!')}>Hire Now</button>
                        </div>
                    </div>
                </div>
            )}

            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Global Discovery</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Scan internal database and external professional platforms.</p>
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                    <button
                        onClick={() => { setSearchMode('internal'); handleClear(); }}
                        style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: searchMode === 'internal' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', transition: '0.3s' }}
                    >
                        Talent Pool
                    </button>
                    <button
                        onClick={() => { setSearchMode('global'); handleClear(); }}
                        style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: searchMode === 'global' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', transition: '0.3s' }}
                    >
                        Global Scan
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '30px', alignItems: 'start' }}>
                <div>
                    <div className="glass-card" style={{ marginBottom: '30px', padding: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.6fr auto', gap: '15px', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Target Role / Skills</label>
                                <input type="text" className="glass-card" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', marginTop: '8px' }} placeholder="React, Node.js, Python..." value={filters.skills} onChange={e => setFilters({ ...filters, skills: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Location</label>
                                <input type="text" className="glass-card" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', marginTop: '8px' }} placeholder="City, Country" value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Min Exp</label>
                                <input type="number" className="glass-card" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', marginTop: '8px' }} value={filters.minExperience} onChange={e => setFilters({ ...filters, minExperience: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={searchCandidates} className="btn-primary" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {searchMode === 'global' ? <Zap size={18} /> : <Search size={18} />}
                                    {searchMode === 'global' ? 'Scan' : 'Find'}
                                </button>
                                <button onClick={handleClear} className="glass-card" style={{ padding: '12px' }}><X size={18} /></button>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {searchMode === 'internal' ? (
                                <button onClick={saveAsRequirement} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Save size={16} /> Save Automated Campaign
                                </button>
                            ) : (
                                <p style={{ fontSize: '0.75rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={14} /> <strong>Discovery Tip:</strong> Global scan works best with 1-2 primary skills for broader results.
                                </p>
                            )}
                            {message && <span style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>{message}</span>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {loading && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                                <div className="loader" style={{ marginBottom: '20px' }}></div>
                                <p style={{ color: 'var(--text-muted)' }}>
                                    {searchMode === 'global'
                                        ? 'Scraping LinkedIn, Indeed, and Naukri for matching profiles... This may take a minute.'
                                        : 'Searching internal database...'}
                                </p>
                            </div>
                        )}
                        {!loading && candidates.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <User size={48} style={{ marginBottom: '10px', opacity: 0.3 }} />
                                <p>No matching candidates found.</p>
                                <p style={{ fontSize: '0.875rem', marginTop: '10px' }}>
                                    {searchMode === 'internal'
                                        ? 'Try switching to Global Scan to search the entire web index.'
                                        : 'Try reducing the number of skills or broadening the location.'}
                                </p>
                            </div>
                        )}
                        {!loading && candidates.map((candidate, idx) => (
                            <div key={candidate._id || idx} className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: candidate.platform ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: candidate.platform ? '#10b981' : 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {candidate.platform === 'LinkedIn' ? <Linkedin size={20} color="white" /> : <User size={20} color="white" />}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h3 style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: '700' }}>{candidate.name}</h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.platform || 'Verified User'}</p>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', height: '40px', overflow: 'hidden' }}>
                                    {candidate.title || candidate.skills?.slice(0, 3).join(', ')}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{candidate.location?.split(',')[0] || 'Remote'}</span>
                                    {candidate.experienceYears && <span style={{ color: 'var(--primary)' }}>{candidate.experienceYears} yrs exp</span>}
                                </div>
                                <button onClick={() => setSelectedCandidate(candidate)} className="btn-primary" style={{ marginTop: '10px', fontSize: '0.875rem', background: candidate.platform ? 'transparent' : '', border: candidate.platform ? '1px solid var(--primary)' : '', color: candidate.platform ? 'var(--primary)' : '' }}>
                                    {candidate.platform ? 'View Global Profile' : 'Review for Hire'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Star size={20} color="var(--primary)" /> Campaigns
                        </h2>
                        {requirements.map(req => (
                            <div key={req._id} onClick={() => loadRequirementMatches(req)} style={{ padding: '12px', background: activeRequirement?._id === req._id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)', border: activeRequirement?._id === req._id ? '1px solid var(--primary)' : '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{req.title}</h4>
                                    <X size={14} color="#ef4444" onClick={(e) => deleteRequirement(e, req._id)} />
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.skills.slice(0, 2).join(', ')}... | {req.location || 'Any'}</p>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bell size={20} color="var(--primary)" /> Live Matches
                        </h2>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {liveMatches.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Waiting for matches...</p>}
                            {liveMatches.map((match, i) => (
                                <div key={i} className="animate-fade-in" style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>{match.candidate.name}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>Matched: {match.campaignName}</p>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date().toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Candidates;
