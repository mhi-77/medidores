import { useState } from 'react'
import { escribirLecturas } from '../services/google'

export default function Lista({ token, socios, lecturas, setLecturas, onVolver }) {
  const [sincronizando, setSincronizando] = useState(false)
  const [resultado, setResultado] = useState('')
  const [error, setError] = useState('')

  const spreadsheetId = localStorage.getItem('spreadsheetId') || ''
  const pendientes = socios.length - lecturas.length

  async function sincronizar() {
    if (lecturas.length === 0) { alert('No hay lecturas para sincronizar.'); return }
    if (!spreadsheetId) { alert('No se encontró el ID del Sheet.'); return }
    setSincronizando(true)
    setResultado('')
    setError('')
    try {
      const hoja = await escribirLecturas(token, spreadsheetId, lecturas)
      setResultado(`✓ Datos guardados en la hoja "${hoja}"`)
    } catch (err) {
      setError('Error al sincronizar. Verificá tu conexión e intentá de nuevo.')
    }
    setSincronizando(false)
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 480, margin: '0 auto' }}>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: '1.25rem'
      }}>
        <button
          onClick={onVolver}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', color: '#333', padding: 0, lineHeight: 1
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Lecturas registradas</h2>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <div style={{
          flex: 1, background: '#f8f8f8', borderRadius: 8,
          padding: '12px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{lecturas.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>capturadas</div>
        </div>
        <div style={{
          flex: 1, background: '#f8f8f8', borderRadius: 8,
          padding: '12px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: pendientes > 0 ? '#854d0e' : '#166534' }}>
            {pendientes}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>pendientes</div>
        </div>
      </div>

      <button
        onClick={sincronizar}
        disabled={sincronizando || lecturas.length === 0}
        style={{
          width: '100%', padding: '12px',
          background: sincronizando || lecturas.length === 0 ? '#ccc' : '#1D9E75',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: '0.95rem', fontWeight: 500,
          cursor: sincronizando || lecturas.length === 0 ? 'not-allowed' : 'pointer',
          marginBottom: 8,
        }}
      >
        {sincronizando ? 'Sincronizando con Google Sheets...' : '☁ Sincronizar con Google Sheets'}
      </button>

      {resultado && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 8, padding: '10px 14px',
          fontSize: '0.85rem', color: '#166534', marginBottom: 8
        }}>
          {resultado}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fff3f3', border: '1px solid #ffcdd2',
          borderRadius: 8, padding: '10px 14px',
          fontSize: '0.85rem', color: '#c62828', marginBottom: 8
        }}>
          {error}
        </div>
      )}

      <button
        onClick={onVolver}
        style={{
          width: '100%', padding: '11px',
          border: '1px solid #ddd', borderRadius: 8,
          background: '#fff', color: '#333',
          fontSize: '0.9rem', cursor: 'pointer',
          marginBottom: '1.5rem',
        }}
      >
        + Continuar capturando
      </button>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        {lecturas.length === 0
          ? (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
              Sin lecturas aún
            </p>
          )
          : lecturas.map(l => (
            <div key={l.id} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '10px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {l.id} · {l.nombre}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                  {l.ubicacion} · {l.fecha}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                  Anterior: {l.anterior || '—'}
                  {l.fotoUrl && (
                    <a
                      href={l.fotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ marginLeft: 8, color: '#1D9E75' }}
                    >
                      ver foto
                    </a>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {String(l.actual).padStart(5, '0')}
                </div>
                {l.actual > l.anterior && (
                  <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                    +{l.actual - l.anterior} kWh
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}