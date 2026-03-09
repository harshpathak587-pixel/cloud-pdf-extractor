import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AuthPage from './AuthPage.jsx'
import './index.css'

function Root() {
  const [user, setUser] = useState(null);

  if (!user) return <AuthPage onLogin={(u) => setUser(u)} />;
  return <App user={user} onLogout={() => setUser(null)} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
