import React, { useState, useEffect } from "react";
import { ArrowLeft, UserRound, LogIn } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Card,
  Alert,
  BrandMark,
} from "../components/index.js";

/**
 * LOGIN PAGE (`#/login`)
 *
 * Halaman masuk khusus petugas CSIRT Dinas Kominfosandi Kabupaten Sumbawa.
 * Desain institusional, tema terang, tata letak kartu tunggal 420px.
 *
 * Props:
 * - onLogin: function(username, password)
 * - error: string (pesan kesalahan dari server)
 * - busy: boolean (status pemrosesan autentikasi)
 * - onBackToLanding: function
 */

export function LoginPage({ onLogin, error, busy, onBackToLanding }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    document.title = "Masuk — Content Detection";
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    if (!username.trim() || !password) {
      setValidationError("Nama pengguna dan kata sandi wajib diisi.");
      return;
    }
    onLogin(username.trim(), password);
  }

  function handleBack(event) {
    if (onBackToLanding) {
      event.preventDefault();
      onBackToLanding();
    }
  }

  const activeError = validationError || error;

  return (
    <div className="pub-login-shell">
      {/* 1. Header Tipis */}
      <header className="pub-login-header">
        <div className="pub-login-header__inner">
          <BrandMark variant="full" />
        </div>
      </header>

      {/* 2. Konten Tengah */}
      <main className="pub-login-main" id="main-content">
        <Card className="pub-login-card">
          <div className="pub-login-card__header">
            <h1 id="login-title" className="pub-login-title">
              Masuk
            </h1>
            <p className="pub-login-desc">
              Akses khusus petugas CSIRT Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Sumbawa.
            </p>
          </div>

          {activeError && (
            <Alert tone="danger" className="pub-login-alert">
              {activeError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate aria-labelledby="login-title" className="pub-login-form">
            <Field id="admin-username" label="Nama pengguna" required>
              <Input
                id="admin-username"
                name="username"
                autoComplete="username"
                icon={UserRound}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
                autoFocus
              />
            </Field>

            <Field id="admin-password" label="Kata sandi" required>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                showPasswordToggle
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={LogIn}
              loading={busy}
              className="pub-btn-full"
            >
              <span aria-live="polite">{busy ? "Memproses..." : "Masuk"}</span>
            </Button>

            <div className="pub-login-security-note">
              Akses dibatasi. Seluruh aktivitas pemindaian dicatat.
            </div>
          </form>
        </Card>

        {/* 3. Tautan Tunggal Kembali */}
        <div className="pub-login-back-wrap">
          <a
            href="#landing"
            onClick={handleBack}
            className="pub-login-back-link"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Kembali ke beranda</span>
          </a>
        </div>
      </main>

      {/* 4. Footer Resmi */}
      <footer className="pub-login-footer">
        <p className="pub-login-footer__text">
          &copy; {new Date().getFullYear()} Pemerintah Kabupaten Sumbawa &bull; Dinas Komunikasi, Informatika, Statistik dan Persandian
        </p>
      </footer>
    </div>
  );
}

export default LoginPage;
