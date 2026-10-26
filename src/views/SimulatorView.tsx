import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/client';

interface SimulatorViewProps {
  onNavigateToQueue: () => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onNavigateToQueue }) => {
  const [mode, setMode] = useState<'burst' | 'idempotency_flood'>('burst');
  const [concurrency, setConcurrency] = useState(5);
  const [numRequests, setNumRequests] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [testStats, setTestStats] = useState<{
    casesCreated: number;
    duplicatesDetected: number;
    errors: number;
    totalTime: number;
    passed?: boolean;
  } | null>(null);

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setLogs([]);
    setTestStats(null);

    appendLog(`Starting ${mode.toUpperCase()} simulation with concurrency limit: ${concurrency}`);

    const startTime = performance.now();
    let created = 0;
    let duplicates = 0;
    let errors = 0;

    const sharedIdempotencyKey = `flood_${Date.now()}`;

    const tasks = Array.from({ length: numRequests }, (_, i) => {
      const key = mode === 'idempotency_flood' ? sharedIdempotencyKey : `sim_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      const payload = {
        trigger_type: i % 2 === 0 ? 'TRANSACTION_INVESTIGATION' : 'MERCHANT_DISPUTE_SPIKE',
        trigger_source: 'EXTERNAL_TRIGGER_MICROSERVICE',
        trigger_reason: `High-concurrency stress test payload (Thread Worker ${i + 1} of ${numRequests})`,
        priority: i % 4 === 0 ? 'CRITICAL' : 'HIGH',
        idempotency_key: key,
        transaction_id: `TXN_SIM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        user_id: `USR_SIM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        merchant_id: `MCH_SIM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };

      return async () => {
        try {
          const res = await apiClient.triggerInvestigation(payload);
          if (res.is_duplicate) {
            duplicates++;
            appendLog(`Worker ${i + 1}: Received duplicate response (Case: ${res.case_id})`);
          } else {
            created++;
            appendLog(`Worker ${i + 1}: Successfully created Case ${res.case_id} [Status: ${res.status}]`);
          }
        } catch (err: any) {
          errors++;
          appendLog(`Worker ${i + 1} ERROR: ${err.message}`);
        }
      };
    });

    const pool = async () => {
      const executing: Promise<void>[] = [];
      for (const task of tasks) {
        const p = task().then(() => {
          executing.splice(executing.indexOf(p), 1);
        });
        executing.push(p);
        if (executing.length >= concurrency) {
          await Promise.race(executing);
        }
      }
      await Promise.all(executing);
    };

    try {
      await pool();
    } catch (err: any) {
      appendLog(`Simulation execution encountered unexpected error: ${err.message}`);
    }

    const duration = (performance.now() - startTime) / 1000;
    const isPass = mode === 'idempotency_flood' ? created === 1 : errors === 0;

    setTestStats({
      casesCreated: created,
      duplicatesDetected: duplicates,
      errors,
      totalTime: duration,
      passed: isPass,
    });

    appendLog(`Simulation finished in ${duration.toFixed(2)}s. Results: Created=${created}, Duplicates=${duplicates}, Errors=${errors}`);
    setIsRunning(false);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }} className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          External Trigger Microservice · Concurrency Test Console
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
          Simulates high-velocity external triggers fired from multiple concurrent threads to stress-test Agent idempotency and race condition immunity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        <Card title="Test Configuration">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                Test Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMode('burst')}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: mode === 'burst' ? 'var(--color-input-background)' : 'var(--color-surface)',
                    border: mode === 'burst' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    color: mode === 'burst' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Parallel Burst Ingestion
                </button>
                <button
                  type="button"
                  onClick={() => setMode('idempotency_flood')}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: mode === 'idempotency_flood' ? 'var(--color-input-background)' : 'var(--color-surface)',
                    border: mode === 'idempotency_flood' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    color: mode === 'idempotency_flood' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Idempotency Collision Flood
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                Concurrency Pool (Parallel Workers): {concurrency}
              </label>
              <input
                type="range"
                min={2}
                max={20}
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                Total Trigger Requests: {numRequests}
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={numRequests}
                onChange={(e) => setNumRequests(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <Button
              onClick={runSimulation}
              disabled={isRunning}
              icon={<Play size={16} />}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isRunning ? 'Firing Concurrent Signals...' : `Execute ${mode.toUpperCase()} Test`}
            </Button>
          </div>
        </Card>

        <Card title="Concurrency Execution Diagnostics">
          {testStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: testStats.passed ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${testStats.passed ? '#16A34A' : '#DC2626'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: testStats.passed ? '#16A34A' : '#DC2626' }}>
                  {testStats.passed ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                  {testStats.passed ? 'CONCURRENCY INTEGRITY VERIFIED' : 'TEST CRITERIA FAILED'}
                </div>
                <Badge type={testStats.passed ? 'READY' : 'FAILED'}>{testStats.passed ? 'PASS' : 'FAIL'}</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-input-background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block' }}>Cases Created</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{testStats.casesCreated}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-input-background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block' }}>Duplicates Trapped</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>{testStats.duplicatesDetected}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-input-background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block' }}>Network Errors</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: testStats.errors > 0 ? '#DC2626' : 'var(--color-text-primary)' }}>{testStats.errors}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-input-background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block' }}>Total Duration</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{testStats.totalTime.toFixed(2)}s</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={onNavigateToQueue}>
                Inspect Generated Cases in Queue →
              </Button>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
              Select a test mode and click Execute to start multi-threaded load injection against the Agent intake pipeline.
            </p>
          )}
        </Card>
      </div>

      <Card title="Live Thread Ingestion Logs" style={{ marginTop: '24px' }}>
        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-input-background)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: 'var(--color-placeholder)' }}>Simulation logs will appear here during execution...</span>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ color: log.includes('ERROR') ? '#DC2626' : 'var(--color-text-primary)' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
