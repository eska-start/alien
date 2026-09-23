import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CASES, type Investigation, type Route } from "./game/cases";
import {
  ArchiveDialog,
  EvidenceBoard,
  InspectDialog,
  LetterViewer,
  makeReturnClue,
  MemoryScene,
  RouteDialog,
  SettingsDialog,
} from "./game/components";
import {
  freshSave,
  loadGame,
  loadSettings,
  storeGame,
  storeSettings,
  type GameSave,
  type GameSettings,
} from "./game/save";

type Screen = "title" | "game" | "ending";
type Overlay = "none" | "letter" | "inspect" | "evidence" | "route" | "archive" | "settings" | "pause" | "restart" | "returned" | "resolution" | "memory";

function addUnique(values: number[], value: number) {
  return values.includes(value) ? values : [...values, value];
}

function Rain({ count = 32, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`rain-layer ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i key={index} style={{ left: `${(index * 37 + 3) % 100}%`, animationDelay: `${(index % 13) * -0.31}s`, animationDuration: `${1.3 + (index % 6) * 0.23}s` }} />
      ))}
    </div>
  );
}

function PaperIcon({ label }: { label: string }) {
  return <span className="paper-icon" aria-hidden="true"><span>{label.slice(0, 1)}</span></span>;
}

function SoundMark({ enabled }: { enabled: boolean }) {
  return (
    <svg className={`sound-mark ${enabled ? "" : "sound-off"}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 8v4h3l4 3V5L6 8H3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      {enabled && <><path d="M13 7c1.7 1.6 1.7 4.4 0 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M15.5 4.8c3.1 2.9 3.1 7.5 0 10.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></>}
      {!enabled && <path d="m13 8 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}
    </svg>
  );
}

function App() {
  const [save, setSave] = useState<GameSave>(() => loadGame());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [screen, setScreen] = useState<Screen>("title");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [activeObject, setActiveObject] = useState<Investigation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actorLeft, setActorLeft] = useState(8);
  const [actorPose, setActorPose] = useState<"idle" | "walking" | "reaching">("idle");
  const [endingStep, setEndingStep] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const ambientCleanupRef = useRef<(() => void) | null>(null);
  const stagePointerRef = useRef<number | null>(null);
  const actorTimerRef = useRef<number | null>(null);

  useEffect(() => storeGame(save), [save]);
  useEffect(() => storeSettings(settings), [settings]);

  const activeCase = CASES.find((item) => item.id === save.currentCase) ?? CASES[CASES.length - 1];
  const caseKey = String(activeCase.id);
  const foundClues = save.discovered[caseKey] ?? [];
  const caseIsDeduced = save.deductions.includes(activeCase.id);
  const caseClues = activeCase.objects.map((object) => object.clue);
  const hasReturnClue = foundClues.includes(`case${activeCase.id}-return`);
  const clueList = hasReturnClue ? [...caseClues, makeReturnClue(activeCase)] : caseClues;

  function updateSave(change: (current: GameSave) => GameSave) {
    setSave((current) => ({ ...change(current), savedAt: new Date().toISOString() }));
  }

  function getAudio() {
    if (typeof window === "undefined" || !("AudioContext" in window)) return null;
    if (!audioRef.current || audioRef.current.state === "closed") {
      audioRef.current = new AudioContext();
    }
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  }

  function playFx(kind: "paper" | "stamp" | "ink" | "drawer" | "return" | "step") {
    if (!settings.sound) return;
    const context = getAudio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const lowpass = context.createBiquadFilter();
    const now = context.currentTime;
    const sound = {
      paper: { frequency: 470, type: "triangle" as OscillatorType, duration: 0.13, volume: 0.035 },
      stamp: { frequency: 88, type: "sine" as OscillatorType, duration: 0.19, volume: 0.13 },
      ink: { frequency: 220, type: "sine" as OscillatorType, duration: 0.44, volume: 0.075 },
      drawer: { frequency: 145, type: "sawtooth" as OscillatorType, duration: 0.26, volume: 0.035 },
      return: { frequency: 178, type: "triangle" as OscillatorType, duration: 0.31, volume: 0.07 },
      step: { frequency: 102, type: "sine" as OscillatorType, duration: 0.14, volume: 0.045 },
    }[kind];
    oscillator.type = sound.type;
    oscillator.frequency.setValueAtTime(sound.frequency, now);
    if (kind === "stamp") oscillator.frequency.exponentialRampToValueAtTime(44, now + sound.duration);
    if (kind === "drawer") oscillator.frequency.exponentialRampToValueAtTime(92, now + sound.duration);
    lowpass.type = "lowpass";
    lowpass.frequency.value = kind === "paper" ? 900 : 440;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(sound.volume, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.duration);
    oscillator.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + sound.duration + 0.02);
  }

  useEffect(() => {
    if (screen !== "game" || !settings.sound) return;
    const context = getAudio();
    if (!context) return;
    const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = noise.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = (Math.random() * 2 - 1) * 0.5;
    const source = context.createBufferSource();
    const rainFilter = context.createBiquadFilter();
    const rainGain = context.createGain();
    source.buffer = noise;
    source.loop = true;
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 520;
    rainGain.gain.value = 0.022;
    source.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(context.destination);
    source.start();
    const tick = () => {
      const osc = context.createOscillator();
      const volume = context.createGain();
      osc.type = "sine";
      osc.frequency.value = 780;
      volume.gain.setValueAtTime(0.0001, context.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.07);
      osc.connect(volume);
      volume.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.075);
    };
    const tickId = window.setInterval(tick, 3400);
    ambientCleanupRef.current = () => {
      window.clearInterval(tickId);
      try { source.stop(); } catch { /* The ambience may already have stopped. */ }
      source.disconnect();
      rainFilter.disconnect();
      rainGain.disconnect();
    };
    return () => {
      ambientCleanupRef.current?.();
      ambientCleanupRef.current = null;
    };
    // The room ambience is restarted only when the game or sound setting changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, settings.sound]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (screen === "game" && overlay === "none" && save.phase === "investigation") {
        const key = event.key.toLowerCase();
        if (["arrowleft", "arrowright", "a", "d"].includes(key)) {
          event.preventDefault();
          const direction = key === "arrowleft" || key === "a" ? -1 : 1;
          setActorLeft((value) => Math.max(2, Math.min(68, value + direction * 5)));
          setActorPose("walking");
          if (actorTimerRef.current) window.clearTimeout(actorTimerRef.current);
          actorTimerRef.current = window.setTimeout(() => setActorPose("idle"), 520);
        }
      }
      if (event.key !== "Escape") return;
      if (screen === "game") {
        if (overlay === "none" && save.phase === "investigation") setOverlay("pause");
        else if (overlay !== "none" && overlay !== "memory" && !(overlay === "letter" && save.phase === "arrival")) setOverlay("none");
      } else if (screen === "ending") {
        setScreen("title");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay, save.phase, screen]);

  function beginFreshShift() {
    const next = { ...freshSave(), started: true, currentCase: 1 as const, phase: "arrival" as const };
    setSave(next);
    setScreen("game");
    setOverlay("none");
    setDrawerOpen(false);
    playFx("step");
  }

  function startShift() {
    if (save.started && !save.endingSeen) {
      setOverlay("restart");
      return;
    }
    beginFreshShift();
  }

  function continueShift() {
    if (!save.started) return;
    if (save.currentCase >= CASES.length) {
      setEndingStep(save.endingSeen ? 4 : save.endingStep);
      setScreen("ending");
    } else {
      setScreen("game");
      setOverlay("none");
    }
  }

  function enterArchive() {
    setOverlay("archive");
  }

  function openLetter() {
    playFx("paper");
    setOverlay("letter");
  }

  function closeLetter() {
    if (save.phase === "arrival") {
      updateSave((current) => ({ ...current, phase: "investigation" }));
      setOverlay("none");
      return;
    }
    setOverlay("none");
  }

  function investigate(object: Investigation) {
    setActiveObject(object);
    setOverlay("inspect");
    setActorLeft(Math.max(2, Math.min(66, object.left - 19)));
    setActorPose("reaching");
    if (actorTimerRef.current) window.clearTimeout(actorTimerRef.current);
    actorTimerRef.current = window.setTimeout(() => setActorPose("idle"), 900);
    playFx("paper");
  }

  function updateActorFromPointer(event: ReactPointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = ((event.clientX - bounds.left) / bounds.width) * 100 - 12;
    setActorLeft(Math.max(2, Math.min(68, position)));
  }

  function onStagePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    stagePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateActorFromPointer(event);
    setActorPose("walking");
  }

  function onStagePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (stagePointerRef.current !== event.pointerId) return;
    updateActorFromPointer(event);
  }

  function onStagePointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (stagePointerRef.current !== event.pointerId) return;
    stagePointerRef.current = null;
    setActorPose("idle");
  }

  function collectActiveClue() {
    if (!activeObject) return;
    const clue = activeObject.clue;
    updateSave((current) => {
      const old = current.discovered[String(activeCase.id)] ?? [];
      const discovered = old.includes(clue.id) ? old : [...old, clue.id];
      const memories = clue.memory ? [...new Set([...current.memories, `memory-${activeCase.id}`])] : current.memories;
      return {
        ...current,
        discovered: { ...current.discovered, [String(activeCase.id)]: discovered },
        memories,
      };
    });
    setOverlay(clue.memory ? "memory" : "none");
    playFx(clue.memory ? "ink" : "paper");
  }

  function connectEvidence() {
    updateSave((current) => ({ ...current, deductions: addUnique(current.deductions, activeCase.id) }));
    playFx("ink");
  }

  function recordReturnNote() {
    const returnId = `case${activeCase.id}-return`;
    updateSave((current) => {
      const old = current.discovered[String(activeCase.id)] ?? [];
      return { ...current, discovered: { ...current.discovered, [String(activeCase.id)]: old.includes(returnId) ? old : [...old, returnId] } };
    });
    setOverlay("none");
    playFx("paper");
  }

  function dispatchLetter(route: Route) {
    setOverlay(route === activeCase.route ? "resolution" : "returned");
    updateSave((current) => {
      if (route !== activeCase.route) {
        const key = String(activeCase.id);
        return { ...current, routeAttempts: { ...current.routeAttempts, [key]: (current.routeAttempts[key] ?? 0) + 1 } };
      }
      const key = String(activeCase.id);
      return {
        ...current,
        completed: addUnique(current.completed, activeCase.id),
        outcomes: { ...current.outcomes, [key]: route },
      };
    });
    playFx(route === activeCase.route ? "stamp" : "return");
  }

  function continueAfterDelivery() {
    setOverlay("none");
    if (activeCase.id === CASES.length) {
      setEndingStep(0);
      updateSave((current) => ({ ...current, currentCase: CASES.length, phase: "investigation", endingStep: 0, endingSeen: false }));
      setScreen("ending");
      return;
    }
    const nextId = activeCase.id + 1;
    updateSave((current) => ({ ...current, currentCase: nextId, phase: "arrival" }));
    setDrawerOpen(false);
    playFx("step");
  }

  function handleEndingStep(step: number) {
    const nextStep = Math.min(4, Math.max(0, step));
    setEndingStep(nextStep);
    updateSave((current) => ({ ...current, endingStep: nextStep, endingSeen: nextStep >= 4 }));
  }

  function returnToTitle() {
    setScreen("title");
    setOverlay("none");
  }

  function toggleDrawer() {
    setDrawerOpen((open) => !open);
    playFx("drawer");
  }

  const reduceClass = settings.reduceMotion ? "motion-reduced" : "";

  return (
    <div className={`game-root ${reduceClass}`}>
      {screen === "title" && (
        <main className="title-screen">
          <div className="title-art" />
          <div className="title-vignette" />
          <Rain count={38} className="title-rain" />
          <div className="title-dust" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <header className="title-topbar">
            <div className="office-mark"><span>D</span><small>13</small></div>
            <div className="title-top-actions">
              <button type="button" onClick={enterArchive}>기억 보관함</button>
              <button type="button" onClick={() => setOverlay("settings")} aria-label="설정 열기">설정</button>
            </div>
          </header>
          <section className="title-composition">
            <div className="title-copy">
              <span className="eyebrow title-korean">죽은 자의 우편국</span>
              <h1><span>DEAD LETTER</span><span>OFFICE</span></h1>
              <p className="title-promise">도착하지 못한 편지는,<br />아직 끝나지 않은 이야기다.</p>
              <div className="title-actions">
                <button className="new-shift-button" type="button" onClick={startShift}>
                  <span className="button-stamp">DLO</span>
                  <span>{save.started && !save.endingSeen ? "NEW SHIFT / 처음부터" : "NEW SHIFT"}</span>
                  <span className="button-arrow" aria-hidden="true">↗</span>
                </button>
                {save.started && !save.endingSeen && (
                  <button className="continue-button" type="button" onClick={continueShift}>
                    <span>CONTINUE / 근무 이어하기</span><span aria-hidden="true">→</span>
                  </button>
                )}
                {save.endingSeen && (
                  <button className="continue-button" type="button" onClick={continueShift}>
                    <span>LAST LETTER / 마지막 장면</span><span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
              <div className="title-footnote"><span /> 비가 그치지 않는 밤, 우편함은 비어 있지 않다.</div>
            </div>
            <div className="title-scene-caption" aria-hidden="true">
              <span>EST. AFTER THE LAST POST</span>
              <span>13TH DISTRICT / NIGHT SHIFT</span>
              <div className="title-caption-line" />
              <span>01 — 05</span>
            </div>
          </section>
          <footer className="title-footer"><span>AN INTERACTIVE STORY ABOUT THE THINGS WE NEVER SENT</span><span>EST. 1987 / ALWAYS OPEN</span></footer>
        </main>
      )}

      {screen === "game" && (
        <div className={`game-screen case-${activeCase.id} ${reduceClass}`}>
          <header className="game-header">
            <button className="game-wordmark" type="button" onClick={() => setOverlay("pause")} aria-label="일시 정지">
              <span className="game-seal">D</span><span>DEAD LETTER OFFICE<small>죽은 자의 우편국</small></span>
            </button>
            <div className="shift-heading">
              <span>DAY {String(activeCase.id).padStart(2, "0")}</span>
              <strong>{activeCase.title}</strong>
              <small>{activeCase.subtitle}</small>
            </div>
            <div className="header-actions">
              <div className="shift-progress" aria-label={`전체 ${CASES.length}개 사건 중 ${activeCase.id}번째`}>
                {CASES.map((item) => <span key={item.id} className={`${item.id === activeCase.id ? "progress-current" : ""} ${save.completed.includes(item.id) ? "progress-done" : ""}`} />)}
              </div>
              <button className="header-action" type="button" onClick={enterArchive} aria-label="보관함">ARCHIVE</button>
              <button className="sound-toggle" type="button" onClick={() => setSettings((current) => ({ ...current, sound: !current.sound }))} aria-label={settings.sound ? "소리 끄기" : "소리 켜기"}>
                <SoundMark enabled={settings.sound} />
              </button>
              <button className="header-menu" type="button" onClick={() => setOverlay("pause")} aria-label="메뉴"><span /><span /></button>
            </div>
          </header>

          <main className="game-main">
            <section
              className={`scene-stage scene-dawn-${Math.min(4, save.completed.length)} ${reduceClass}`}
              aria-label="우편국 조사 장면"
              onPointerDown={onStagePointerDown}
              onPointerMove={onStagePointerMove}
              onPointerUp={onStagePointerUp}
              onPointerCancel={onStagePointerUp}
            >
              <div className="scene-art" />
              <div className="scene-veil" />
              <div className="window-rain" aria-hidden="true"><Rain count={24} /></div>
              <div className="scene-dust" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="curtain-shadow" aria-hidden="true" />
              <div className="pendulum" aria-hidden="true"><i /><b /></div>
              <div className="candle-flicker" aria-hidden="true" />
              <div className="paper-drift paper-drift-one" aria-hidden="true" />
              <div className="paper-drift paper-drift-two" aria-hidden="true" />
              <div className={`elliot-presence actor-${actorPose}`} style={{ left: `${actorLeft}%` }} aria-hidden="true">
                <img src="/images/elliot.png" alt="" />
                <span />
              </div>
              {save.completed.length > 0 && (
                <div className="office-keepsakes" aria-label="우편국에 남은 기억">
                  {save.completed.includes(1) && <span className="keepsake keepsake-photo"><i />PHOTO / 10.12</span>}
                  {save.completed.includes(2) && <span className="keepsake keepsake-map">ROUTE 04 <i>·</i></span>}
                  {save.completed.includes(3) && <span className="keepsake keepsake-letters"><i />TWO / TOGETHER</span>}
                  {save.completed.includes(4) && <span className="keepsake keepsake-flower"><i /></span>}
                </div>
              )}
              <div className="scene-title-etch">
                <span>THE OFFICE / AFTER HOURS</span>
                <strong>{activeCase.title}</strong>
              </div>
              <div className="scene-caption" aria-live="polite">
                <span className="caption-rule" />
                <p>{foundClues.length === 0 ? activeCase.arrival : caseIsDeduced ? activeCase.insightTitle : `${foundClues.length}개의 흔적이 책상 위에 남았다.`}</p>
              </div>
              {activeCase.objects.map((object) => {
                const found = foundClues.includes(object.clue.id);
                return (
                  <button
                    className={`scene-hotspot ${found ? "hotspot-found" : ""}`}
                    type="button"
                    key={object.id}
                    style={{ left: `${object.left}%`, top: `${object.top}%` }}
                    onClick={() => investigate(object)}
                    aria-label={`${object.title} 조사하기${found ? ", 발견한 단서" : ""}`}
                  >
                    <span className="hotspot-ink" />
                    <span className="hotspot-label">{found ? "기록됨" : object.label}</span>
                  </button>
                );
              })}
              <button className={`drawer-hotspot ${drawerOpen ? "drawer-hotspot-open" : ""}`} type="button" onClick={toggleDrawer} aria-label={drawerOpen ? "서랍 닫기" : "책상 서랍 열기"}>
                <span />
              </button>
              <button className="letter-hotspot" type="button" onClick={openLetter} aria-label="책상 위 편지 다시 읽기">
                <span className="letter-hotspot-paper" /><span className="letter-hotspot-note">편지</span>
              </button>
              {drawerOpen && (
                <div className="drawer-reveal" role="status">
                  <span className="eyebrow">DESK DRAWER / OPEN</span>
                  <p>연필 부스러기와 오래된 고무줄. 안쪽 나무에는 누군가 손톱으로 새긴 작은 별이 있다.</p>
                  <button type="button" onClick={toggleDrawer}>서랍을 닫는다 <span aria-hidden="true">×</span></button>
                </div>
              )}
              <div className="scene-edge-note" aria-hidden="true"><span>ELLIOT / NIGHT CLERK</span><span>DRAG OR WASD TO MOVE</span></div>
            </section>

            <section className="desk-rail" aria-label="편지와 단서">
              <button className="desk-letter-link" type="button" onClick={openLetter}>
                <PaperIcon label="L" />
                <span className="desk-link-copy"><small>ON THE DESK / {activeCase.letters.length} {activeCase.letters.length > 1 ? "LETTERS" : "LETTER"}</small><strong>편지 다시 읽기</strong></span>
                <span className="desk-arrow" aria-hidden="true">↗</span>
              </button>
              <div className="desk-evidence-register">
                <div className="register-heading"><span>FIELD NOTES</span><span>{String(foundClues.length).padStart(2, "0")} / {String(activeCase.objects.length + (hasReturnClue ? 1 : 0)).padStart(2, "0")}</span></div>
                <div className="register-clues">
                  {foundClues.length === 0 ? (
                    <p className="register-empty">방 안의 물건을 살펴보세요.</p>
                  ) : clueList.filter((clue) => foundClues.includes(clue.id)).map((clue, index) => (
                    <button type="button" className="register-clue" key={clue.id} onClick={() => setOverlay("evidence")}>
                      <span>{String(index + 1).padStart(2, "0")}</span>{clue.title}<i />
                    </button>
                  ))}
                </div>
              </div>
              <div className="desk-actions">
                <button className="evidence-action" type="button" disabled={foundClues.length < 2} onClick={() => setOverlay("evidence")}>
                  <span className="action-underline">단서 연결하기</span><small>{foundClues.length < 2 ? `두 개의 기록이 필요합니다 / ${foundClues.length}개 발견` : caseIsDeduced ? "기록을 다시 살펴본다" : "두 개의 흔적을 맞대어 본다"}</small>
                </button>
                <button className={`ink-button sort-action ${caseIsDeduced ? "sort-ready" : ""}`} type="button" disabled={!caseIsDeduced} onClick={() => setOverlay("route")}>
                  {caseIsDeduced ? "편지를 분류한다" : "분류함은 아직 잠겨 있다"}<span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          </main>

          <footer className="game-footer"><span>자동 저장됨</span><span>ESC / 메뉴</span><span>{activeCase.date} <i>·</i> 야간 우편국</span></footer>

          {save.phase === "arrival" && overlay !== "restart" && (
            <LetterViewer caseFile={activeCase} initialOpen={false} arrival onContinue={closeLetter} />
          )}
          {overlay === "letter" && <LetterViewer key={`letter-${activeCase.id}`} caseFile={activeCase} initialOpen arrival={false} onContinue={closeLetter} />}
          {overlay === "inspect" && activeObject && (
            <InspectDialog
              key={activeObject.id}
              objectId={activeObject.id}
              caseId={activeCase.id}
              title={activeObject.title}
              location={activeObject.location}
              description={activeObject.description}
              pages={activeObject.pages}
              clue={activeObject.clue}
              alreadyFound={foundClues.includes(activeObject.clue.id)}
              onCollect={collectActiveClue}
              onClose={() => setOverlay("none")}
            />
          )}
          {overlay === "evidence" && foundClues.length >= 1 && (
            <EvidenceBoard caseFile={activeCase} clues={clueList} discovered={foundClues} deduced={caseIsDeduced} onConnect={connectEvidence} onClose={() => setOverlay("none")} />
          )}
          {overlay === "route" && <RouteDialog caseFile={activeCase} onDispatch={dispatchLetter} onClose={() => setOverlay("none")} playStamp={() => playFx("stamp")} />}
          {overlay === "memory" && <MemoryScene caseFile={activeCase} reduceMotion={settings.reduceMotion} onContinue={() => setOverlay("none")} />}
          {overlay === "archive" && <ArchiveDialog save={save} onClose={() => setOverlay("none")} />}
          {overlay === "settings" && <SettingsDialog settings={settings} onChange={setSettings} onClose={() => setOverlay("none")} />}
          {overlay === "pause" && (
            <div className="modal-veil pause-veil">
              <section className="pause-window" role="dialog" aria-modal="true" aria-label="일시 정지 메뉴">
                <span className="eyebrow">THE OFFICE WILL WAIT</span>
                <h2>잠시 멈춤</h2>
                <p>시계는 계속 가지만, 이곳의 편지는 기다릴 줄 압니다.</p>
                <button className="ink-button" type="button" onClick={() => setOverlay("none")}>근무를 계속한다 <span>→</span></button>
                <button className="plain-action" type="button" onClick={() => setOverlay("settings")}>설정</button>
                <button className="plain-action" type="button" onClick={enterArchive}>기억 보관함</button>
                <button className="plain-action pause-exit" type="button" onClick={returnToTitle}>저장하고 제목 화면으로</button>
              </section>
            </div>
          )}
          {overlay === "restart" && (
            <div className="modal-veil">
              <section className="pause-window restart-window" role="dialog" aria-modal="true" aria-label="새 근무 확인">
                <span className="eyebrow">UNFILED / NEW SHIFT</span>
                <h2>처음부터 다시 시작할까요?</h2>
                <p>지금까지의 기록은 새 근무를 시작하면 덮어씌워집니다. 보관함은 다시 비워집니다.</p>
                <div className="confirm-actions">
                  <button className="plain-action" type="button" onClick={() => setOverlay("none")}>돌아가기</button>
                  <button className="ink-button" type="button" onClick={beginFreshShift}>새 근무를 시작한다 <span>→</span></button>
                </div>
              </section>
            </div>
          )}
          {overlay === "returned" && (
            <div className="modal-veil return-veil">
              <section className="return-window" role="dialog" aria-modal="true" aria-label="돌아온 편지">
                <span className="eyebrow">RETURNED / CASE {String(activeCase.id).padStart(2, "0")}</span>
                <div className="returned-stamp">RETURN<br />TO SENDER</div>
                <h2>그곳이 아니었다.</h2>
                <p className="returned-quote">"여기가 아니야."</p>
                <p>{activeCase.returnedNote}</p>
                <div className="return-actions">
                  <button className="plain-action" type="button" onClick={recordReturnNote}>메모를 기록하고 책상으로</button>
                  <button className="ink-button" type="button" onClick={() => { recordReturnNote(); setOverlay("route"); }}>편지를 다시 분류한다 <span>→</span></button>
                </div>
              </section>
            </div>
          )}
          {overlay === "resolution" && (
            <div className="modal-veil resolution-veil">
              <section className="resolution-window" role="dialog" aria-modal="true" aria-label="편지 전달 결과">
                <span className="eyebrow">DELIVERY RECORDED / CASE {String(activeCase.id).padStart(2, "0")}</span>
                <div className="resolution-ink" aria-hidden="true">{activeCase.route.toUpperCase()}</div>
                <h2>{activeCase.subtitle}</h2>
                <p className="resolution-destination">{activeCase.destination}</p>
                <div className="resolution-rule" />
                <p className="resolution-story">{activeCase.resolution}</p>
                <div className="resolution-footer">
                  <span>편지 한 통이 주소를 찾았습니다.</span>
                  <button className="ink-button" type="button" onClick={continueAfterDelivery}>{activeCase.id === CASES.length ? "마지막 편지를 받는다" : `DAY ${String(activeCase.id + 1).padStart(2, "0")} / 다음 근무`} <span>→</span></button>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {screen === "ending" && (
        <main className={`ending-screen ending-step-${endingStep} ${reduceClass}`}>
          <div className="ending-room" />
          <div className="ending-shade" />
          {endingStep === 0 && (
            <section className="ending-envelope-scene">
              <span className="eyebrow">ONE LAST CORRESPONDENCE / NO DATE</span>
              <h1>TO: ELLIOT</h1>
              <div className="final-envelope" aria-label="엘리엇에게 온 마지막 봉투">
                <span>TO</span><strong>ELLIOT</strong><small>DEAD LETTER OFFICE</small><i>NO RETURN ADDRESS</i>
                <div className="final-seal">D.L.O.</div>
              </div>
              <button className="final-step-button" type="button" onClick={() => handleEndingStep(1)}>봉투를 연다 <span>↗</span></button>
            </section>
          )}
          {endingStep === 1 && (
            <section className="final-letter-scene">
              <span className="eyebrow">FROM: A. VALE / TO: ELLIOT</span>
              <div className="final-letter-sheet">
                <span className="paper-label">늦게 도착한 편지</span>
                <p>엘리엇에게,</p>
                <h1>늦어서 미안해.</h1>
                <p>다른 이들의 편지를 오래 전해 준 네게,<br />내가 직접 이 말을 건네고 싶었단다.</p>
                <span className="final-letter-signature">엄마가</span>
                <span className="final-postmark">NO DATE / NEVER RETURNED</span>
              </div>
              <button className="final-step-button" type="button" onClick={() => handleEndingStep(2)}>기억이 돌아온다 <span>→</span></button>
            </section>
          )}
          {endingStep === 2 && (
            <section className="ending-memory-scene">
              <div className="ending-memory-art" />
              <div className="ending-memory-shade" />
              <span className="eyebrow">THE FIRST LETTER / A MEMORY</span>
              <blockquote>"언젠가 꼭 전달될 거야."</blockquote>
              <p>어머니가 웃는다. 어린 엘리엇은 편지를 두 손으로 꼭 쥔다.</p>
              <button className="final-step-button" type="button" onClick={() => handleEndingStep(3)}>우편국으로 돌아온다 <span>→</span></button>
            </section>
          )}
          {endingStep === 3 && (
            <section className="final-room-scene">
              <div className="final-room-vignette" />
              <img className="ending-elliot" src="/images/elliot.png" alt="편지를 든 엘리엇" />
              <div className="final-flower" aria-label="창가에 핀 작은 노란 꽃"><i /><b /><span /><em /></div>
              <div className="final-room-copy">
                <span className="eyebrow">THE LAST DELIVERY</span>
                <p>어떤 편지는 늦게 도착할 뿐,<br />결코 늦은 것이 아니다.</p>
                <button className="final-step-button" type="button" onClick={() => handleEndingStep(4)}>기록을 남긴다 <span>→</span></button>
              </div>
            </section>
          )}
          {endingStep >= 4 && (
            <section className="credits-scene">
              <span className="eyebrow">DEAD LETTER OFFICE</span>
              <h1>어떤 편지는 늦게 도착할 뿐,<br />결코 늦은 것이 아니다.</h1>
              <div className="credits-rule" />
              <p>이야기를 읽어 주셔서 감사합니다.</p>
              <span className="credits-credit">A STORY ABOUT THE THINGS WE NEVER SENT</span>
              <button className="final-step-button" type="button" onClick={() => { updateSave((current) => ({ ...current, endingSeen: true })); returnToTitle(); }}>제목 화면으로 <span>→</span></button>
            </section>
          )}
        </main>
      )}

      {screen === "title" && overlay === "archive" && <ArchiveDialog save={save} onClose={() => setOverlay("none")} />}
      {screen === "title" && overlay === "settings" && <SettingsDialog settings={settings} onChange={setSettings} onClose={() => setOverlay("none")} />}
      {screen === "title" && overlay === "restart" && (
        <div className="modal-veil">
          <section className="pause-window restart-window" role="dialog" aria-modal="true" aria-label="새 근무 확인">
            <span className="eyebrow">UNFILED / NEW SHIFT</span>
            <h2>처음부터 다시 시작할까요?</h2>
            <p>지금까지의 기록은 새 근무를 시작하면 덮어씌워집니다. 보관함은 다시 비워집니다.</p>
            <div className="confirm-actions">
              <button className="plain-action" type="button" onClick={() => setOverlay("none")}>돌아가기</button>
              <button className="ink-button" type="button" onClick={beginFreshShift}>새 근무를 시작한다 <span>→</span></button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;