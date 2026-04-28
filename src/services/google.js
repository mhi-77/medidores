const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

// ── SHEETS ──────────────────────────────────────────────────────────────────

export async function leerPadron(token, spreadsheetId, hoja = 'Padron') {
  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${hoja}!A2:D300`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  if (!data.values) return []
  return data.values.map(r => ({
    id: String(r[0] || '').trim(),
    nombre: String(r[1] || '').trim(),
    ubicacion: String(r[2] || '').trim(),
    anterior: Number(r[3]) || 0,
  }))
}

export async function escribirLecturas(token, spreadsheetId, lecturas) {
  const hoy = new Date().toLocaleDateString('es-AR')
  const mes = new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })
  const hoja = `Lecturas ${mes}`

  // Crear la hoja si no existe
  await fetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        addSheet: { properties: { title: hoja } }
      }]
    })
  })

  // Escribir encabezados y datos
  const filas = [
    ['ID Lote', 'Nombre Socio', 'Ubicación', 'Lectura Anterior', 'Lectura Actual', 'Consumo (kWh)', 'Fecha', 'Foto'],
    ...lecturas.map(l => [
      l.id,
      l.nombre,
      l.ubicacion,
      Number(l.anterior),
      Number(l.actual),
      Number(l.actual) - Number(l.anterior),
      hoy,
      l.fotoUrl || '',
    ])
  ]

  await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${hoja}!A1:H${filas.length}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: filas }),
    }
  )

  return hoja
}

// ── DRIVE ────────────────────────────────────────────────────────────────────

export async function buscarOCrearCarpeta(token, nombre, padreId = null) {
  const q = padreId
    ? `name='${nombre}' and mimeType='application/vnd.google-apps.folder' and '${padreId}' in parents and trashed=false`
    : `name='${nombre}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const res = await fetch(
    `${DRIVE_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()

  if (data.files && data.files.length > 0) return data.files[0].id

  // No existe, la creamos
  const meta = { name: nombre, mimeType: 'application/vnd.google-apps.folder' }
  if (padreId) meta.parents = [padreId]

  const crear = await fetch(`${DRIVE_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meta),
  })
  const carpeta = await crear.json()
  return carpeta.id
}

export async function subirFoto(token, archivo, nombre, carpetaId) {
  const metadata = {
    name: nombre,
    parents: [carpetaId],
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', archivo)

  const res = await fetch(
    `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id,webViewLink`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  )
  const data = await res.json()

  // Hacer el archivo visible para quien tenga el link
  await fetch(`${DRIVE_BASE}/files/${data.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })

  return data.webViewLink
}

// ── VISION OCR ───────────────────────────────────────────────────────────────

export async function leerMedidorConVision(imagenBase64) {
  const apiKey = import.meta.env.VITE_VISION_API_KEY
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`

  const body = {
    requests: [{
      image: { content: imagenBase64 },
      features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      imageContext: {
        languageHints: ['en'],
      }
    }]
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data.error) throw new Error(data.error.message)

  const texto = data.responses?.[0]?.fullTextAnnotation?.text || ''
  const soloNumeros = texto.replace(/\D/g, '').trim()

  return soloNumeros
}