import { useState } from 'react'
import Login from './components/Login'
import Inicio from './components/Inicio'
import Captura from './components/Captura'
import Lista from './components/Lista'
import './App.css'

export default function App() {
  const [token, setToken] = useState(null)
  const [pantalla, setPantalla] = useState('inicio')
  const [socios, setSocios] = useState([])
  const [lecturas, setLecturas] = useState([])
  const [socioActual, setSocioActual] = useState(null)

  if (!token) {
    return <Login onLogin={setToken} />
  }

  return (
    <div className="app-container">
      {pantalla === 'inicio' && (
        <Inicio
          token={token}
          socios={socios}
          setSocios={setSocios}
          onIniciar={() => setPantalla('captura')}
        />
      )}
      {pantalla === 'captura' && (
        <Captura
          token={token}
          socios={socios}
          lecturas={lecturas}
          setLecturas={setLecturas}
          socioActual={socioActual}
          setSocioActual={setSocioActual}
          onVerLista={() => setPantalla('lista')}
        />
      )}
      {pantalla === 'lista' && (
        <Lista
          token={token}
          socios={socios}
          lecturas={lecturas}
          setLecturas={setLecturas}
          onVolver={() => setPantalla('captura')}
        />
      )}
    </div>
  )
}