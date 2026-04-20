import React, { useState } from 'react';
import { casesAPI } from '../services/api';
import './HackTerminal.css';

const HackTerminal = ({ system, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  const addOutput = (text, type = 'normal') => {
    setOutput((prev) => [...prev, { text, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleHack = async (e) => {
    e.preventDefault();
    setLoading(true);

    addOutput(`Connecting to ${system.host}:${system.port}...`, 'info');
    addOutput(`Attempting login as ${username}...`, 'info');

    // Simüle edilmiş gecikme
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const response = await casesAPI.hackSystem({
        systemId: system.id,
        username,
        password,
      });

      if (response.data.success) {
        addOutput('✓ Authentication successful!', 'success');
        addOutput('✓ Access granted!', 'success');
        addOutput('Downloading data...', 'info');
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        addOutput('✓ Data retrieved successfully!', 'success');
        
        if (response.data.rewardData) {
          addOutput('--- Retrieved Data ---', 'info');
          addOutput(JSON.stringify(response.data.rewardData, null, 2), 'data');
        }

        if (response.data.newClues && response.data.newClues.length > 0) {
          addOutput(`\n🔍 ${response.data.newClues.length} yeni ipucu bulundu!`, 'success');
          response.data.newClues.forEach((clue) => {
            addOutput(`- ${clue.title}`, 'success');
          });
        }

        setTimeout(() => {
          onSuccess(response.data.newClues);
          onClose();
        }, 3000);
      } else {
        addOutput('✗ Authentication failed!', 'error');
        addOutput(response.data.message, 'error');
      }
    } catch (err) {
      addOutput('✗ Connection error!', 'error');
      addOutput(err.response?.data?.message || 'Bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-overlay" onClick={onClose}>
      <div className="terminal-window" onClick={(e) => e.stopPropagation()}>
        <div className="terminal-header">
          <div className="terminal-title">
            🖥️ {system.name} - {system.type}
          </div>
          <button className="terminal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="terminal-body">
          <div className="terminal-info">
            <div>Host: {system.host}</div>
            <div>Port: {system.port}</div>
            <div>Type: {system.type}</div>
          </div>

          <div className="terminal-output">
            {output.map((line, index) => (
              <div key={index} className={`output-line output-${line.type}`}>
                <span className="output-timestamp">[{line.timestamp}]</span> {line.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleHack} className="terminal-input-form">
            <div className="input-group">
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="input-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={loading}
              />
            </div>
            <div className="terminal-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Connecting...' : 'Connect'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HackTerminal;
