import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import loginHero from './assets/login-hero.jpeg'
// Self-registration flow (RegisterApp) is disabled — only login is exposed in the UI.
// import { RegisterApp } from './RegisterApp'
import Dashboard from './Dashboard'
import {
  auth,
  getSession,
  touchSession,
  isSessionExpired,
  clearToken,
  ApiError,
} from './api'
import type { LoginUser } from './api/types'
import { OtpInput6, OTP_INPUT_LEN } from './components/OtpInput6'
import { Checkbox } from './components/ui/Checkbox'

type AuthMode = 'login' | 'forgot' | 'reset'

function formatApiDetail(err: unknown): string {
  if (err instanceof ApiError) {
    const b = err.body
    if (typeof b === 'string') return b
    if (b && typeof b === 'object' && 'detail' in b) {
      const d = (b as { detail: unknown }).detail
      if (typeof d === 'string') return d
      if (Array.isArray(d)) {
        return d
          .map((item) =>
            item && typeof item === 'object' && 'msg' in item
              ? String((item as { msg: string }).msg)
              : String(item),
          )
          .join(' ')
      }
    }
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

type LoginFormState = {
  username: string
  password: string
}

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
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
  const [postAuthMessage, setPostAuthMessage] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [fpEmail, setFpEmail] = useState('')
  const [fpCode, setFpCode] = useState('')
  const [fpNewPassword, setFpNewPassword] = useState('')
  const [fpConfirmPassword, setFpConfirmPassword] = useState('')
  const [fpError, setFpError] = useState<string | null>(null)
  const [fpBusy, setFpBusy] = useState(false)
  const [fpInfo, setFpInfo] = useState<string | null>(null)
  const [showFpPassword, setShowFpPassword] = useState(false)
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
    if (pathname !== '/dashboard') {
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

  // Login-only: normalize legacy /self-register URLs to /login
  useEffect(() => {
    const { pathname } = window.location
    if (pathname === '/self-register') {
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const goToLogin = () => {
    setAuthMode('login')
    setFpError(null)
    setFpInfo(null)
    setFpCode('')
    setFpNewPassword('')
    setFpConfirmPassword('')
    setShowFpPassword(false)
  }

  const openForgotPassword = () => {
    setLoginError(null)
    setPostAuthMessage(null)
    setFpError(null)
    setFpInfo(null)
    setFpCode('')
    setFpNewPassword('')
    setFpConfirmPassword('')
    const u = form.username.trim()
    setFpEmail(u.includes('@') ? u : '')
    setAuthMode('forgot')
  }

  const openResetWithCode = () => {
    setLoginError(null)
    setPostAuthMessage(null)
    setFpError(null)
    setFpInfo(null)
    setFpCode('')
    setFpNewPassword('')
    setFpConfirmPassword('')
    const u = form.username.trim()
    setFpEmail(u.includes('@') ? u : '')
    setAuthMode('reset')
  }

  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFpError(null)
    setFpInfo(null)
    const email = fpEmail.trim()
    if (!email) {
      setFpError('Enter your email address.')
      return
    }
    setFpBusy(true)
    try {
      await auth.forgotPassword({ email })
      setFpInfo(
        'If this email is registered, you will receive a reset code. Enter it below with your new password.',
      )
      setAuthMode('reset')
    } catch (err: unknown) {
      setFpError(formatApiDetail(err))
    } finally {
      setFpBusy(false)
    }
  }

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFpError(null)
    const email = fpEmail.trim()
    const code = fpCode.replace(/\D/g, '')
    if (!email) {
      setFpError('Email is required.')
      return
    }
    if (code.length !== OTP_INPUT_LEN) {
      setFpError(`Enter the full ${OTP_INPUT_LEN}-digit code.`)
      return
    }
    if (fpNewPassword.length < 6) {
      setFpError('Password must be at least 6 characters.')
      return
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpError('Passwords do not match.')
      return
    }
    setFpBusy(true)
    try {
      await auth.resetPassword({
        email,
        code,
        new_password: fpNewPassword,
      })
      goToLogin()
      setForm((f) => ({ ...f, username: email, password: '' }))
      setPostAuthMessage('Your password was updated. Sign in with your new password.')
    } catch (err: unknown) {
      setFpError(formatApiDetail(err))
    } finally {
      setFpBusy(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    setPostAuthMessage(null)
    try {
      const res = await auth.login({
        username: form.username.trim(),
        password: form.password,
      })
      setSessionUser(res.user)
      setIsLoggedIn(true)
      window.history.pushState({}, '', '/dashboard')
    } catch (err: unknown) {
      setLoginError(formatApiDetail(err))
    }
  }

  if (isLoggedIn) {
    return (
      <Dashboard
        userName={displayName(sessionUser)}
        onLogout={logout}
      />
    )
  }

  /*
  // Self-registration (hidden from UI; re-enable import RegisterApp above and this block to restore)
  if (showRegisterApp) {
    return <RegisterApp />
  }
  */

  return (
    <div className="app-root container-fluid">
      <div className="auth-shell">
        <div className="auth-card">
          <section className="auth-left">
            <div className="auth-content">
              <div className="auth-brand-row">
                <img
                  src="/kcclogo.jpg"
                  alt="Kla Konnect"
                  className="logo-image"
                />
                <div className="auth-brand-text">
                  <h3 className="auth-brand-title">Kla Konnect</h3>
                  <p className="auth-brand-tagline">The City at your fingertips.</p>
                </div>
              </div>

              {authMode === 'login' && (
                <>
                  <header className="auth-header">
                    <h1>Login</h1>
                    <p>Sign in with your account credentials.</p>
                  </header>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="field">
                      <span className="field-label">User name</span>
                      <input
                        type="text"
                        name="username"
                        placeholder="Enter your username"
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
                      <div className="remember-me">
                        <Checkbox
                          checked={rememberMe}
                          onCheckedChange={setRememberMe}
                          label="Remember me?"
                          ariaLabel="Remember me"
                        />
                      </div>
                      <div className="form-meta-links">
                        <button
                          type="button"
                          className="link-button"
                          onClick={openForgotPassword}
                        >
                          Forgot password?
                        </button>
                        <button
                          type="button"
                          className="link-button link-button--subtle"
                          onClick={openResetWithCode}
                        >
                          I have a reset code
                        </button>
                      </div>
                    </div>

                    {postAuthMessage && (
                      <div className="auth-success" role="status">
                        {postAuthMessage}
                      </div>
                    )}

                    {loginError && (
                      <div className="auth-error" role="alert">
                        {loginError}
                      </div>
                    )}

                    <button className="primary-button" type="submit">
                      Log In
                    </button>
                  </form>
                </>
              )}

              {authMode === 'forgot' && (
                <>
                  <header className="auth-header">
                    <h1>Forgot password</h1>
                    <p>
                      Enter the email for your account. We will send a reset
                      code if it exists.
                    </p>
                  </header>

                  <form className="auth-form" onSubmit={handleForgotSubmit}>
                    <label className="field">
                      <span className="field-label">Email</span>
                      <input
                        type="email"
                        name="fp-email"
                        placeholder="you@example.com"
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>

                    {fpError && (
                      <div className="auth-error" role="alert">
                        {fpError}
                      </div>
                    )}

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={fpBusy}
                    >
                      {fpBusy ? 'Sending…' : 'Send reset code'}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={goToLogin}
                      disabled={fpBusy}
                    >
                      Back to login
                    </button>
                  </form>
                </>
              )}

              {authMode === 'reset' && (
                <>
                  <header className="auth-header">
                    <h1>Set new password</h1>
                    <p>
                      Enter the code from your email and choose a new password.
                    </p>
                  </header>

                  {fpInfo && (
                    <div className="auth-success" role="status">
                      {fpInfo}
                    </div>
                  )}

                  <form className="auth-form" onSubmit={handleResetSubmit}>
                    <label className="field">
                      <span className="field-label">Email</span>
                      <input
                        type="email"
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>

                    <div className="field">
                      <span className="field-label">Reset code</span>
                      <OtpInput6
                        id="fp-otp"
                        value={fpCode}
                        onChange={setFpCode}
                        disabled={fpBusy}
                        aria-label="Password reset code"
                        autoFocus={Boolean(fpEmail.trim())}
                      />
                    </div>

                    <label className="field">
                      <span className="field-label">New password</span>
                      <div className="password-field">
                        <input
                          type={showFpPassword ? 'text' : 'password'}
                          value={fpNewPassword}
                          onChange={(e) => setFpNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          aria-label={
                            showFpPassword ? 'Hide password' : 'Show password'
                          }
                          aria-pressed={showFpPassword}
                          onClick={() =>
                            setShowFpPassword((previous) => !previous)
                          }
                        >
                          {showFpPassword ? (
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

                    <label className="field">
                      <span className="field-label">Confirm new password</span>
                      <input
                        type={showFpPassword ? 'text' : 'password'}
                        value={fpConfirmPassword}
                        onChange={(e) => setFpConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </label>

                    {fpError && (
                      <div className="auth-error" role="alert">
                        {fpError}
                      </div>
                    )}

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={fpBusy}
                    >
                      {fpBusy ? 'Updating…' : 'Update password'}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={goToLogin}
                      disabled={fpBusy}
                    >
                      Back to login
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>

          <section className="auth-right" aria-hidden="true">
            <div className="hero-wrapper">
              <img
                src={loginHero}
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
