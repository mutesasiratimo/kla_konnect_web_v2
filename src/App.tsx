import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import heroImage from './assets/dmmp-hero.jpg'
import { RegisterApp } from './RegisterApp'
import Dashboard from './Dashboard'
import { auth, getSession, touchSession, isSessionExpired, clearToken } from './api'
import type { LoginUser } from './api/types'

type LoginFormState = {
  username: string
  password: string
}

type ViewMode = 'intro' | 'login'

const INACTIVITY_CHECK_MS = 30 * 1000 // check every 30s

function displayName(user: LoginUser | null | undefined): string {
  if (!user) return 'User'
  if (user.full_name?.trim()) return user.full_name.trim()
  const parts = [user.firstname, user.lastothernames].filter(Boolean) as string[]
  if (parts.length) return parts.join(' ')
  if (user.email?.trim()) return user.email.trim()
  return 'User'
}

function App() {
  const [form, setForm] = useState<LoginFormState>({
    username: '',
    password: '',
  })
  const [mode, setMode] = useState<ViewMode>('intro')
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterApp, setShowRegisterApp] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const s = getSession()
    if (!s?.access_token || !s.user) return false
    if (isSessionExpired()) {
      clearToken()
      return false
    }
    return true
  })
  const [sessionUser, setSessionUser] = useState<LoginUser | null>(() => {
    const s = getSession()
    if (!s?.user || isSessionExpired()) return null
    return s.user
  })
  const [loginError, setLoginError] = useState<string | null>(null)
  const inactivityCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logout = useCallback(() => {
    auth.logout()
    setIsLoggedIn(false)
    setSessionUser(null)
    window.history.pushState({}, '', '/login')
  }, [])

  // Sync URL when we have valid session on load (e.g. after refresh)
  useEffect(() => {
    if (!isLoggedIn) return
    const { pathname } = window.location
    if (pathname !== '/dashboard' && pathname !== '/self-register') {
      window.history.pushState({}, '', '/dashboard')
    }
  }, [isLoggedIn])

  // Inactivity: touch session on user activity; interval checks for 5min expiry and logs out
  useEffect(() => {
    const onActivity = () => touchSession()
    window.addEventListener('mousemove', onActivity)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('click', onActivity)
    window.addEventListener('scroll', onActivity)
    inactivityCheckRef.current = setInterval(() => {
      if (!getSession()) return
      if (isSessionExpired()) {
        logout()
      }
    }, INACTIVITY_CHECK_MS)
    return () => {
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('click', onActivity)
      window.removeEventListener('scroll', onActivity)
      if (inactivityCheckRef.current) clearInterval(inactivityCheckRef.current)
    }
  }, [logout])

  // Route: self-register vs login vs intro
  useEffect(() => {
    const { pathname } = window.location
    if (pathname === '/self-register') {
      setShowRegisterApp(true)
      return
    }
    if (pathname === '/login') {
      setMode('login')
      return
    }
    setMode('intro')
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    try {
      const res = await auth.login({
        username: form.username.trim(),
        password: form.password,
      })
      setSessionUser(res.user)
      setIsLoggedIn(true)
      window.history.pushState({}, '', '/dashboard')
    } catch (err: unknown) {
      let message = 'Login failed. Check credentials or try again.'
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body: unknown }).body
        if (typeof body === 'string') message = body
        else if (body && typeof body === 'object' && 'detail' in body) {
          const d = (body as { detail: unknown }).detail
          message = typeof d === 'string' ? d : JSON.stringify(d)
        }
      } else if (err instanceof Error) {
        message = err.message
      }
      setLoginError(message)
    }
  }

  const handleRegisterClick = () => {
    window.history.pushState({}, '', '/self-register')
    setShowRegisterApp(true)
  }

  if (isLoggedIn) {
    return (
      <Dashboard
        userName={displayName(sessionUser)}
        onLogout={logout}
      />
    )
  }

  if (showRegisterApp) {
    return <RegisterApp />
  }

  return (
    <div className="app-root container-fluid">
      <div className="auth-shell">
        <div className="auth-card">
          <section className="auth-left">
            <div className="logo-text">
              <img src="/dmmp_logo.png" alt="DMMP" className="logo-image" />
            </div>

            <div className="auth-content">
              {mode === 'intro' ? (
                <>
                  <section className="product-intro">
                    <h2>Digital Mobility Management Platform</h2>
                    <p>City Mobility Simplified</p>
                  </section>

                  <header className="auth-header auth-header--intro">
                    <h1>Self Registration</h1>
                    <p>Register your vehicle (Wandisa ekiduka kyo).</p>
                  </header>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleRegisterClick}
                  >
                    Register
                  </button>

                  <section className="alt-auth-block">
                    <h2 className="alt-auth-title">Already have an account?</h2>
                    <p className="alt-auth-subtitle">
                      Login to manage your account, vehicles, and subscriptions.
                    </p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setMode('login')
                        window.history.pushState({}, '', '/login')
                      }}
                    >
                      Log In
                    </button>
                  </section>
                </>
              ) : (
                <>
                  <header className="auth-header">
                    <h1>Login</h1>
                    <p>
                      .
                    </p>
                  </header>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="field">
                      <span className="field-label">User name</span>
                      <input
                        type="text"
                        name="username"
                        placeholder="Lorem lorem"
                        value={form.username}
                        onChange={handleChange}
                        autoComplete="username"
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Enter your Password</span>
                      <div className="password-field">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Type your password here"
                          value={form.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          aria-pressed={showPassword}
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path
                                d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.05 2.05C3.03 6.72 1.7 8.35.75 10.2a1.9 1.9 0 0 0 0 1.6C2.27 14.88 5.64 18.75 12 18.75c1.86 0 3.47-.34 4.87-.96l3.6 3.59a.75.75 0 1 0 1.06-1.06zM9.53 8.47 11 9.94a2.25 2.25 0 0 0 3.06 3.06l1.04 1.04A3.75 3.75 0 0 1 9.53 8.47m2.47-3.22c-1.1 0-2.13.16-3.08.44a.75.75 0 0 0 .4 1.44A10.2 10.2 0 0 1 12 6.06c4.36 0 6.97 2.74 8.25 4.94a.4.4 0 0 1 0 .4 9.83 9.83 0 0 1-2.27 2.73.75.75 0 1 0 .96 1.15A11.31 11.31 0 0 0 23.25 10.2a1.9 1.9 0 0 0 0-1.6C21.73 5.12 18.36 1.25 12 1.25"
                                fill="currentColor"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path
                                d="M12 5.25C6 5.25 2.73 9.1 1.21 11.4a1.9 1.9 0 0 0 0 1.6C2.73 15.88 6.1 19.75 12 19.75s9.27-3.87 10.79-6.75a1.9 1.9 0 0 0 0-1.6C21.27 9.1 18 5.25 12 5.25m0 2.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </label>

                    <div className="form-meta-row">
                      <label className="remember-me">
                        <input type="checkbox" />
                        <span>Remember me?</span>
                      </label>
                      <button type="button" className="link-button">
                        Forgot Password ?
                      </button>
                    </div>

                    {loginError && (
                      <div className="auth-error" role="alert">
                        {loginError}
                      </div>
                    )}

                    <button className="primary-button" type="submit">
                      Log In
                    </button>

                    <div className="login-inline-links">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => {
                          setMode('intro')
                          window.history.pushState({}, '', '/')
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="link-button"
                        onClick={handleRegisterClick}
                      >
                        New here? Register
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>

          <section className="auth-right" aria-hidden="true">
            <div className="hero-wrapper">
              <img
                src={heroImage}
                alt="Person using a phone on public transport"
                className="hero-image"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App
