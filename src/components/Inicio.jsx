import { useState } from 'react'
import { leerPadron } from '../services/google'

export default function Inicio({ token, socios, setSocios, onIniciar }) {
  const [spreadsheetId, setSpreadsheetId] = useState(
    localStorage.getItem('spreadsheetId') || ''
  )
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function cargarPadron() {
    if (!spreadsheetId.trim()) {
      setError('Ingresá el ID del Google Sheet')
      return
    }
    setCargando(true)
    setError('')
    try {
      const datos = await leerPadron(token, spreadsheetId.trim())
      if (datos.length === 0) {
        setError('No se encontraron socios. Verificá que la hoja se llame "Padron" y tenga datos desde la fila 2.')
        setCargando(false)
        return
      }
      localStorage.setItem('spreadsheetId', spreadsheetId.trim())
      setSocios(datos)
    } catch (e) {
      setError('Error al leer el Sheet. Verificá el ID y los permisos.')
    }
    setCargando(false)
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 4 }}>
          Lectura de Medidores
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          Configuración de la recorrida
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: 6 }}>
          ID del Google Sheet con el padrón
        </label>
        <input
          type="text"
          value={spreadsheetId}
          onChange={e => setSpreadsheetId(e.target.value)}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '0.85rem',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: 6 }}>
          Es la parte larga de la URL del Sheet: docs.google.com/spreadsheets/d/<strong>ESTE_VALOR</strong>/edit
        </p>
      </div>

      {error && (
        <div style={{
          background: '#fff3f3', border: '1px solid #ffcdd2',
          borderRadius: 8, padding: '10px 14px',
          fontSize: '0.85rem', color: '#c62828', marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {socios.length > 0 && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 8, padding: '10px 14px',
          fontSize: '0.85rem', color: '#166534', marginBottom: '1rem'
        }}>
          ✓ {socios.length} socios cargados
        </div>
      )}

      <button
        onClick={cargarPadron}
        disabled={cargando}
        style={{
          width: '100%', padding: '12px',
          background: '#1D9E75', color: '#fff',
          border: 'none', borderRadius: 8,
          fontSize: '0.95rem', fontWeight: 500,
          cursor: cargando ? 'not-allowed' : 'pointer',
          marginBottom: 12,
          opacity: cargando ? 0.7 : 1,
        }}
      >
        {cargando ? 'Cargando padrón...' : 'Cargar padrón desde Sheet'}
      </button>

      <button
        onClick={onIniciar}
        disabled={socios.length === 0}
        style={{
          width: '100%', padding: '12px',
          background: socios.length === 0 ? '#f5f5f5' : '#fff',
          color: socios.length === 0 ? '#aaa' : '#333',
          border: '1px solid #ddd', borderRadius: 8,
          fontSize: '0.95rem', fontWeight: 500,
          cursor: socios.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        Iniciar recorrida →
      </button>
    </div>
  )
}