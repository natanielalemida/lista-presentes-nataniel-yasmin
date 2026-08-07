"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  BedDouble,
  Check,
  Copy,
  Gift,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { GiftCategory, GiftItem } from "./gifts";
import { WeddingCountdown } from "./WeddingCountdown";
import { WEDDING_DATE_LABEL } from "./wedding";

type Filter = "todos" | GiftCategory;

type WeddingConfig = {
  whatsappNumber: string;
};

type GiftRegistryProps = {
  gifts: GiftItem[];
  config: WeddingConfig;
  initialAvailability: AvailabilityMap;
  initialAvailabilityIsFresh: boolean;
};

type AvailabilityEntry = {
  total: number;
  reserved: number;
  available: number;
};

type AvailabilityMap = Record<string, AvailabilityEntry>;
type ReservationStatus = "idle" | "saving" | "saved" | "error";

type ReservationResponse = {
  availability?: AvailabilityMap;
  error?: string;
  alreadyReserved?: boolean;
};

const reservationKey = (giftId: string) =>
  `nataniel-yasmin-reservation:${giftId}`;
const confirmedKey = (giftId: string) =>
  `nataniel-yasmin-confirmed:${giftId}`;
const COLOSSIANS_3_17 =
  "Tudo o que fizerem, seja em palavra seja em ação, façam-no em nome do Senhor Jesus, dando por meio dele graças a Deus Pai.";
const PIX_KEY = "ce.yasmin15@gmail.com";

const filters: { label: string; value: Filter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Cozinha", value: "cozinha" },
  { label: "Quarto", value: "quarto" },
];

function categoryLabel(category: GiftCategory) {
  return category === "cozinha" ? "Cozinha" : "Quarto";
}

function quantityUnit(gift: GiftItem, value: number) {
  return value === 1 ? gift.quantity.unit : `${gift.quantity.unit}s`;
}

