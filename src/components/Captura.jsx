import { useState, useRef } from 'react'
import { buscarOCrearCarpeta, subirFoto } from '../services/google'
import { buscarOCrearCarpeta, subirFoto, leerMedidorConVision } from '../services/google'

export default function Captura({
  token, socios, lecturas, setLecturas,
  socioActual, setSocioActual, onVerLista
}) {
  const [imagen, setImagen] = useState(null)
  const [imagenFile, setImagenFile] = useState(null)
  const [ocrValor, setOcrValor] = useState('')
  const [ocrConfianza, setOcrConfianza] = useState(null)
  const [ocrEstado, setOcrEstado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const fotoInputRef = useRef()

  const sociosDisponibles = socios.filter(
    s => !lecturas.find(l => l.id === s.id)
  )

  function selectSocio(id) {
    const s = socios.find(s => s.id === id) || null
    setSocioActual(s)
    resetFoto()
  }

  function resetFoto() {
    setImagen(null)
    setImagenFile(null)
    setOcrValor('')
    setOcrConfianza(null)
    setOcrEstado('')
  }

  async function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setImagenFile(file)
    const url = URL.createObjectURL(file)
    setImagen(url)
    await runOCR(url)
  }

async function imageToBase64(url) {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.readAsDataURL(blob)
    })
  }

  async function runOCR(url) {
    setProcesando(true)
    setOcrEstado('Procesando imagen con Google Vision...')
    setOcrValor('')
    setOcrConfianza(null)
    try {
      const base64 = await imageToBase64(url)
      const numero = await leerMedidorConVision(base64)

      if (numero) {
        setOcrValor(numero)
        setOcrConfianza(95)
        setOcrEstado('Resultado de Google Vision. Verificá el número.')
      } else {
        setOcrConfianza(0)
        setOcrEstado('No se detectaron números. Ingresá manualmente.')
      }
    } catch (err) {
      setOcrEstado('Error al procesar. Verificá tu conexión.')
      setOcrConfianza(0)
    }
    setProcesando(false)
  }

  async function guardarLectura() {
    if (!socioActual) { alert('Seleccioná un socio primero.'); return }
    if (!ocrValor) { alert('El número de lectura está vacío.'); return }
    if (!/^\d+$/.test(ocrValor)) { alert('La lectura debe ser solo números.'); return }

    setGuardando(true)
    try {
      let fotoUrl = ''
      if (imagenFile) {
        const mes = new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })
        const raizId = await buscarOCrearCarpeta(token, 'Medidores Club')
        const mesId = await buscarOCrearCarpeta(token, mes, raizId)
        const nombreFoto = `${socioActual.id}_${socioActual.nombre.replace(/,?\s+/g, '_')}.jpg`
        fotoUrl = await subirFoto(token, imagenFile, nombreFoto, mesId)
      }

      const registro = {
        id: socioActual.id,
        nombre: socioActual.nombre,
        ubicacion: socioActual.ubicacion,
        anterior: socioActual.anterior,
        actual: parseInt(ocrValor),
        fecha: new Date().toLocaleDateString('es-AR'),
        fotoUrl,
      }

      setLecturas(prev => {
        const idx = prev.findIndex(l => l.id === socioActual.id)
        if (idx >= 0) {
          const nueva = [...prev]
          nueva[idx] = registro
          return nueva
        }
        return [...prev, registro]
      })

      setSocioActual(null)
      resetFoto()
      fotoInputRef.current.value = ''

    } catch (err) {
      alert('Error al subir la foto a Drive. Verificá tu conexión.')
    }
    setGuardando(false)
  }

  const badgeColor = ocrConfianza >= 70
    ? { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' }
    : ocrConfianza >= 40
    ? { bg: '#fffbeb', color: '#854d0e', border: '#fde68a' }
    : { bg: '#fff3f3', color: '#c62828', border: '#ffcdd2' }

  return (
    <div style={{ padding: '1rem', maxWidth: 480, margin: '0 auto' }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1rem'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Capturar lectura</h2>
        <button
          onClick={onVerLista}
          style={{
            fontSize: '0.8rem', padding: '6px 12px',
            border: '1px solid #ddd', borderRadius: 6,
            background: '#fff', cursor: 'pointer', color: '#333'
          }}
        >
          Ver lista ({lecturas.length})
        </button>
      </div>

      {/* Selector de socio */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: 6 }}>
          Seleccionar medidor
        </label>
        <select
          value={socioActual?.id || ''}
          onChange={e => selectSocio(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px',
            fontSize: '0.9rem', border: '1px solid #ddd',
            borderRadius: 8, background: '#ffffff',
            color: '#333333',
            boxSizing: 'border-box',
          }}
        >
          <option value="">— elegir socio —</option>
          {socios.map(s => {
            const hecho = lecturas.find(l => l.id === s.id)
            return (
              <option key={s.id} value={s.id}>
                {s.id} · {s.nombre}{hecho ? ' ✓' : ''}
              </option>
            )
          })}
        </select>
      </div>

      {/* Info del socio */}
      {socioActual && (
        <div style={{
          background: '#f8f8f8', borderRadius: 8,
          padding: '10px 14px', marginBottom: '1rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#666' }}>Ubicación</span>
            <span style={{ fontWeight: 500 }}>{socioActual.ubicacion}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Lectura anterior</span>
            <span style={{ fontWeight: 500 }}>
              {socioActual.anterior ? String(socioActual.anterior).padStart(5, '0') : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Foto */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: 6 }}>
          Fotografía del medidor
        </label>
        <div style={{
          background: '#000', borderRadius: 8, overflow: 'hidden',
          minHeight: 160, display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 8, position: 'relative'
        }}>
          {imagen
            ? <img src={imagen} alt="Medidor" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
            : <span style={{ color: '#555', fontSize: '0.85rem' }}>Sin imagen</span>
          }
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fotoInputRef}
          onChange={handleFoto}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fotoInputRef.current.click()}
          disabled={!socioActual}
          style={{
            width: '100%', padding: '11px',
            border: '1px solid #ddd', borderRadius: 8,
            background: socioActual ? '#fff' : '#f5f5f5',
            color: socioActual ? '#333' : '#aaa',
            fontSize: '0.9rem', cursor: socioActual ? 'pointer' : 'not-allowed',
          }}
        >
          📷 Tomar foto / Elegir de galería
        </button>
      </div>

      {/* OCR */}
      {imagen && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: 6 }}>
            Resultado del OCR
          </label>

          <div style={{
            background: '#f8f8f8', borderRadius: 8,
            padding: '1rem', textAlign: 'center', marginBottom: 8
          }}>
            {procesando
              ? <div style={{ color: '#666', fontSize: '0.9rem' }}>⏳ Procesando...</div>
              : (
                <>
                  <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: 6, marginBottom: 6 }}>
                    {ocrValor || '?'}
                  </div>
                  {ocrConfianza !== null && (
                    <div style={{
                      display: 'inline-block', fontSize: '0.75rem', fontWeight: 500,
                      padding: '3px 10px', borderRadius: 99,
                      background: badgeColor.bg, color: badgeColor.color,
                      border: `1px solid ${badgeColor.border}`
                    }}>
                      Confianza {ocrConfianza}%
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 8 }}>
                    {ocrEstado}
                  </div>
                </>
              )
            }
          </div>

          <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: 6 }}>
            Corrección manual
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={ocrValor}
            onChange={e => setOcrValor(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 004521"
            style={{
              width: '100%', padding: '10px 12px',
              fontSize: '1.2rem', letterSpacing: 4,
              border: '1px solid #ddd', borderRadius: 8,
              textAlign: 'center', fontWeight: 600,
              boxSizing: 'border-box', marginBottom: 12,
            }}
          />

          <button
            onClick={guardarLectura}
            disabled={guardando || procesando || !ocrValor}
            style={{
              width: '100%', padding: '12px',
              background: guardando || procesando || !ocrValor ? '#ccc' : '#1D9E75',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: '0.95rem', fontWeight: 500,
              cursor: guardando || procesando || !ocrValor ? 'not-allowed' : 'pointer',
            }}
          >
            {guardando ? 'Subiendo foto a Drive...' : 'Guardar lectura ✓'}
          </button>
        </div>
      )}

      {lecturas.length > 0 && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 8, padding: '10px 14px',
          fontSize: '0.85rem', color: '#166534',
          textAlign: 'center'
        }}>
          {lecturas.length} de {socios.length} medidores registrados
        </div>
      )}
    </div>
  )
}