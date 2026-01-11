import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Zap, Shield, Search, ArrowRight } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const features = [
        { icon: <Zap size={24} />, title: "Real-time Matching", desc: "Instant notifications when a job matches your profile." },
        { icon: <Search size={24} />, title: "Global Discovery", desc: "Scan LinkedIn, Indeed, and Naukri with CV Intelligence." },
        { icon: <Shield size={24} />, title: "Automated Apply", desc: "Set your preferences and let JobBot handle the busy work." }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e1b4b, #000000)',
            color: 'white',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px'
        }}>
            {/* Nav */}
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                    width: '100%',
                    maxWidth: '1200px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 0'
                }}
            >
                <div style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    JobBot AI
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    Launch App
                </button>
            </motion.nav>

            {/* Hero */}
            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                    marginTop: '80px',
                    textAlign: 'center',
                    maxWidth: '800px',
                    zIndex: 1
                }}
            >
                <motion.div variants={itemVariants} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    fontSize: '0.875rem',
                    marginBottom: '24px'
                }}>
                    <Zap size={14} /> Next Gen Job Automation
                </motion.div>

                <motion.h1 variants={itemVariants} style={{
                    fontSize: '4.5rem',
                    fontWeight: '900',
                    lineHeight: '1.1',
                    marginBottom: '24px',
                    letterSpacing: '-2px'
                }}>
                    Apply to your <br />
                    <span style={{ color: '#818cf8' }}>Dream Job</span> while <br />
                    you sleep.
                </motion.h1>

                <motion.p variants={itemVariants} style={{
                    fontSize: '1.25rem',
                    color: '#94a3b8',
                    marginBottom: '40px',
                    maxWidth: '600px',
                    margin: '0 auto 40px auto'
                }}>
                    The first fully automated job search assistant that uses AI to parse your CV and find perfect matches across all platforms.
                </motion.p>

                <motion.div variants={itemVariants}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: '#6366f1',
                            color: 'white',
                            padding: '18px 36px',
                            borderRadius: '30px',
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)'
                        }}
                    >
                        Get Started Free <ArrowRight size={20} />
                    </button>
                </motion.div>

                {/* Features */}
                <motion.div
                    variants={itemVariants}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '30px',
                        marginTop: '100px'
                    }}
                >
                    {features.map((f, i) => (
                        <div key={i} className="glass-card" style={{ padding: '30px', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ color: '#818cf8', marginBottom: '16px' }}>{f.icon}</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{f.desc}</p>
                        </div>
                    ))}
                </motion.div>
            </motion.main>

            {/* Decorative elements */}
            <div style={{
                position: 'fixed',
                top: '20%',
                left: '-10%',
                width: '400px',
                height: '400px',
                background: '#6366f1',
                filter: 'blur(150px)',
                opacity: 0.15,
                borderRadius: '50%',
                zIndex: 0
            }} />
            <div style={{
                position: 'fixed',
                bottom: '10%',
                right: '-5%',
                width: '300px',
                height: '300px',
                background: '#a855f7',
                filter: 'blur(150px)',
                opacity: 0.1,
                borderRadius: '50%',
                zIndex: 0
            }} />
        </div>
    );
};

export default Landing;