export function GiftRegistry({
  gifts,
  config,
  initialAvailability,
  initialAvailabilityIsFresh,
}: GiftRegistryProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>("todos");
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [availability, setAvailability] =
    useState<AvailabilityMap>(initialAvailability);
  const [reservationStatus, setReservationStatus] =
    useState<ReservationStatus>("idle");
  const [ownedGiftIds, setOwnedGiftIds] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const guestNameInputRef = useRef<HTMLInputElement>(null);
  const giftModalRef = useRef<HTMLElement>(null);
  const availabilityRevisionRef = useRef(0);
  const mutationInFlightRef = useRef(false);
  const savingRef = useRef(false);
  const sessionReservationIdsRef = useRef(new Map<string, string>());

  const filteredGifts = useMemo(
    () =>
      activeFilter === "todos"
        ? gifts
        : gifts.filter((gift) => gift.category === activeFilter),
    [activeFilter, gifts],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setOwnedGiftIds(
          new Set(
            gifts
              .filter((gift) => window.localStorage.getItem(confirmedKey(gift.id)))
              .map((gift) => gift.id),
          ),
        );
      } catch {
        // Private browsing can disable localStorage; the current session still works.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [gifts]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAvailability() {
      const requestRevision = availabilityRevisionRef.current;
      try {
        const result = await fetch("/api/availability", { cache: "no-store" });
        if (!result.ok) return;
        const data = (await result.json()) as { availability?: AvailabilityMap };
        if (
          !cancelled &&
          !mutationInFlightRef.current &&
          requestRevision === availabilityRevisionRef.current &&
          data.availability
        ) {
          setAvailability(data.availability);
        }
      } catch {
        // Keep the initial quantities visible if the network is temporarily offline.
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshAvailability();
    };

    if (!initialAvailabilityIsFresh) void refreshAvailability();
    const timer = window.setInterval(refreshAvailability, 30_000);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [initialAvailabilityIsFresh]);

  useEffect(() => {
    if (!selectedGift) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const backgroundElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".site-shell > :not(.modal-overlay):not(.toast)",
      ),
    );

    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";
    backgroundElements.forEach((element) => {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();

      if (event.key !== "Tab") return;

      const modal = giftModalRef.current;
      if (!modal) return;

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !modal.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      backgroundElements.forEach((element) => {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      });
      previouslyFocused?.focus();
    };
  }, [selectedGift]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openGift(gift: GiftItem) {
    const available = availability[gift.id]?.available ?? gift.quantity.total;
    const isOwned = ownedGiftIds.has(gift.id);
    if (available <= 0 && !isOwned) {
      setToast("Este presente já foi escolhido por completo.");
      return;
    }

    setSelectedGift(gift);
    setGuestName("");
    setGuestMessage("");
    setReservationStatus(isOwned ? "saved" : "idle");
  }

  function closeModal() {
    if (savingRef.current) return;
    setSelectedGift(null);
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.currentTarget === event.target) closeModal();
  }

  function getOrCreateReservationId(giftId: string) {
    const sessionReservationId = sessionReservationIdsRef.current.get(giftId);
    if (sessionReservationId) return sessionReservationId;

    let storedReservationId: string | null = null;
    try {
      storedReservationId = window.localStorage.getItem(reservationKey(giftId));
    } catch {
      // Fall back to a session-only ID when storage is unavailable.
    }

    const reservationId = storedReservationId || window.crypto.randomUUID();
    sessionReservationIdsRef.current.set(giftId, reservationId);

    try {
      window.localStorage.setItem(reservationKey(giftId), reservationId);
    } catch {
      // The ref keeps retries idempotent for the current session.
    }

    return reservationId;
  }

  function markGiftOwned(giftId: string) {
    setOwnedGiftIds((current) => {
      const next = new Set(current);
      next.add(giftId);
      return next;
    });

    try {
      window.localStorage.setItem(confirmedKey(giftId), "1");
    } catch {
      // Ownership is still remembered for the current session.
    }
  }

  function clearLocalReservation(giftId: string) {
    sessionReservationIdsRef.current.delete(giftId);
    setOwnedGiftIds((current) => {
      const next = new Set(current);
      next.delete(giftId);
      return next;
    });

    try {
      window.localStorage.removeItem(reservationKey(giftId));
      window.localStorage.removeItem(confirmedKey(giftId));
    } catch {
      // There may be no writable localStorage in this browser.
    }
  }

  function startSharing(text: string) {
    if (config.whatsappNumber) {
      const openedWindow = window.open(
        `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`,
        "_blank",
      );

      if (openedWindow) {
        openedWindow.opener = null;
        return Promise.resolve();
      }

      if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
      }

      return Promise.reject(new Error("Não foi possível abrir o WhatsApp."));
    }

    if (navigator.share) {
      return navigator.share({
        title: "Presente para Nataniel & Yasmin",
        text,
      });
    }

    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return Promise.reject(new Error("Compartilhamento indisponível."));
  }

  async function confirmGift() {
    if (!selectedGift || reservationStatus === "saving") return;

    const gift = selectedGift;
    const wasAlreadyOwned = ownedGiftIds.has(gift.id);

    const currentAvailable =
      availability[gift.id]?.available ?? gift.quantity.total;
    if (currentAvailable <= 0 && reservationStatus !== "saved") {
      setToast("Este presente acabou de ser escolhido por outra pessoa.");
      return;
    }

    const signedBy = guestName.trim().replace(/\s+/g, " ");
    if (signedBy.length < 2) {
      setToast("Informe seu nome para identificarmos o presente.");
      guestNameInputRef.current?.focus();
      return;
    }

    const note = guestMessage.trim() ? ` Mensagem: ${guestMessage.trim()}` : "";
    const text = `Oi, Nataniel e Yasmin! 💛 Escolhi presentear vocês com ${gift.name}, na cor ${gift.suggestedColor.toLowerCase()}. O casamento será em ${WEDDING_DATE_LABEL}. Com carinho, ${signedBy}.${note}\n\n“${COLOSSIANS_3_17}” — Colossenses 3:17.\nToda honra e toda glória a Deus.`;
    const reservationId = getOrCreateReservationId(gift.id);

    savingRef.current = true;
    mutationInFlightRef.current = true;
    availabilityRevisionRef.current += 1;
    setReservationStatus("saving");

    let sharingPromise: Promise<void>;
    try {
      sharingPromise = startSharing(text);
    } catch (error) {
      sharingPromise = Promise.reject(error);
    }
    const reservationPromise = fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        giftId: gift.id,
        reservationId,
        guestName: signedBy,
        guestMessage: guestMessage.trim(),
      }),
      keepalive: true,
    }).then(async (result) => {
      const data = (await result.json()) as ReservationResponse;
      if (data.availability) setAvailability(data.availability);
      if (!result.ok) throw new Error(data.error || "Não foi possível confirmar.");
      return data;
    });

    const [shareResult, reservationResult] = await Promise.allSettled([
      sharingPromise,
      reservationPromise,
    ]);

    try {
      if (reservationResult.status === "rejected") {
        setReservationStatus("error");
        setToast(
          reservationResult.reason instanceof Error
            ? reservationResult.reason.message
            : "Não foi possível confirmar este presente agora.",
        );
        return;
      }

      if (shareResult.status === "rejected") {
        const reservationWasExisting =
          wasAlreadyOwned || reservationResult.value.alreadyReserved;

        if (reservationWasExisting) {
          markGiftOwned(gift.id);
          setReservationStatus("saved");
          setToast("Sua reserva continua salva. Tente compartilhar novamente.");
          return;
        }

        const rollbackResult = await fetch("/api/availability", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ giftId: gift.id, reservationId }),
        });
        const rollbackData = (await rollbackResult.json()) as ReservationResponse;

        if (rollbackData.availability) setAvailability(rollbackData.availability);
        if (!rollbackResult.ok) {
          markGiftOwned(gift.id);
          setReservationStatus("saved");
          setToast("O presente ficou reservado, mas não foi possível compartilhar.");
          return;
        }

        clearLocalReservation(gift.id);
        setReservationStatus("idle");
        setToast("Compartilhamento cancelado. Nenhuma unidade foi reservada.");
        return;
      }

      markGiftOwned(gift.id);
      setReservationStatus("saved");
      setToast("Presente confirmado e disponibilidade atualizada!");
    } catch {
      markGiftOwned(gift.id);
      setReservationStatus("saved");
      setToast("O presente ficou reservado, mas não foi possível compartilhar.");
    } finally {
      savingRef.current = false;
      mutationInFlightRef.current = false;
      availabilityRevisionRef.current += 1;
    }
  }

  const selectedAvailable = selectedGift
    ? (availability[selectedGift.id]?.available ?? selectedGift.quantity.total)
    : 0;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#presentes">
        Ir para a lista de presentes
      </a>

      <div className="faith-ribbon" role="note">
        <span className="faith-ribbon-mark" aria-hidden="true">
          ✦
        </span>
        <strong>Toda honra e toda glória a Deus</strong>
        <span className="faith-ribbon-reference">Colossenses 3:17</span>
        <span className="faith-ribbon-mark" aria-hidden="true">
          ✦
        </span>
      </div>

      <header className="hero" id="inicio">
        <div className="hero-frame" aria-hidden="true" />
        <nav className="topbar" aria-label="Navegação principal">
          <a className="monogram" href="#inicio" aria-label="Nataniel e Yasmin">
            <span>N</span>
            <em>&amp;</em>
            <span>Y</span>
          </a>
          <div className="topbar-links">
            <a className="topbar-text-link" href="#nossa-lista">
              Nossa lista
            </a>
            <a className="topbar-cta" href="#presentes">
              Ver presentes
              <ArrowDown aria-hidden="true" size={16} strokeWidth={1.6} />
            </a>
          </div>
        </nav>

        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">
            <span aria-hidden="true" />
            Lista de presentes
            <span aria-hidden="true" />
          </p>
          <h1 className="hero-title">
            <span>Nataniel</span>
            <em>&amp;</em>
            <span>Yasmin</span>
          </h1>
          <p className="hero-subtitle">
            Nosso lar começa sob a graça de Deus, com o carinho de quem amamos.
          </p>
          <a className="primary-button hero-button" href="#presentes">
            Escolher um presente
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.7} />
          </a>
        </div>

        <a className="hero-scroll" href="#nossa-lista" aria-label="Continuar">
          <span>Role para descobrir</span>
          <ArrowDown aria-hidden="true" size={17} strokeWidth={1.5} />
        </a>
      </header>

      <main>
        <WeddingCountdown />

        <section className="welcome" id="nossa-lista" aria-labelledby="welcome-title">
          <div className="welcome-card">
            <div className="welcome-mark" aria-hidden="true">
              N <span>&amp;</span> Y
            </div>
            <div className="welcome-copy">
              <p className="eyebrow">Com muito carinho</p>
              <h2 id="welcome-title">Um pedacinho do nosso novo lar</h2>
              <p>
                A presença de vocês já é o nosso maior presente. Mas, se
                quiserem participar de um pedacinho da nossa nova história,
                preparamos esta lista com todo o carinho.
              </p>
            </div>
            <div className="welcome-signature" aria-hidden="true">
              para sempre,
              <strong>N &amp; Y</strong>
            </div>
          </div>
        </section>

        <section className="gift-section" id="presentes" aria-labelledby="gift-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Escolha com o coração</p>
              <h2 id="gift-title">Presentes para a nossa história</h2>
            </div>
            <p className="section-description">
              Cada escolha ajuda a compor os pequenos rituais da nossa vida a
              dois — da mesa posta ao descanso no fim do dia.
            </p>
          </div>

          <div className="palette-notice" role="note">
            <div className="palette-samples" aria-hidden="true">
              <span className="is-silver" />
              <span className="is-black" />
              <span className="is-white" />
              <span className="is-clear" />
              <span className="is-cream" />
            </div>
            <div className="palette-notice-title">
              <small>Paleta sugerida</small>
              <strong>Neutros, claros e transparentes</strong>
            </div>
            <p>
              Confira a cor indicada em cada presente. <strong>Nada vermelho</strong>,
              por favor.
            </p>
          </div>

          <div className="gift-toolbar">
            <div className="filters" aria-label="Filtrar presentes por cômodo">
              {filters.map((filter) => (
                <button
                  className={activeFilter === filter.value ? "is-active" : ""}
                  key={filter.value}
                  type="button"
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <p className="gift-count" aria-live="polite">
              <strong>{String(filteredGifts.length).padStart(2, "0")}</strong>{" "}
              {filteredGifts.length === 1 ? "presente" : "presentes"}
            </p>
          </div>

          <div className="gift-grid">
            {filteredGifts.map((gift, index) => {
              const CategoryIcon =
                gift.category === "cozinha" ? UtensilsCrossed : BedDouble;
              const available =
                availability[gift.id]?.available ?? gift.quantity.total;
              const reserved = gift.quantity.total - available;
              const isOwned = ownedGiftIds.has(gift.id);
              const availabilityClass =
                available <= 0
                  ? "is-unavailable"
                  : available < gift.quantity.total
                    ? "is-limited"
                    : "is-available";

              return (
                <article
                  className={`gift-card ${availabilityClass}`}
                  key={gift.id}
                  style={{ "--delay": `${Math.min(index, 8) * 45}ms` } as CSSProperties}
                >
                  <div className="gift-card-topline">
                    <span className="gift-category">
                      <CategoryIcon aria-hidden="true" size={16} strokeWidth={1.5} />
                      {categoryLabel(gift.category)}
                    </span>
                    <span className="gift-number" aria-hidden="true">
                      {String(gifts.indexOf(gift) + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="gift-card-media">
                    <Image
                      src={gift.image}
                      alt={gift.imageAlt}
                      fill
                      sizes="(max-width: 760px) calc(100vw - 80px), (max-width: 980px) 42vw, (max-width: 1180px) 29vw, 270px"
                    />
                    {available <= 0 && (
                      <span
                        className="gift-unavailable-label"
                        id={`availability-${gift.id}`}
                        role="status"
                      >
                        Não está mais disponível
                      </span>
                    )}
                    {available > 0 && (
                      <span
                        className={`gift-quantity-badge ${availabilityClass}`}
                        id={`availability-${gift.id}`}
                        aria-live="polite"
                      >
                        <small>Escolhidos</small>
                        <strong>
                          {reserved === 0
                            ? "0"
                            : String(reserved).padStart(2, "0")}
                          /
                          {String(gift.quantity.total).padStart(2, "0")}
                        </strong>
                      </span>
                    )}
                  </div>
                  <div className="gift-card-copy">
                    <h3>{gift.name}</h3>
                    <p>{gift.description}</p>
                  </div>
                  <div className="gift-card-footer">
                    <div className="gift-color">
                      <span
                        className="gift-color-swatch"
                        style={{ background: gift.colorSwatch }}
                        aria-hidden="true"
                      />
                      <span className="gift-color-copy">
                        <small>Cor sugerida</small>
                        <strong>{gift.suggestedColor}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={available <= 0 && !isOwned}
                      aria-describedby={`availability-${gift.id}`}
                      onClick={() => openGift(gift)}
                    >
                      {isOwned
                        ? "Compartilhar novamente"
                        : available <= 0
                          ? "Não está mais disponível"
                          : "Quero presentear"}
                      {(available > 0 || isOwned) && (
                        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.6} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="pix-invitation" aria-labelledby="pix-title">
          <div className="pix-invitation-icon" aria-hidden="true">
            <Heart size={24} strokeWidth={1.4} />
          </div>
          <div className="pix-invitation-copy">
            <p className="eyebrow">Se preferir presentear de outra forma</p>
            <h2 id="pix-title">Um carinho também pode chegar por Pix</h2>
            <p>
              Se for mais confortável para você, ficaremos igualmente felizes
              em receber sua contribuição para os sonhos do nosso novo lar.
              Todo gesto será recebido com muito amor e gratidão.
            </p>
          </div>
          <div className="pix-details">
            <span>Chave Pix (e-mail)</span>
            <strong>{PIX_KEY}</strong>
            <p>
              <b>Banco:</b> Nubank
            </p>
            <p>
              <b>Titular:</b> Cecilia Yasmin Oliveira Lima
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  .writeText(PIX_KEY)
                  .then(() => setToast("Chave Pix copiada!"))
                  .catch(() => setToast("Não foi possível copiar a chave Pix."));
              }}
            >
              <Copy aria-hidden="true" size={16} strokeWidth={1.7} />
              Copiar chave Pix
            </button>
          </div>
        </section>

        <section className="gratitude" aria-labelledby="gratitude-title">
          <div className="gratitude-ampersand" aria-hidden="true">
            &amp;
          </div>
          <div className="gratitude-content">
            <Sparkles aria-hidden="true" size={24} strokeWidth={1.3} />
            <p className="eyebrow">O fundamento da nossa história</p>
            <h2 id="gratitude-title">
              Toda honra e toda glória a Deus.
            </h2>
            <blockquote className="gratitude-scripture" id="colossenses-3-17">
              <p>“{COLOSSIANS_3_17}”</p>
              <cite>Colossenses 3:17</cite>
            </blockquote>
            <Heart aria-hidden="true" size={20} strokeWidth={1.4} />
          </div>
        </section>

        <section className="transparency-note" aria-labelledby="how-it-works-title">
          <div className="transparency-icon" aria-hidden="true">
            <Gift size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="eyebrow">De um jeito simples</p>
            <h2 id="how-it-works-title">Como funciona a nossa lista</h2>
          </div>
          <p>
            Escolha um presente, confira a cor e a quantidade desejada e
            compartilhe sua escolha com o casal. O site não realiza cobranças
            nem solicita dados bancários. Seu nome fica visível apenas para o
            casal identificar a sua escolha.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-monogram" href="#inicio" aria-label="Voltar ao início">
          N <span>&amp;</span> Y
        </a>
        <p className="footer-faith">
          Toda honra e toda glória a Deus
          <span>Colossenses 3:17</span>
        </p>
        <p className="footer-note">Nataniel &amp; Yasmin</p>
      </footer>

      {selectedGift && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={handleOverlayClick}
        >
          <section
            className="gift-modal"
            ref={giftModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="modal-close"
              ref={closeButtonRef}
              type="button"
              aria-label="Fechar"
              disabled={reservationStatus === "saving"}
              onClick={closeModal}
            >
              <X aria-hidden="true" size={21} strokeWidth={1.6} />
            </button>

            <header className="modal-header">
              <div className="modal-header-copy">
                <p className="eyebrow">Que carinho!</p>
                <h2 id="modal-title">{selectedGift.name}</h2>
                <p>{selectedGift.description}</p>
              </div>
              <div className="modal-product-media">
                <Image
                  src={selectedGift.image}
                  alt={selectedGift.imageAlt}
                  fill
                  sizes="180px"
                />
              </div>
            </header>

            <div className="modal-grid">
              <div className="contribution-panel">
                <div className="modal-step">
                  <span>01</span>
                  <div>
                    <h3>Confira a cor sugerida</h3>
                    <p>Uma referência para manter os itens do novo lar em harmonia.</p>
                  </div>
                </div>

                <div className="modal-preferences">
                  <div className="modal-color-card">
                    <span
                      className="modal-color-swatch"
                      style={{ background: selectedGift.colorSwatch }}
                      aria-hidden="true"
                    />
                    <div>
                      <span>Cor sugerida</span>
                      <strong>{selectedGift.suggestedColor}</strong>
                      <p>Nada vermelho, por favor.</p>
                    </div>
                  </div>
                  <div className="modal-quantity-card">
                    <span>Disponibilidade agora</span>
                    <strong>
                      {selectedAvailable} de {selectedGift.quantity.total}{" "}
                      {quantityUnit(selectedGift, selectedGift.quantity.total)}
                    </strong>
                    <p>
                      {selectedAvailable === 1
                        ? "Última unidade disponível."
                        : `${selectedAvailable} disponíveis neste momento.`}
                    </p>
                  </div>
                </div>

                <div className="guest-fields">
                  <label>
                    <span>
                      Seu nome <small>(para identificarmos o presente)</small>
                    </span>
                    <input
                      ref={guestNameInputRef}
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={guestName}
                      placeholder="Como podemos agradecer?"
                      onChange={(event) => setGuestName(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Deixe uma mensagem <small>(opcional)</small></span>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={guestMessage}
                      placeholder="Algumas palavras cheias de carinho..."
                      onChange={(event) => setGuestMessage(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="payment-panel">
                <div className="modal-step light">
                  <span>02</span>
                  <div>
                    <h3>Compartilhe sua escolha</h3>
                    <p>Avise ao casal qual presente você escolheu com carinho.</p>
                  </div>
                </div>

                <div className="coming-soon-card gift-confirm-card">
                  <div className="coming-soon-icon" aria-hidden="true">
                    <Gift size={38} strokeWidth={1.25} />
                  </div>
                  <h3>O carinho já está escolhido</h3>
                  <p>
                    Ao confirmar, uma unidade fica reservada. A mensagem inclui o
                    presente, a cor, a data do casamento: <strong>{WEDDING_DATE_LABEL}</strong>,
                    e o texto completo de Colossenses 3:17.
                  </p>
                  <button
                    type="button"
                    disabled={
                      reservationStatus === "saving" ||
                      (selectedAvailable <= 0 && reservationStatus !== "saved")
                    }
                    onClick={confirmGift}
                  >
                    {config.whatsappNumber ? (
                      <MessageCircle aria-hidden="true" size={18} strokeWidth={1.6} />
                    ) : (
                      <Share2 aria-hidden="true" size={18} strokeWidth={1.6} />
                    )}
                    {reservationStatus === "saving"
                      ? "Confirmando..."
                      : reservationStatus === "saved"
                        ? "Compartilhar novamente"
                        : selectedAvailable <= 0
                          ? "Presente indisponível"
                          : "Confirmar e compartilhar"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className={`toast ${toast ? "is-visible" : ""}`} role="status" aria-live="polite">
        <Check aria-hidden="true" size={17} strokeWidth={2} />
        {toast}
      </div>
    </div>
  );
}
