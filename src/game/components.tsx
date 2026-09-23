import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { CASES, ROUTES, type CaseClue, type CaseFile, type Route } from "./cases";
import type { GameSave, GameSettings } from "./save";

type LetterViewerProps = {
  caseFile: CaseFile;
  initialOpen: boolean;
  arrival: boolean;
  onContinue: () => void;
};

export function LetterViewer({ caseFile, initialOpen, arrival, onContinue }: LetterViewerProps) {
  const [opened, setOpened] = useState(initialOpen);
  const [pageIndex, setPageIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0, turn: -1.5 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    setOpened(initialOpen);
    setPageIndex(0);
    setSide("front");
    setZoom(1);
    setOffset({ x: 0, y: 0, turn: -1.5 });
    setIsDragging(false);
    pointers.current.clear();
    pinch.current = null;
  }, [caseFile.id, initialOpen]);

  const letter = caseFile.letters[pageIndex];

  function movePage(direction: number) {
    setPageIndex((current) => (current + direction + caseFile.letters.length) % caseFile.letters.length);
    setSide("front");
    setOffset({ x: 0, y: 0, turn: -1.5 });
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragRef.current = { x: event.clientX, y: event.clientY };
    gestureStart.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size > 1) {
      const points = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), zoom };
      dragRef.current = null;
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size > 1 && pinch.current) {
      const points = [...pointers.current.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      setZoom(Math.max(0.78, Math.min(1.24, pinch.current.zoom * (distance / pinch.current.distance))));
      return;
    }
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setOffset((current) => ({
      x: Math.max(-112, Math.min(112, current.x + dx)),
      y: Math.max(-72, Math.min(72, current.y + dy)),
      turn: Math.max(-5, Math.min(5, current.turn + dx * 0.025)),
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const start = gestureStart.current;
    const wasPinching = Boolean(pinch.current);
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!wasPinching && start && Math.abs(event.clientX - start.x) > 125) {
      if (caseFile.letters.length > 1) movePage(event.clientX < start.x ? 1 : -1);
      else setSide((current) => current === "front" ? "back" : "front");
    }
    dragRef.current = null;
    gestureStart.current = null;
    setIsDragging(false);
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    event.preventDefault();
    setZoom((value) => Math.max(0.78, Math.min(1.24, value + (event.deltaY < 0 ? 0.06 : -0.06))));
  }

  return (
    <div className={`modal-veil letter-veil ${arrival ? "arrival-veil" : ""}`}>
      <section className="letter-window" role="dialog" aria-modal="true" aria-label="도착한 편지">
        <header className="letter-window-head">
          <div>
            <span className="eyebrow">INCOMING CORRESPONDENCE / {String(caseFile.id).padStart(2, "0")}</span>
            <h2>{arrival ? "오늘 도착한 편지" : "편지 다시 읽기"}</h2>
          </div>
          {!arrival && (
            <button className="ink-close" type="button" onClick={onContinue} aria-label="편지 닫기">
              <span aria-hidden="true">×</span>
            </button>
          )}
        </header>

        <div className="letter-handling-area">
          {!opened ? (
            <div className="envelope-object">
              <div className="envelope-grain" />
              <div className="envelope-flap" />
              <div className="envelope-address">
                <span>TO</span>
                <strong>{letter.to}</strong>
                <small>{letter.address}</small>
              </div>
              <div className="envelope-seal" aria-hidden="true">D.L.O.</div>
              <span className="envelope-postmark">{letter.seal}</span>
              <button className="open-envelope" type="button" onClick={() => setOpened(true)}>
                봉투를 연다 <span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : (
            <div
              className={`paper-mat ${side === "back" ? "paper-turning" : ""} ${isDragging ? "paper-dragging" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.turn}deg) scale(${zoom})`,
              }}
            >
              <article className={`letter-sheet ${side === "back" ? "letter-back" : ""}`}>
                <div className="paper-corner paper-corner-a" />
                <div className="paper-corner paper-corner-b" />
                {side === "front" ? (
                  <>
                    <div className="letter-paper-topline">
                      <span>죽은 자의 우편국</span>
                      <span>DEAD LETTER OFFICE</span>
                    </div>
                    <div className="postage-mark" aria-label={`우편 도장 ${letter.seal}`}>
                      <span>{letter.seal.split(" · ")[0]}</span>
                      <strong>{letter.date.slice(-2)}</strong>
                    </div>
                    <div className="letter-address-block">
                      <span className="paper-label">TO / 받는 사람</span>
                      <strong>{letter.to}</strong>
                      <p>{letter.address}</p>
                    </div>
                    <div className="letter-from-line">
                      <span>FROM / {letter.from}</span>
                      <span>{letter.date}</span>
                    </div>
                    <div className="letter-body-copy">
                      {letter.body.map((line, index) => (
                        <p key={`${index}-${line}`}>{line}</p>
                      ))}
                    </div>
                    <div className="letter-signature">{letter.from.split(" ")[0]}.</div>
                    <div className="letter-rule" />
                    <span className="paper-foot">이 편지는 아직 전달되지 않았습니다.</span>
                  </>
                ) : (
                  <div className="letter-reverse-copy">
                    <div className="letter-paper-topline">
                      <span>봉투 뒷면의 메모</span>
                      <span>OPENED AT THE OFFICE</span>
                    </div>
                    <div className="reverse-rule" />
                    <p>{letter.reverse}</p>
                    <span className="reverse-postmark">{letter.seal}</span>
                    <div className="reverse-stamp" aria-hidden="true">UNDELIVERED</div>
                  </div>
                )}
              </article>
            </div>
          )}
        </div>

        <footer className="letter-window-foot">
          <div className="letter-tools">
            {opened && (
              <>
                <div className="page-turner" aria-label="확인할 편지">
                  {caseFile.letters.length > 1 && (
                    <>
                      <button type="button" onClick={() => movePage(-1)} aria-label="이전 편지">‹</button>
                      <span>{pageIndex + 1} / {caseFile.letters.length}</span>
                      <button type="button" onClick={() => movePage(1)} aria-label="다음 편지">›</button>
                    </>
                  )}
                </div>
                <button className="paper-tool" type="button" onClick={() => setSide(side === "front" ? "back" : "front")}>
                  편지 뒤집기 <span aria-hidden="true">↻</span>
                </button>
                <div className="zoom-tools" aria-label="확대 조절">
                  <button type="button" onClick={() => setZoom((value) => Math.max(0.78, value - 0.08))}>−</button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button type="button" onClick={() => setZoom((value) => Math.min(1.24, value + 0.08))}>+</button>
                </div>
              </>
            )}
          </div>
          <button className="ink-button letter-continue" type="button" disabled={!opened} onClick={onContinue}>
            {arrival ? "책상에 놓고 조사한다" : "책상으로 돌아가기"}
            <span aria-hidden="true">→</span>
          </button>
        </footer>
        <div className="gesture-hint">{opened ? "종이를 끌어 옮기고, 휠 또는 두 손가락으로 확대하세요." : "봉투를 눌러 열어 보세요."}</div>
      </section>
    </div>
  );
}

type InspectDialogProps = {
  objectId: string;
  caseId: number;
  title: string;
  location: string;
  description: string;
  pages?: string[];
  clue: CaseClue;
  alreadyFound: boolean;
  onCollect: () => void;
  onClose: () => void;
};

export function InspectDialog({ objectId, caseId, title, location, description, pages, clue, alreadyFound, onCollect, onClose }: InspectDialogProps) {
  const [page, setPage] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragPoint = useRef<{ x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const hasImage = objectId.includes("photo") || objectId.includes("drawing");
  const isDrawing = objectId.includes("drawing");

  useEffect(() => {
    setPage(0);
    setFlipped(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [objectId]);

  function handleObjectDown(event: PointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size > 1) {
      const points = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), zoom };
      dragPoint.current = null;
      return;
    }
    dragPoint.current = { x: event.clientX, y: event.clientY };
  }

  function handleObjectMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size > 1 && pinch.current) {
      const points = [...pointers.current.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      setZoom(Math.max(0.82, Math.min(1.7, pinch.current.zoom * (distance / pinch.current.distance))));
      return;
    }
    if (!dragPoint.current) return;
    const dx = event.clientX - dragPoint.current.x;
    const dy = event.clientY - dragPoint.current.y;
    dragPoint.current = { x: event.clientX, y: event.clientY };
    setPan((current) => ({ x: Math.max(-90, Math.min(90, current.x + dx)), y: Math.max(-65, Math.min(65, current.y + dy)) }));
  }

  function handleObjectUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    dragPoint.current = null;
  }

  function handleObjectWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoom((current) => Math.max(0.82, Math.min(1.7, current + (event.deltaY < 0 ? 0.09 : -0.09))));
  }

  function turnPage(direction: number) {
    if (!pages?.length) return;
    setPage((current) => (current + direction + pages.length) % pages.length);
  }

  return (
    <div className="modal-veil" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="evidence-reveal" role="dialog" aria-modal="true" aria-label={`${title} 조사`}>
        <button className="ink-close" type="button" onClick={onClose} aria-label="조사 창 닫기"><span>×</span></button>
        <span className="eyebrow">OBJECT / {location}</span>
        <h2>{title}</h2>
        <p className="inspect-description">{description}</p>
        {hasImage && (
          <div className={`object-evidence-view ${isDrawing ? "object-drawing" : ""}`}>
            <div
              className={`object-visual ${flipped ? "object-visual-back" : ""}`}
              onPointerDown={handleObjectDown}
              onPointerMove={handleObjectMove}
              onPointerUp={handleObjectUp}
              onPointerCancel={handleObjectUp}
              onWheel={handleObjectWheel}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                backgroundImage: !isDrawing && !flipped ? `url(${caseId === 5 ? "/images/last-memory.jpg" : "/images/dead-letter-office.jpg"})` : undefined,
              }}
              role="img"
              aria-label={flipped ? "사진 뒷면 메모" : isDrawing ? "아이의 그림" : "오래된 흑백 사진"}
            >
              {isDrawing && !flipped ? (
                <div className="moon-house-drawing" aria-hidden="true"><i /><b /><span /><em /></div>
              ) : flipped ? (
                <div className="photo-back-copy"><small>PHOTO / REVERSE</small><p>{clue.excerpt}</p><span>................................</span></div>
              ) : (
                <span className="photo-negative-label">{caseId === 5 ? "VALE FAMILY / 19—" : "UNFILED / 10.12"}</span>
              )}
            </div>
            <div className="object-image-tools">
              <button type="button" onClick={() => setFlipped((value) => !value)}>뒤집기 <span>↻</span></button>
              <div><button type="button" onClick={() => setZoom((value) => Math.max(.82, value - .12))}>−</button><small>{Math.round(zoom * 100)}%</small><button type="button" onClick={() => setZoom((value) => Math.min(1.7, value + .12))}>+</button></div>
            </div>
          </div>
        )}
        {pages && pages.length > 0 && (
          <div className="archive-page-turn">
            <div className="archive-page-copy" key={`${objectId}-${page}`}><span className="paper-label">PAGE {String(page + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</span><p>{pages[page]}</p></div>
            <div className="archive-page-tools"><button type="button" onClick={() => turnPage(-1)} aria-label="이전 페이지">‹</button><span>{page + 1} / {pages.length}</span><button type="button" onClick={() => turnPage(1)} aria-label="다음 페이지">›</button></div>
          </div>
        )}
        <div className={`evidence-slip ${alreadyFound ? "slip-filed" : ""}`}>
          <span className="paper-label">{alreadyFound ? "이미 보관한 단서" : "자세히 살펴본다"}</span>
          <h3>{clue.title}</h3>
          <p>{clue.excerpt}</p>
          <div className="evidence-pencil" aria-hidden="true">........................................</div>
        </div>
        <footer className="inspect-actions">
          <button className="plain-action" type="button" onClick={onClose}>그 자리에 둔다</button>
          <button className="ink-button" type="button" onClick={alreadyFound ? onClose : onCollect}>
            {alreadyFound ? "다시 책상으로" : "증거 서랍에 보관"}
            <span aria-hidden="true">→</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

type EvidenceBoardProps = {
  caseFile: CaseFile;
  clues: CaseClue[];
  discovered: string[];
  deduced: boolean;
  onConnect: () => void;
  onClose: () => void;
};

export function EvidenceBoard({ caseFile, clues, discovered, deduced, onConnect, onClose }: EvidenceBoardProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(deduced);
  const [connecting, setConnecting] = useState(false);

  const available = clues.filter((clue) => discovered.includes(clue.id));

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return [current[1], id];
      return [...current, id];
    });
    if (!deduced) setRevealed(false);
  }

  function connect() {
    setConnecting(true);
    onConnect();
    window.setTimeout(() => {
      setRevealed(true);
      setConnecting(false);
    }, 680);
  }

  return (
    <div className="modal-veil" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="evidence-board-window" role="dialog" aria-modal="true" aria-label="단서 비교">
        <header className="evidence-board-head">
          <div>
            <span className="eyebrow">CASE {String(caseFile.id).padStart(2, "0")} / FIELD NOTES</span>
            <h2>단서를 맞대어 본다</h2>
          </div>
          <button className="ink-close" type="button" onClick={onClose} aria-label="단서창 닫기"><span>×</span></button>
        </header>
        <div className="evidence-board-copy">서로 다른 두 장을 고르세요. 종이에 남은 흔적이 이어질지도 모릅니다.</div>
        <div className={`evidence-table ${selected.length === 2 && connecting ? "has-link" : ""}`}>
          <svg className="ink-connection" viewBox="0 0 600 230" preserveAspectRatio="none" aria-hidden="true">
            <path d="M78 96 C178 8 392 214 520 76" />
          </svg>
          <div className="evidence-list">
            {available.map((clue, index) => (
              <button
                className={`clue-leaf ${selected.includes(clue.id) ? "clue-selected" : ""}`}
                type="button"
                key={clue.id}
                onClick={() => toggle(clue.id)}
              >
                <span className="clue-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="clue-copy">
                  <strong>{clue.title}</strong>
                  <small>{clue.excerpt}</small>
                </span>
                <span className="clue-mark" aria-hidden="true">{selected.includes(clue.id) ? "×" : "+"}</span>
              </button>
            ))}
          </div>
          <div className={`connection-reveal ${revealed ? "connection-visible" : ""}`} aria-live="polite">
            {revealed ? (
              <>
                <span className="paper-label">INK REVELATION / {caseFile.date}</span>
                <h3>{caseFile.insightTitle}</h3>
                <p>{caseFile.insight}</p>
                <span className="connection-glyph" aria-hidden="true">+</span>
              </>
            ) : (
              <div className="connection-empty">{selected.length === 2 ? "두 기록을 잇는다" : "두 개의 기록을 선택하세요"}</div>
            )}
          </div>
        </div>
        <footer className="evidence-board-foot">
          <span className="hand-note">{selected.length}/2 기록 선택</span>
          {(!deduced || connecting) && (
            <button className="ink-button" type="button" disabled={selected.length !== 2 || connecting} onClick={connect}>
              잉크로 연결한다 <span aria-hidden="true">↗</span>
            </button>
          )}
          {deduced && !connecting && (
            <button className="ink-button" type="button" onClick={onClose}>
              편지를 분류한다 <span aria-hidden="true">→</span>
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

type RouteDialogProps = {
  caseFile: CaseFile;
  onDispatch: (route: Route) => void;
  onClose: () => void;
  playStamp: () => void;
};

export function RouteDialog({ caseFile, onDispatch, onClose, playStamp }: RouteDialogProps) {
  const [selected, setSelected] = useState<Route | null>(null);
  const [stamped, setStamped] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  function choose(route: Route) {
    setSelected(route);
    setStamped(false);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragging.current = true;
    setDragPosition({ x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (dragging.current) setDragPosition({ x: event.clientX, y: event.clientY });
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (dragging.current) {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drop-route]");
      const route = target?.dataset.dropRoute as Route | undefined;
      if (route) choose(route);
    }
    dragging.current = false;
    setDragPosition(null);
  }

  function stamp() {
    if (!selected) return;
    playStamp();
    setStamped(true);
  }

  const stampText = ROUTES.find((route) => route.id === selected)?.stamp;

  return (
    <div className="modal-veil" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dispatch-window" role="dialog" aria-modal="true" aria-label="편지 분류 및 발송">
        <header className="dispatch-head">
          <div>
            <span className="eyebrow">FINAL ROUTING / CASE {String(caseFile.id).padStart(2, "0")}</span>
            <h2>어디로 보내야 할까</h2>
            <p>{caseFile.letters.length > 1 ? "두 통의 편지를 함께 들어 분류하세요." : "편지를 끌어 알맞은 분류함에 놓으세요."}</p>
          </div>
          <button className="ink-close" type="button" onClick={onClose} aria-label="분류창 닫기"><span>×</span></button>
        </header>
        <div className="sorting-table">
          <div className="sort-letter-column">
            <button
              className={`sort-letter ${dragging.current ? "sort-letter-lifted" : ""}`}
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="편지를 눌러 분류함으로 끌기"
            >
              <span className="sort-letter-code">DEAD LETTER OFFICE</span>
              <strong>{caseFile.letters.length > 1 ? "2 LETTERS" : caseFile.letters[0].to}</strong>
              <small>{caseFile.letters[0].address}</small>
              <span className="sort-letter-fold" />
            </button>
            <span className="drag-instruction">편지를 끌거나 분류함을 누르세요</span>
          </div>
          <div className="sort-zones">
            {ROUTES.map((route) => (
              <button
                className={`sort-zone ${selected === route.id ? "sort-zone-selected" : ""}`}
                type="button"
                key={route.id}
                data-drop-route={route.id}
                onClick={() => choose(route.id)}
                aria-pressed={selected === route.id}
              >
                <span className="sort-zone-no">{route.stamp.slice(0, 1)}</span>
                <strong>{route.stamp}</strong>
                <small>{route.note}</small>
                {selected === route.id && stamped && <span className="zone-ink">{route.stamp}</span>}
              </button>
            ))}
          </div>
          {dragPosition && (
            <div className="drag-ghost" style={{ left: dragPosition.x, top: dragPosition.y }} aria-hidden="true">
              {caseFile.letters.length > 1 ? "2 LETTERS" : caseFile.letters[0].to}
            </div>
          )}
        </div>
        <footer className="dispatch-foot">
          <span className="hand-note">{selected ? `선택한 분류: ${ROUTES.find((route) => route.id === selected)?.name}` : "아직 도장을 찍지 않았습니다."}</span>
          <div className="stamp-action-area">
            {selected && !stamped && (
              <button className="stamp-control" type="button" onClick={stamp}>
                <span className="stamp-handle" />
                <span className="stamp-imprint">{stampText}</span>
                <small>도장을 눌러 찍는다</small>
              </button>
            )}
            {selected && stamped && (
              <button className="ink-button dispatch-send" type="button" onClick={() => onDispatch(selected)}>
                편지를 보낸다 <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}

type MemorySceneProps = {
  caseFile: CaseFile;
  reduceMotion: boolean;
  onContinue: () => void;
};

export function MemoryScene({ caseFile, reduceMotion, onContinue }: MemorySceneProps) {
  return (
    <div className={`memory-scene memory-case-${caseFile.id} ${caseFile.id === 5 ? "memory-final" : ""} ${reduceMotion ? "motion-reduced" : ""}`}>
      <div className="memory-art" />
      <div className="memory-ink-wash" />
      {caseFile.id === 5 ? (
        <div className="memory-caption memory-caption-final">
          <span className="eyebrow">A MEMORY / THE FIRST LETTER</span>
          <h2>{caseFile.memoryTitle}</h2>
          <p>"언젠가 꼭 전달될 거야."</p>
          <button className="memory-continue" type="button" onClick={onContinue}>그날의 기억에서 돌아온다 <span>→</span></button>
        </div>
      ) : (
        <div className="memory-caption">
          <span className="eyebrow">A MEMORY / {String(caseFile.id).padStart(2, "0")}</span>
          <h2>{caseFile.memoryTitle}</h2>
          <p>{caseFile.memoryLine}</p>
          <button className="memory-continue" type="button" onClick={onContinue}>현재로 돌아온다 <span>→</span></button>
        </div>
      )}
      <div className="memory-frame-line" />
    </div>
  );
}

type ArchiveDialogProps = {
  save: GameSave;
  onClose: () => void;
};

type ArchiveItem = {
  key: string;
  caseId: number;
  title: string;
  kind: string;
  body: string;
};

export function ArchiveDialog({ save, onClose }: ArchiveDialogProps) {
  const [tab, setTab] = useState<"letters" | "clues" | "memories">("letters");
  const [selected, setSelected] = useState("");

  const items: ArchiveItem[] = CASES.flatMap((caseFile) => {
    const hasProgress = save.completed.includes(caseFile.id)
      || (save.discovered[String(caseFile.id)]?.length ?? 0) > 0
      || (save.currentCase === caseFile.id && save.started && save.phase === "investigation");
    if (tab === "letters") {
      if (!hasProgress) return [];
      return caseFile.letters.map((letter, index) => ({
        key: `letter-${caseFile.id}-${index}`,
        caseId: caseFile.id,
        title: caseFile.letters.length > 1 ? `${letter.from} → ${letter.to}` : caseFile.subtitle,
        kind: `편지 / ${letter.date}`,
        body: `${letter.body.join("\n\n")}\n\n[뒷면] ${letter.reverse}`,
      }));
    }
    if (tab === "memories") {
      if (!save.memories.includes(`memory-${caseFile.id}`)) return [];
      return [{
        key: `memory-${caseFile.id}`,
        caseId: caseFile.id,
        title: caseFile.memoryTitle,
        kind: "기억 / 잉크 번짐",
        body: caseFile.memoryLine,
      }];
    }
    const known = save.discovered[String(caseFile.id)] ?? [];
    return known.map((id) => {
      const clue = caseFile.objects.map((object) => object.clue).find((item) => item.id === id);
      return {
        key: id,
        caseId: caseFile.id,
        title: clue?.title ?? "돌아온 편지의 메모",
        kind: `단서 / ${caseFile.subtitle}`,
        body: clue?.excerpt ?? caseFile.returnedNote,
      };
    });
  });

  const activeItem = items.find((item) => item.key === selected) ?? items[0];

  useEffect(() => {
    if (!items.some((item) => item.key === selected)) setSelected(items[0]?.key ?? "");
  }, [items, selected]);

  return (
    <div className="modal-veil archive-veil">
      <section className="archive-window" role="dialog" aria-modal="true" aria-label="보관함">
        <header className="archive-head">
          <div>
            <span className="eyebrow">DEAD LETTER OFFICE / RECORDS</span>
            <h2>기억 보관함</h2>
          </div>
          <button className="ink-close" type="button" onClick={onClose} aria-label="보관함 닫기"><span>×</span></button>
        </header>
        <nav className="archive-tabs" aria-label="보관함 분류">
          <button type="button" className={tab === "letters" ? "archive-tab-active" : ""} onClick={() => setTab("letters")}>편지 <span>01</span></button>
          <button type="button" className={tab === "clues" ? "archive-tab-active" : ""} onClick={() => setTab("clues")}>단서 <span>02</span></button>
          <button type="button" className={tab === "memories" ? "archive-tab-active" : ""} onClick={() => setTab("memories")}>기억 <span>03</span></button>
        </nav>
        <div className="archive-body">
          <div className="archive-index">
            {items.length === 0 ? (
              <p className="archive-empty">아직 서랍 안에 넣을 기록이 없습니다.</p>
            ) : items.map((item, index) => (
              <button
                type="button"
                key={item.key}
                className={`archive-record ${activeItem?.key === item.key ? "archive-record-active" : ""}`}
                onClick={() => setSelected(item.key)}
              >
                <span className="record-index">{String(index + 1).padStart(2, "0")}</span>
                <span><small>CASE {String(item.caseId).padStart(2, "0")}</small><strong>{item.title}</strong></span>
                <span className="record-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <article className="archive-document">
            {activeItem ? (
              <>
                <span className="paper-label">{activeItem.kind} / {String(activeItem.caseId).padStart(2, "0")}</span>
                <h3>{activeItem.title}</h3>
                <div className="archive-rule" />
                <p>{activeItem.body}</p>
                <span className="archive-signature">FILED IN THE DEAD LETTER OFFICE</span>
              </>
            ) : (
              <div className="archive-blank">
                <span aria-hidden="true">+</span>
                <p>누군가의 이야기를 전달하면<br />이곳에 기록이 남습니다.</p>
              </div>
            )}
          </article>
        </div>
        <footer className="archive-foot"><span>자동 저장됨 / {save.completed.length}개의 사건 기록</span><button className="plain-action" type="button" onClick={onClose}>우편국으로 돌아가기</button></footer>
      </section>
    </div>
  );
}

type SettingsDialogProps = {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onClose: () => void;
};

export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  return (
    <div className="modal-veil" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-window" role="dialog" aria-modal="true" aria-label="설정">
        <span className="eyebrow">OFFICE PREFERENCES</span>
        <button className="ink-close" type="button" onClick={onClose} aria-label="설정 닫기"><span>×</span></button>
        <h2>우편국 설정</h2>
        <p className="settings-intro">조용한 근무를 위한 환경을 정합니다.</p>
        <label className="setting-row">
          <span><strong>환경음과 효과음</strong><small>빗소리, 시계, 종이와 도장 소리</small></span>
          <input type="checkbox" checked={settings.sound} onChange={(event) => onChange({ ...settings, sound: event.target.checked })} />
        </label>
        <label className="setting-row">
          <span><strong>움직임 줄이기</strong><small>화면 전환과 배경 움직임을 낮춥니다.</small></span>
          <input type="checkbox" checked={settings.reduceMotion} onChange={(event) => onChange({ ...settings, reduceMotion: event.target.checked })} />
        </label>
        <button className="ink-button settings-close" type="button" onClick={onClose}>설정을 저장한다 <span>→</span></button>
      </section>
    </div>
  );
}

export function makeReturnClue(caseFile: CaseFile): CaseClue {
  return {
    id: `case${caseFile.id}-return`,
    title: "반송 봉투의 메모",
    excerpt: caseFile.returnedNote,
  };
}

export function routeForCase(route: Route): string {
  return ROUTES.find((item) => item.id === route)?.name ?? "보류";
}