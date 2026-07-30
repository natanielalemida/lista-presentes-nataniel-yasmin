"use client";

import Image from "next/image";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  LogOut,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./AdminDashboard.module.css";

type AdminClaim = {
  id: string;
  giftId: string;
  slot: number;
  reservationId: string;
  guestName: string;
  guestMessage: string;
  createdAt: string;
  giftName: string;
  giftImage: string;
  suggestedColor: string;
  category: "cozinha" | "quarto";
};

type DashboardData = {
  claims: AdminClaim[];
  summary: {
    totalUnits: number;
    reservedUnits: number;
    availableUnits: number;
    completeGifts: number;
    progressPercent: number;
  };
};

type AdminDashboardProps = {
  initialAuthenticated: boolean;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function shortReservation(value: string) {
  return value ? value.slice(0, 8).toUpperCase() : "—";
}

export function AdminDashboard({
  initialAuthenticated,
}: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(initialAuthenticated);
  const [dashboardError, setDashboardError] = useState("");
  const [claimToRemove, setClaimToRemove] = useState<AdminClaim | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removalError, setRemovalError] = useState("");
  const [toast, setToast] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const cancelRemoveRef = useRef<HTMLButtonElement>(null);
  const confirmDialogRef = useRef<HTMLElement>(null);
  const dashboardContentRef = useRef<HTMLDivElement>(null);
  const lastRemoveButtonRef = useRef<HTMLButtonElement>(null);
  const removingRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setDashboardError("");

    try {
      const response = await fetch("/api/admin/claims", { cache: "no-store" });
      const result = (await response.json()) as DashboardData & { error?: string };

      if (response.status === 401) {
        setAuthenticated(false);
        setData(null);
        setLoginError("Sua sessão expirou. Entre novamente.");
        return;
      }
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível carregar as escolhas.");
      }

      setData(result);
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as escolhas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, loadDashboard]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!claimToRemove) return;
    const previousOverflow = document.body.style.overflow;
    const dashboardContent = dashboardContentRef.current;
    document.body.style.overflow = "hidden";
    dashboardContent?.setAttribute("inert", "");
    const focusTimer = window.setTimeout(() => cancelRemoveRef.current?.focus(), 30);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !removingRef.current) {
        setClaimToRemove(null);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = confirmDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      dashboardContent?.removeAttribute("inert");
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      lastRemoveButtonRef.current?.focus();
    };
  }, [claimToRemove]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || loginLoading) return;

    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Senha incorreta.");

      setPassword("");
      setLoading(true);
      setAuthenticated(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Senha incorreta.");
      passwordInputRef.current?.focus();
      passwordInputRef.current?.select();
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível sair do painel.");

      setAuthenticated(false);
      setData(null);
      setClaimToRemove(null);
      setPassword("");
      setLoginError("");
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Não foi possível sair do painel.",
      );
    }
  }

  async function removeClaim() {
    if (!claimToRemove || removing) return;
    removingRef.current = true;
    setRemoving(true);
    setRemovalError("");

    try {
      const response = await fetch(
        `/api/admin/claims/${encodeURIComponent(claimToRemove.giftId)}/${claimToRemove.slot}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId: claimToRemove.reservationId,
          }),
        },
      );
      const result = (await response.json()) as DashboardData & { error?: string };

      if (response.status === 401) {
        setAuthenticated(false);
        setData(null);
        setClaimToRemove(null);
        setLoginError("Sua sessão expirou. Entre novamente.");
        return;
      }
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível remover a escolha.");
      }

      setData(result);
      setToast(
        `A escolha de ${claimToRemove.guestName} para ${claimToRemove.giftName} foi removida.`,
      );
      setClaimToRemove(null);
    } catch (error) {
      setRemovalError(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a escolha.",
      );
    } finally {
      removingRef.current = false;
      setRemoving(false);
    }
  }

  if (!authenticated) {
    return (
      <main className={styles.authShell}>
        <div className={styles.authFrame} aria-hidden="true" />
        <section className={styles.loginCard} aria-labelledby="admin-login-title">
          <div className={styles.loginMark} aria-hidden="true">
            N <span>&amp;</span> Y
          </div>
          <p className={styles.eyebrow}>Área reservada</p>
          <h1 id="admin-login-title">Painel da lista</h1>
          <p className={styles.loginCopy}>
            Acesse para acompanhar as escolhas dos convidados e corrigir uma
            reserva quando necessário.
          </p>

          <form className={styles.loginForm} onSubmit={handleLogin}>
            <label className={styles.field}>
              <span>Senha de acesso</span>
              <div className={styles.passwordField}>
                <LockKeyhole aria-hidden="true" size={19} strokeWidth={1.6} />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  autoFocus
                  required
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={18} />
                  ) : (
                    <Eye aria-hidden="true" size={18} />
                  )}
                </button>
              </div>
            </label>

            {loginError && (
              <p className={styles.formError} role="alert">
                {loginError}
              </p>
            )}

            <button
              className={styles.primaryButton}
              type="submit"
              disabled={loginLoading || !password}
            >
              <ShieldCheck aria-hidden="true" size={18} />
              {loginLoading ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const summary = data?.summary;

  return (
    <div className={styles.adminShell}>
      <div className={styles.adminContent} ref={dashboardContentRef}>
        <header className={styles.topbar}>
        <a className={styles.brand} href="/admin" aria-label="Painel Nataniel e Yasmin">
          <span className={styles.brandMark}>
            N <em>&amp;</em> Y
          </span>
          <span>
            <small>Área reservada</small>
            Painel da lista
          </span>
        </a>
        <nav className={styles.topbarActions} aria-label="Ações do painel">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            aria-label="Ver site (abre em nova aba)"
          >
            <ExternalLink aria-hidden="true" size={17} />
            <span>Ver site</span>
          </a>
          <button
            type="button"
            aria-label="Sair do painel"
            onClick={handleLogout}
          >
            <LogOut aria-hidden="true" size={17} />
            <span>Sair</span>
          </button>
        </nav>
        </header>

        <main className={styles.adminMain}>
        <section className={styles.pageHeading}>
          <div>
            <p className={styles.eyebrow}>Lista de presentes</p>
            <h1>Escolhas dos convidados</h1>
            <p>
              Acompanhe quem escolheu cada presente e corrija reservas feitas
              por engano.
            </p>
          </div>
          <button
            className={styles.refreshButton}
            type="button"
            disabled={loading}
            onClick={() => void loadDashboard()}
          >
            <RefreshCw
              aria-hidden="true"
              className={loading ? styles.spinning : ""}
              size={17}
            />
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </section>

        <section className={styles.metrics} aria-label="Resumo da lista">
          <article className={styles.metricCard}>
            <UsersRound aria-hidden="true" size={22} />
            <span>Unidades escolhidas</span>
            <strong>{summary?.reservedUnits ?? "—"}</strong>
            <small>de {summary?.totalUnits ?? "—"} no total</small>
          </article>
          <article className={styles.metricCard}>
            <PackageOpen aria-hidden="true" size={22} />
            <span>Unidades disponíveis</span>
            <strong>{summary?.availableUnits ?? "—"}</strong>
            <small>prontas para escolher</small>
          </article>
          <article className={styles.metricCard}>
            <PackageCheck aria-hidden="true" size={22} />
            <span>Presentes completos</span>
            <strong>{summary?.completeGifts ?? "—"}</strong>
            <small>sem unidades restantes</small>
          </article>
          <article className={styles.metricCard}>
            <Gift aria-hidden="true" size={22} />
            <span>Lista preenchida</span>
            <strong>{summary ? `${summary.progressPercent}%` : "—"}</strong>
            <small>do novo lar escolhido</small>
          </article>
        </section>

        <section
          className={styles.panel}
          aria-labelledby="reservations-title"
          aria-busy={loading}
        >
          <header className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Reservas confirmadas</p>
              <h2 id="reservations-title">Quem vai dar o quê</h2>
            </div>
            <span className={styles.countBadge}>
              {data?.claims.length ?? 0}{" "}
              {data?.claims.length === 1 ? "escolha" : "escolhas"}
            </span>
          </header>

          {dashboardError && (
            <div className={styles.errorBanner} role="alert">
              <span>{dashboardError}</span>
              <button type="button" onClick={() => void loadDashboard()}>
                Tentar novamente
              </button>
            </div>
          )}

          {loading && !data ? (
            <div className={styles.loadingState} role="status">
              <RefreshCw aria-hidden="true" className={styles.spinning} size={25} />
              Carregando escolhas...
            </div>
          ) : dashboardError && !data ? null : data?.claims.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>
                  Escolhas confirmadas pelos convidados
                </caption>
                <thead>
                  <tr>
                    <th>Convidado</th>
                    <th>Presente</th>
                    <th>Escolhido em</th>
                    <th>Reserva</th>
                    <th><span className={styles.srOnly}>Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.claims.map((claim) => (
                    <tr key={claim.id}>
                      <td data-label="Convidado">
                        <div className={styles.guestCell}>
                          <strong>{claim.guestName}</strong>
                          {claim.guestMessage && <p>“{claim.guestMessage}”</p>}
                        </div>
                      </td>
                      <td data-label="Presente">
                        <div className={styles.giftCell}>
                          <Image
                            src={claim.giftImage}
                            alt=""
                            width={56}
                            height={56}
                          />
                          <span>
                            <strong>{claim.giftName}</strong>
                            <small>
                              {claim.suggestedColor} · unidade {claim.slot}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td data-label="Escolhido em">
                        <time dateTime={claim.createdAt}>{formatDate(claim.createdAt)}</time>
                      </td>
                      <td data-label="Reserva">
                        <code>{shortReservation(claim.reservationId)}</code>
                      </td>
                      <td data-label="Ação" className={styles.actionCell}>
                        <button
                          className={styles.removeButton}
                          type="button"
                          aria-label={`Remover escolha de ${claim.guestName} para ${claim.giftName}`}
                          onClick={(event) => {
                            lastRemoveButtonRef.current = event.currentTarget;
                            setRemovalError("");
                            setClaimToRemove(claim);
                          }}
                        >
                          <Trash2 aria-hidden="true" size={16} />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : data ? (
            <div className={styles.emptyState}>
              <Gift aria-hidden="true" size={38} strokeWidth={1.3} />
              <h3>Nenhum presente escolhido ainda</h3>
              <p>As confirmações dos convidados aparecerão aqui.</p>
            </div>
          ) : null}
        </section>
        </main>
      </div>

      {claimToRemove && (
        <div className={styles.confirmOverlay} role="presentation">
          <section
            ref={confirmDialogRef}
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-title"
            aria-describedby="remove-description"
          >
            <button
              className={styles.closeDialog}
              type="button"
              aria-label="Fechar"
              disabled={removing}
              onClick={() => setClaimToRemove(null)}
            >
              <X aria-hidden="true" size={19} />
            </button>
            <div className={styles.confirmIcon} aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <p className={styles.eyebrow}>Confirmar remoção</p>
            <h2 id="remove-title">Remover esta escolha?</h2>
            <p id="remove-description">
              A escolha de <strong>{claimToRemove.guestName}</strong> para{" "}
              <strong>{claimToRemove.giftName}</strong> será removida. Uma unidade
              voltará a ficar disponível no site.
            </p>
            {removalError && (
              <p className={styles.removalError} role="alert">
                {removalError}
              </p>
            )}
            <div className={styles.confirmActions}>
              <button
                ref={cancelRemoveRef}
                className={styles.secondaryButton}
                type="button"
                disabled={removing}
                onClick={() => setClaimToRemove(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                disabled={removing}
                onClick={() => void removeClaim()}
              >
                <Trash2 aria-hidden="true" size={17} />
                {removing ? "Removendo..." : "Sim, remover"}
              </button>
            </div>
          </section>
        </div>
      )}

      <div
        className={`${styles.toast} ${toast ? styles.toastVisible : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
