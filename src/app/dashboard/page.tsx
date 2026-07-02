"use client";
import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, ChevronRight, Briefcase, Zap, Loader2, AlertCircle } from 'lucide-react';
import './dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('vacantes');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/matches/list");
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      showNotification("Error al cargar vacantes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSync = async () => {
    setActionLoading('sync');
    try {
      const res = await fetch("/api/jobs/sync");
      const data = await res.json();
      showNotification(`Sincronización completa. Nuevas: ${data.inserted || 0}`, "success");
      fetchJobs();
    } catch (error) {
      showNotification("Error al sincronizar vacantes", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCalculateMatch = async (jobId: string) => {
    setActionLoading(`match-${jobId}`);
    try {
      await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      showNotification("Compatibilidad calculada", "success");
      fetchJobs();
    } catch (error) {
      showNotification("Error al calcular compatibilidad", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTailorCV = async (jobId: string) => {
    setActionLoading(`tailor-${jobId}`);
    try {
      await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      showNotification("CV Adaptado exitosamente", "success");
      fetchJobs();
    } catch (error) {
      showNotification("Error al adaptar el CV", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApply = async (matchId: string) => {
    setActionLoading(`apply-${matchId}`);
    try {
      await fetch("/api/apply/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, sendByEmail: false })
      });
      showNotification("Aplicación preparada y marcada como enviada", "success");
      fetchJobs();
    } catch (error) {
      showNotification("Error al aplicar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setActionLoading('upload');
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/cv/parse", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Fallo la subida");
      showNotification("CV subido y parseado correctamente", "success");
    } catch (error) {
      showNotification("Error al subir el CV", "error");
    } finally {
      setActionLoading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="dashboard-container relative pb-16">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification glass animate-fade-in ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <header className="dashboard-header glass">
        <div>
          <h1 className="text-gradient">CV Intelligence</h1>
          <p>Bienvenido de vuelta, Carlos.</p>
        </div>
        <nav className="header-nav">
          <button 
            className={`nav-btn ${activeTab === 'vacantes' ? 'active' : ''}`}
            onClick={() => setActiveTab('vacantes')}
          >
            <Briefcase size={18} /> Vacantes
          </button>
          <button 
            className={`nav-btn ${activeTab === 'cv' ? 'active' : ''}`}
            onClick={() => setActiveTab('cv')}
          >
            <FileText size={18} /> Mi CV
          </button>
        </nav>
      </header>

      <div className="dashboard-content">
        {activeTab === 'cv' && (
          <div className="upload-section glass animate-fade-in">
            <div className="upload-box">
              <UploadCloud size={48} className="upload-icon" />
              <h3>Sube tu CV base</h3>
              <p>Arrastra tu PDF aquí o haz clic para explorar.</p>
              
              <input 
                type="file" 
                accept="application/pdf"
                ref={fileInputRef} 
                className="hidden-input" 
                onChange={handleFileChange}
                disabled={actionLoading === 'upload'}
              />
              
              <button 
                className="btn btn-primary mt-4" 
                onClick={() => fileInputRef.current?.click()}
                disabled={actionLoading === 'upload'}
              >
                {actionLoading === 'upload' ? <><Loader2 className="spin" size={16}/> Procesando (IA)...</> : 'Seleccionar Archivo'}
              </button>
            </div>
            <div className="upload-info">
              <h4>¿Cómo funciona?</h4>
              <p>Extraeremos tu información usando Gemini. No inventamos datos, solo organizamos tus logros para vencer a los ATS.</p>
            </div>
          </div>
        )}

        {activeTab === 'vacantes' && (
          <div className="jobs-section animate-fade-in">
            <div className="jobs-header">
              <h2>Vacantes Compatibles</h2>
              <button 
                className="btn btn-outline" 
                onClick={handleSync}
                disabled={actionLoading === 'sync'}
              >
                {actionLoading === 'sync' ? <><Loader2 className="spin" size={16}/> Sincronizando...</> : <><Zap size={16}/> Sincronizar Nuevas</>}
              </button>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <Loader2 className="spin text-accent" size={40} />
                <p>Cargando vacantes...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="empty-state glass">
                <p>No tienes vacantes sincronizadas todavía. Pulsa &quot;Sincronizar Nuevas&quot; para empezar.</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {jobs.map(job => (
                  <div key={job.id} className="job-card glass">
                    <div className="job-card-header">
                      <div>
                        <h3 className="job-title">{job.title}</h3>
                        <p className="job-company">{job.company}</p>
                      </div>
                      
                      {job.status !== 'new' && (
                        <div className="match-score">
                          <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="circle"
                              strokeDasharray={`${job.match}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="20.35" className="percentage">{job.match}%</text>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="job-actions">
                      {job.status === 'new' && (
                        <button 
                          className="btn btn-outline full-width"
                          onClick={() => handleCalculateMatch(job.id)}
                          disabled={actionLoading === `match-${job.id}`}
                        >
                          {actionLoading === `match-${job.id}` ? <><Loader2 className="spin" size={16}/> Calculando...</> : 'Calcular Match'}
                        </button>
                      )}
                      {job.status === 'pending' && (
                        <button 
                          className="btn btn-outline full-width"
                          onClick={() => handleTailorCV(job.id)}
                          disabled={actionLoading === `tailor-${job.id}`}
                        >
                          {actionLoading === `tailor-${job.id}` ? <><Loader2 className="spin" size={16}/> Adaptando CV...</> : <><Zap size={16}/> Adaptar CV</>}
                        </button>
                      )}
                      {job.status === 'tailored' && (
                        <button 
                          className="btn btn-primary full-width"
                          onClick={() => handleApply(job.matchId)}
                          disabled={actionLoading === `apply-${job.matchId}`}
                        >
                          {actionLoading === `apply-${job.matchId}` ? <><Loader2 className="spin" size={16}/> Procesando...</> : <><ChevronRight size={16}/> Revisar y Enviar</>}
                        </button>
                      )}
                      {job.status === 'sent' && (
                        <div className="status-sent">
                          <CheckCircle size={18} color="var(--success)"/> Aplicación Enviada
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
