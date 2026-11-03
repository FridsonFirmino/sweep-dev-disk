function App() {
  return (
    <main className="welcome-card">
      <div className="brand-mark" aria-hidden="true">
        S
      </div>
      <p className="eyebrow">DESKTOP DEVELOPMENT FOUNDATION</p>
      <h1>SweepDevDisk</h1>
      <p className="intro">A local-first workspace for understanding development disk usage.</p>
      <div className="status">
        <span className="status-dot" /> Development environment ready
      </div>
      <p className="note">Project scanning and cleanup are not available yet.</p>
    </main>
  );
}

export default App;
