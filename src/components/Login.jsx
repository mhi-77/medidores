import { useGoogleLogin } from '@react-oauth/google'

export default function Login({ onLogin }) {
  const login = useGoogleLogin({
    onSuccess: (response) => onLogin(response.access_token),
    onError: () => alert('Error al iniciar sesión con Google'),
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' '),
  })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      padding: '2rem',
    }}>
      <div style={{ fontSize: 48 }}>⚡</div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>
          Lectura de Medidores
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Club deportivo · Recorrida mensual
        </p>
      </div>
      <button
        onClick={login}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          border: '1px solid #ddd',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          color: '#333',
        }}
      >
        <img
          src="https://www.google.com/favicon.ico"
          width={18}
          height={18}
          alt="Google"
        />
        Iniciar sesión con Google
      </button>
      <p style={{ fontSize: '0.8rem', color: '#999', textAlign: 'center', maxWidth: 280 }}>
        Necesario para leer el padrón de socios y guardar las fotos en Drive
      </p>
    </div>
  )
}