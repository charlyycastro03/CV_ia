"use client";
import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ChevronRight, Briefcase, Zap } from 'lucide-react';
import './dashboard.css';

const mockJobs = [
  { id: 1, title: 'Senior Backend Developer', company: 'Stripe', match: 92, status: 'pending' },
  { id: 2, title: 'Project Manager', company: 'Notion', match: 85, status: 'tailored' },
  { id: 3, title: 'Software Engineer', company: 'Figma', match: 78, status: 'sent' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('vacantes');

  return (
    <div className="dashboard-container">
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
              <button className="btn btn-primary mt-4">Seleccionar Archivo</button>
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
              <button className="btn btn-outline"><Zap size={16}/> Sincronizar Nuevas</button>
            </div>
            
            <div className="jobs-grid">
              {mockJobs.map(job => (
                <div key={job.id} className="job-card glass">
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-company">{job.company}</p>
                    </div>
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
                  </div>
                  
                  <div className="job-actions">
                    {job.status === 'pending' && (
                      <button className="btn btn-outline full-width">
                        Adaptar CV <ChevronRight size={16}/>
                      </button>
                    )}
                    {job.status === 'tailored' && (
                      <button className="btn btn-primary full-width">
                        Revisar y Enviar <ChevronRight size={16}/>
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
          </div>
        )}
      </div>
    </div>
  );
}
