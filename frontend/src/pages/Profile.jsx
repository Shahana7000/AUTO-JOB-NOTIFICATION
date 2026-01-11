import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, X, Upload, FileText, Edit2, Trash2, UserPlus } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        skills: [],
        locations: [],
        country: '',
        state: '',
        city: '',
        remote: false,
        resumeUrl: '',
        linkedinUrl: '',
        indeedUrl: '',
        naukriUrl: ''
    });
    const [profiles, setProfiles] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setProfiles(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setProfile({
            name: '',
            email: '',
            skills: [],
            locations: [],
            country: '',
            state: '',
            city: '',
            remote: false,
            resumeUrl: ''
        });
    };

    const editProfile = (p) => {
        setProfile({
            name: p.name,
            email: p.email,
            skills: p.skills || [],
            locations: p.jobRequirements?.locations || [],
            country: p.jobRequirements?.country || '',
            state: p.jobRequirements?.state || '',
            city: p.jobRequirements?.city || '',
            remote: p.jobRequirements?.remote || false,
            resumeUrl: p.resumeUrl || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteProfile = async (email) => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            try {
                await axios.delete(`http://localhost:5000/api/users/${email}`);
                setProfiles(prev => prev.filter(p => p.email !== email));
                if (profile.email === email) {
                    localStorage.removeItem('userEmail');
                    resetForm();
                }
                setMessage('Campaign deleted successfully');
                setTimeout(() => setMessage(''), 3000);
            } catch (err) {
                console.error(err);
                alert('Failed to delete campaign.');
            }
        }
    };

    const saveProfile = async () => {
        if (!profile.name || !profile.email) {
            alert('Please provide both a Campaign Name and a Unique Email ID.');
            return;
        }
        if (profile.skills.length === 0) {
            alert('Please add at least one skill to your campaign.');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/user/profile', profile);
            localStorage.setItem('userEmail', profile.email);
            setMessage('Profile saved successfully!');
            fetchProfiles();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Error saving profile';
            alert(errorMsg);
        }
    };

    const addSkill = () => {
        if (skillInput && !profile.skills.includes(skillInput)) {
            setProfile({ ...profile, skills: [...profile.skills, skillInput] });
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('resume', file);

        setUploading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile({ ...profile, resumeUrl: res.data.url });
            setMessage('Resume uploaded successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error uploading resume');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Campaign Manager</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your job search details and campaigns.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
                <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{profile.email ? 'Edit Campaign' : 'New Campaign'}</h2>
                        {profile.email && (
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <UserPlus size={16} /> Create New
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Campaign Name</label>
                            <input
                                type="text"
                                className="glass-card"
                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)' }}
                                value={profile.name}
                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                placeholder="e.g. Frontend Roles"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email (Unique ID)</label>
                            <input
                                type="email"
                                className="glass-card"
                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)' }}
                                value={profile.email}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Resume (PDF/Doc)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--glass-border)' }}>
                                <Upload size={18} /> {uploading ? 'Uploading...' : 'Choose File'}
                                <input type="file" hidden onChange={handleResumeUpload} accept=".pdf,.doc,.docx" />
                            </label>
                            {profile.resumeUrl && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                                    <FileText size={18} />
                                    <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontSize: '0.875rem' }}>View Resume</a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Skills</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                            <input
                                type="text"
                                className="glass-card"
                                style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.2)' }}
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                placeholder="Add skill..."
                                onKeyPress={e => e.key === 'Enter' && addSkill()}
                            />
                            <button onClick={addSkill} className="btn-primary" style={{ padding: '8px 16px' }}>Add</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {profile.skills.map(skill => (
                                <span key={skill} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'var(--primary)', borderRadius: '20px', fontSize: '0.875rem' }}>
                                    {skill}
                                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeSkill(skill)} />
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <input type="text" className="glass-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }} value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} placeholder="Country" />
                        <input type="text" className="glass-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }} value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} placeholder="State" />
                        <input type="text" className="glass-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }} value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} placeholder="City" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>Verification Links</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <input type="url" className="glass-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }} value={profile.linkedinUrl || ''} onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })} placeholder="LinkedIn Profile URL" />
                            <input type="url" className="glass-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }} value={profile.naukriUrl || ''} onChange={e => setProfile({ ...profile, naukriUrl: e.target.value })} placeholder="Naukri Profile URL" />
                            <input type="url" className="glass-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', gridColumn: '1 / -1' }} value={profile.indeedUrl || ''} onChange={e => setProfile({ ...profile, indeedUrl: e.target.value })} placeholder="Indeed Profile URL" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        {message && <span style={{ color: '#10b981', fontSize: '0.875rem' }}>{message}</span>}
                        <button onClick={saveProfile} className="btn-primary" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Save size={18} /> {profile.email ? 'Update Campaign' : 'Save Campaign'}
                        </button>
                    </div>
                </section>

                <section className="glass-card" style={{ maxHeight: '800px', overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px' }}>Saved Campaigns</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {profiles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No campaigns found.</p>}
                        {profiles.map(p => (
                            <div key={p._id} className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: '600' }}>{p.name}</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px' }}>
                                        {p.jobRequirements?.city || 'Any City'}, {p.jobRequirements?.country || 'Any Country'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => editProfile(p)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => deleteProfile(p.email)} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Profile;
