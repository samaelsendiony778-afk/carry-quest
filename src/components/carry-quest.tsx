import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Delete,
  Heart,
  Lightbulb,
  Star,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { messages } from "@/game/copy";
import {
  breakdown,
  LEARN,
  makeChallenge,
  PRACTICE,
  starsFor,
  type Break,
  type Problem,
} from "@/game/math";
import { setMuted, sfx, unlockAudio } from "@/game/sound";
import { defaultSave, loadSave, writeSave, type Save } from "@/game/storage";

type Mode = "learn" | "practice" | "challenge";
type Step = "arrange" | "ones" | "place" | "tens" | "celebrate";
type Screen = "home" | "play" | "done";
type Slot = "carry" | "ones";

type Result = { problem: Problem; stars: number; correct: boolean };

type Round = {
  mode: Mode;
  problems: Problem[];
  index: number;
  step: Step;
  typed: string;
  placedCarry: boolean;
  placedOnes: boolean;
  picked: Slot | null;
  misses: number;
  helped: boolean;
  failed: boolean;
  lives: number;
  score: number;
  combo: number;
  bestCombo: number;
  note: string | null;
  noteTone: "good" | "bad" | "info";
  shake: boolean;
  showWhy: boolean;
  results: Result[];
};

function freshRound(mode: Mode): Round {
  const problems = mode === "learn" ? [LEARN] : mode === "practice" ? PRACTICE : makeChallenge(8);
  return {
    mode,
    problems,
    index: 0,
    step: mode === "learn" ? "arrange" : "ones",
    typed: "",
    placedCarry: false,
    placedOnes: false,
    picked: null,
    misses: 0,
    helped: false,
    failed: false,
    lives: 3,
    score: 0,
    combo: 0,
    bestCombo: 0,
    note: null,
    noteTone: "info",
    shake: false,
    showWhy: false,
    results: [],
  };
}

export function CarryQuest() {
  const [save, setSave] = useState<Save>(defaultSave);
  const [screen, setScreen] = useState<Screen>("home");
  const [round, setRound] = useState<Round | null>(null);
  const nonce = useRef(0);
  const timer = useRef<number | null>(null);

  const lang = save.lang;
  const t = messages(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    const loaded = loadSave();
    setSave(loaded);
    setMuted(loaded.muted);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function persist(next: Save) {
    setSave(next);
    writeSave(next);
  }

  function later(ms: number, fn: () => void) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  }

  function toggleLang() {
    persist({ ...save, lang: save.lang === "ar" ? "en" : "ar" });
  }

  function toggleMute() {
    const muted = !save.muted;
    setMuted(muted);
    persist({ ...save, muted });
    if (!muted) sfx("tap");
  }

  function begin(mode: Mode) {
    unlockAudio();
    sfx("tap");
    nonce.current += 1;
    setRound(freshRound(mode));
    setScreen("play");
  }

  function goHome() {
    nonce.current += 1;
    setScreen("home");
  }

  const problem = round ? round.problems[round.index] : null;
  const math: Break | null = problem ? breakdown(problem.n, problem.m) : null;

  function pushDigit(digit: string) {
    setRound((r) => {
      if (!r || r.step === "place" || r.step === "celebrate" || r.step === "arrange") return r;
      return { ...r, typed: (r.typed + digit).slice(0, 2) };
    });
    sfx("tap");
  }

  function backspace() {
    setRound((r) => {
      if (!r || r.typed.length === 0) return r;
      return { ...r, typed: r.typed.slice(0, -1) };
    });
  }

  function miss(r: Round, note: string): Round {
    const misses = r.misses + 1;
    const lives = r.mode === "challenge" ? r.lives - 1 : r.lives;
    const failed = r.mode === "challenge" && lives <= 0;
    return {
      ...r,
      misses,
      lives,
      combo: 0,
      helped: r.helped || misses >= 2,
      failed,
      typed: "",
      shake: true,
      note,
      noteTone: "bad",
      step: failed ? "celebrate" : r.step,
      showWhy: failed ? true : r.showWhy,
    };
  }

  function submit() {
    if (!round || !math) return;
    if (round.step === "arrange") {
      sfx("ok");
      setRound({ ...round, step: "ones", note: null });
      return;
    }
    if (round.step === "celebrate") {
      advance();
      return;
    }
    if (round.step === "place") return;
    const value = Number(round.typed);
    if (round.typed === "" || Number.isNaN(value)) return;

    if (round.step === "ones") {
      if (value !== math.onesProd) {
        sfx("no");
        const reveal = round.misses + 1 >= 2;
        setRound(miss(round, t.onesWrong(math.ones, problem!.m, math.onesProd, reveal)));
        later(420, () => setRound((r) => (r ? { ...r, shake: false } : r)));
        return;
      }
      sfx("ok");
      const auto = round.mode === "challenge";
      setRound({
        ...round,
        step: "place",
        typed: "",
        placedCarry: auto,
        placedOnes: auto,
        picked: null,
        note: auto ? null : t.placePrompt(math.onesProd, math.carry, math.onesDigit),
        noteTone: "info",
        showWhy: round.mode === "learn",
        shake: false,
      });
      if (auto) {
        const stamp = nonce.current;
        later(640, () => {
          if (nonce.current !== stamp) return;
          setRound((r) => (r && r.step === "place" ? { ...r, step: "tens", note: null, showWhy: false } : r));
        });
      }
      return;
    }

    if (value !== math.tensSum) {
      sfx("no");
      const reveal = round.misses + 1 >= 2;
      setRound(
        miss(
          round,
          t.tensWrong(math.tens, problem!.m, math.tens * problem!.m, math.carry, math.tensSum, reveal),
        ),
      );
      later(420, () => setRound((r) => (r ? { ...r, shake: false } : r)));
      return;
    }
    sfx("ok");
    setRound({
      ...round,
      step: "celebrate",
      note: null,
      noteTone: "good",
      shake: false,
    });
    if (round.mode === "challenge") {
      const stamp = nonce.current;
      later(880, () => {
        if (nonce.current === stamp) advance();
      });
    }
  }

  function tapToken(slot: Slot) {
    if (!round || round.step !== "place" || round.mode === "challenge") return;
    if ((slot === "carry" && round.placedCarry) || (slot === "ones" && round.placedOnes)) return;
    sfx("tap");
    setRound({ ...round, picked: slot });
  }

  function tapSlot(slot: Slot) {
    if (!round || !math || round.step !== "place" || round.mode === "challenge") return;
    if ((slot === "carry" && round.placedCarry) || (slot === "ones" && round.placedOnes)) return;
    if (!round.picked) {
      setRound({ ...round, note: t.pick, noteTone: "info" });
      return;
    }
    if (round.picked !== slot) {
      sfx("no");
      setRound({ ...miss(round, t.placeWrong), step: "place", failed: false, lives: round.lives });
      later(420, () => setRound((r) => (r ? { ...r, shake: false } : r)));
      return;
    }
    const placedCarry = slot === "carry" ? true : round.placedCarry;
    const placedOnes = slot === "ones" ? true : round.placedOnes;
    sfx("fly");
    const both = placedCarry && placedOnes;
    setRound({
      ...round,
      placedCarry,
      placedOnes,
      picked: null,
      note: both ? t.placed : round.note,
      noteTone: both ? "good" : round.noteTone,
      shake: false,
    });
    if (both) {
      const stamp = nonce.current;
      later(480, () => {
        if (nonce.current !== stamp) return;
        setRound((r) => (r && r.step === "place" ? { ...r, step: "tens", note: null, showWhy: false } : r));
      });
    }
  }

  function help() {
    if (!round || !math || round.step === "celebrate" || round.step === "arrange") return;
    sfx("tap");
    if (round.step === "ones") {
      setRound({
        ...round,
        helped: true,
        typed: String(math.onesProd),
        note: t.onesWrong(math.ones, problem!.m, math.onesProd, true),
        noteTone: "info",
        showWhy: true,
      });
      return;
    }
    if (round.step === "place") {
      setRound({
        ...round,
        helped: true,
        placedCarry: true,
        placedOnes: true,
        picked: null,
        showWhy: true,
        note: t.placed,
        noteTone: "info",
      });
      const stamp = nonce.current;
      later(480, () => {
        if (nonce.current !== stamp) return;
        setRound((r) => (r && r.step === "place" ? { ...r, step: "tens", note: null, showWhy: false } : r));
      });
      return;
    }
    setRound({
      ...round,
      helped: true,
      typed: String(math.tensSum),
      note: t.tensWrong(math.tens, problem!.m, math.tens * problem!.m, math.carry, math.tensSum, true),
      noteTone: "info",
    });
  }

  function advance() {
    if (!round || !problem) return;
    nonce.current += 1;
    const stars = round.mode === "challenge" ? 0 : starsFor(round.misses, round.helped);
    const correct = !round.failed;
    const gained = round.mode === "challenge" && correct ? 10 + round.combo * 2 : 0;
    const combo = round.mode === "challenge" && correct && round.misses === 0 ? round.combo + 1 : 0;
    const score = round.score + gained;
    const bestCombo = Math.max(round.bestCombo, combo);
    const results = [...round.results, { problem, stars, correct }];

    if (round.mode === "practice") {
      const prev = save.practiceStars[problem.id] ?? 0;
      persist({ ...save, practiceStars: { ...save.practiceStars, [problem.id]: Math.max(prev, stars) } });
    }
    if (round.mode === "learn") persist({ ...save, learnDone: true });

    const finished = round.failed || round.index + 1 >= round.problems.length;
    if (finished) {
      if (round.mode === "challenge") {
        persist({ ...save, challengeBest: Math.max(save.challengeBest, score) });
      }
      setRound({ ...round, results, score, combo, bestCombo });
      setScreen("done");
      sfx("win");
      return;
    }

    setRound({
      ...round,
      results,
      score,
      combo,
      bestCombo,
      index: round.index + 1,
      step: "ones",
      typed: "",
      placedCarry: false,
      placedOnes: false,
      picked: null,
      misses: 0,
      helped: false,
      failed: false,
      note: null,
      noteTone: "info",
      shake: false,
      showWhy: false,
    });
  }

  useEffect(() => {
    if (screen !== "play" || !round) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        pushDigit(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const practiceTotal = Object.values(save.practiceStars).reduce((sum, n) => sum + n, 0);

  return (
    <main dir={dir} className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg px-4 text-ink select-none">
      {screen === "home" && (
        <HomeScreen
          t={t}
          save={save}
          practiceTotal={practiceTotal}
          onLang={toggleLang}
          onMute={toggleMute}
          onBegin={begin}
        />
      )}
      {screen === "play" && round && problem && math && (
        <PlayScreen
          t={t}
          round={round}
          problem={problem}
          math={math}
          BackIcon={BackIcon}
          onBack={goHome}
          onMute={toggleMute}
          muted={save.muted}
          onDigit={pushDigit}
          onDelete={backspace}
          onSubmit={submit}
          onToken={tapToken}
          onSlot={tapSlot}
          onHelp={help}
          onWhy={() => setRound({ ...round, showWhy: !round.showWhy })}
        />
      )}
      {screen === "done" && round && (
        <DoneScreen
          t={t}
          round={round}
          onHome={goHome}
          onAgain={() => begin(round.mode)}
          onPractice={() => begin("practice")}
          onChallenge={() => begin("challenge")}
        />
      )}
    </main>
  );
}

function HomeScreen({
  t,
  save,
  practiceTotal,
  onLang,
  onMute,
  onBegin,
}: {
  t: ReturnType<typeof messages>;
  save: Save;
  practiceTotal: number;
  onLang: () => void;
  onMute: () => void;
  onBegin: (mode: Mode) => void;
}) {
  return (
    <div className="flex flex-1 flex-col py-5 safe-bottom">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-green">{t.school}</p>
        <div className="flex gap-2">
          <IconButton label={save.lang === "ar" ? "English" : "العربية"} onClick={onLang}>
            <span className="font-digit text-sm font-extrabold">{save.lang === "ar" ? "EN" : "ع"}</span>
          </IconButton>
          <IconButton label={save.muted ? t.soundOn : t.mute} onClick={onMute}>
            {save.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </IconButton>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted">{t.grade}</p>
      <div className="mt-4 overflow-hidden rounded-card bg-surface">
        <img src="/mascot.jpg" alt={t.mascotAlt} className="mx-auto h-52 w-full object-contain" />
      </div>
      <h1 className="mt-4 text-4xl font-extrabold leading-tight">{t.title}</h1>
      <p className="mt-1 text-base leading-snug text-muted">{t.subtitle}</p>

      <div className="mt-4 rounded-card bg-surface px-4 py-3">
        <p className="text-sm font-extrabold">{t.how}</p>
        <ol className="mt-2 flex flex-col gap-1.5 text-sm font-bold">
          <li className="flex items-center gap-2">
            <StepDot n="1" /> {t.s1}
          </li>
          <li className="flex items-center gap-2">
            <StepDot n="2" /> {t.s2}
          </li>
          <li className="flex items-center gap-2">
            <StepDot n="3" /> {t.s3}
          </li>
        </ol>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <ModeButton
          icon={<BookOpen className="size-6" />}
          title={t.learn}
          blurb={t.learnBlurb}
          tone="green"
          badge={save.learnDone ? t.learned : undefined}
          onClick={() => onBegin("learn")}
        />
        <ModeButton
          icon={<Star className="size-6" />}
          title={t.practice}
          blurb={t.practiceBlurb}
          tone="teal"
          badge={practiceTotal > 0 ? t.yourStars(practiceTotal, 18) : undefined}
          onClick={() => onBegin("practice")}
        />
        <ModeButton
          icon={<Zap className="size-6" />}
          title={t.challenge}
          blurb={t.challengeBlurb}
          tone="gold"
          badge={save.challengeBest > 0 ? `${t.best}: ${save.challengeBest}` : undefined}
          onClick={() => onBegin("challenge")}
        />
      </div>
    </div>
  );
}

function PlayScreen({
  t,
  round,
  problem,
  math,
  BackIcon,
  onBack,
  onMute,
  muted,
  onDigit,
  onDelete,
  onSubmit,
  onToken,
  onSlot,
  onHelp,
  onWhy,
}: {
  t: ReturnType<typeof messages>;
  round: Round;
  problem: Problem;
  math: Break;
  BackIcon: typeof ArrowLeft;
  onBack: () => void;
  onMute: () => void;
  muted: boolean;
  onDigit: (d: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  onToken: (slot: Slot) => void;
  onSlot: (slot: Slot) => void;
  onHelp: () => void;
  onWhy: () => void;
}) {
  const prompt =
    round.step === "arrange"
      ? t.arrange
      : round.step === "ones"
        ? t.onesPrompt(math.ones, problem.m)
        : round.step === "place"
          ? t.placePrompt(math.onesProd, math.carry, math.onesDigit)
          : round.step === "tens"
            ? t.tensPrompt(math.tens, problem.m, math.carry)
            : round.failed
              ? t.out(problem.n, problem.m, math.answer)
              : t.success(problem.n, problem.m, math.answer);

  const showAnswer = round.step === "celebrate";
  const hundreds = Math.floor(math.tensSum / 10);
  const tensDigit = math.tensSum % 10;
  const typing = round.step === "ones" || round.step === "tens";

  return (
    <div className="flex flex-1 flex-col py-3 safe-bottom">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="tap flex items-center gap-1 rounded-full px-2 py-2 text-sm font-bold text-muted">
          <BackIcon className="size-5" />
          {t.back}
        </button>
        <p className="font-digit text-sm font-extrabold">
          {t.of(round.index + 1, round.problems.length)}
        </p>
        <button type="button" onClick={onMute} aria-label={muted ? t.soundOn : t.mute} className="tap rounded-full p-2 text-muted">
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        {round.mode === "challenge" ? (
          <div className="flex items-center gap-1 text-carry">
            {[0, 1, 2].map((i) => (
              <Heart key={i} className={clsx("size-5", i < round.lives ? "fill-carry" : "fill-transparent opacity-40")} />
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold text-green">{round.mode === "learn" ? t.learn : t.practice}</p>
        )}
        {round.mode === "challenge" ? (
          <p className="font-digit text-sm font-extrabold">
            {t.score} {round.score}
            {round.combo > 1 ? ` · ${t.combo} ${round.combo}` : ""}
          </p>
        ) : (
          <StarRow count={round.step === "celebrate" && !round.failed ? starsFor(round.misses, round.helped) : 0} />
        )}
      </div>

      <p className={clsx("mt-3 text-base font-extrabold leading-snug", round.step === "celebrate" && !round.failed && "text-green")}>
        {prompt}
      </p>
      {typing && (
        <p dir="ltr" className="mt-1 font-digit text-2xl font-extrabold text-teal">
          {round.step === "ones"
            ? `${math.ones} × ${problem.m} = ${round.typed || "□"}`
            : `${math.tens} × ${problem.m} + ${math.carry} = ${round.typed || "□"}`}
        </p>
      )}

      <div className={clsx("relative mt-3 rounded-card border-2 border-teal bg-surface px-3 py-4", round.shake && "anim-shake")}>
        {round.step === "celebrate" && !round.failed && (
          <div className="confetti absolute inset-x-0 top-0 h-16">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
        <Algorithm
          t={t}
          problem={problem}
          math={math}
          round={round}
          showAnswer={showAnswer}
          hundreds={hundreds}
          tensDigit={tensDigit}
          onSlot={onSlot}
        />
      </div>

      {round.note && (
        <p
          className={clsx(
            "mt-3 rounded-card px-3 py-2 text-sm font-bold leading-snug",
            round.noteTone === "good" && "bg-green-soft text-green",
            round.noteTone === "bad" && "bg-carry-soft text-carry",
            round.noteTone === "info" && "bg-teal-soft text-ink",
          )}
        >
          {round.note}
        </p>
      )}

      {(round.showWhy || round.step === "place") && round.step !== "arrange" && (
        <Bundles t={t} carry={math.carry} digit={math.onesDigit} />
      )}

      <div className="mt-auto pt-3">
        {round.step === "place" && round.mode !== "challenge" && (
          <div className="mb-3 flex justify-center gap-3" dir="ltr">
            <Token
              label={t.carry}
              value={math.carry}
              tone="carry"
              active={round.picked === "carry"}
              done={round.placedCarry}
              onClick={() => onToken("carry")}
            />
            <Token
              label={t.ones}
              value={math.onesDigit}
              tone="green"
              active={round.picked === "ones"}
              done={round.placedOnes}
              onClick={() => onToken("ones")}
            />
          </div>
        )}

        {round.step === "arrange" || round.step === "celebrate" ? (
          <button
            type="button"
            onClick={onSubmit}
            className="tap h-14 w-full rounded-card bg-green text-lg font-extrabold text-on-green"
          >
            {round.step === "arrange" ? t.linedUp : t.next}
          </button>
        ) : (
          <>
            {typing && (
              <Numpad typed={round.typed} checkLabel={t.check} onDigit={onDigit} onDelete={onDelete} onSubmit={onSubmit} />
            )}
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={onHelp} className="tap flex h-12 flex-1 items-center justify-center gap-2 rounded-card bg-gold-soft text-sm font-extrabold text-ink">
                <Lightbulb className="size-4" />
                {t.help}
              </button>
              <button type="button" onClick={onWhy} className="tap h-12 flex-1 rounded-card bg-surface text-sm font-extrabold text-muted">
                {round.showWhy ? t.hideWhy : t.why}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Algorithm({
  t,
  problem,
  math,
  round,
  showAnswer,
  hundreds,
  tensDigit,
  onSlot,
}: {
  t: ReturnType<typeof messages>;
  problem: Problem;
  math: Break;
  round: Round;
  showAnswer: boolean;
  hundreds: number;
  tensDigit: number;
  onSlot: (slot: Slot) => void;
}) {
  const onesShown = round.placedOnes || round.step === "tens" || showAnswer;
  const restShown = showAnswer;
  const canPlace = round.step === "place" && round.mode !== "challenge";

  return (
    <div dir="ltr" className="mx-auto grid w-full max-w-xs grid-cols-3 gap-x-2 gap-y-1 text-center font-digit">
      <span />
      <button
        type="button"
        disabled={!canPlace || round.placedCarry}
        onClick={() => onSlot("carry")}
        aria-label={t.carry}
        className={clsx(
          "mx-auto flex size-12 items-center justify-center rounded-full border-2 border-carry text-xl font-extrabold",
          round.placedCarry ? "anim-fly bg-carry text-on-carry" : "border-dashed bg-carry-soft text-carry",
          canPlace && !round.placedCarry && "tap",
        )}
      >
        {round.placedCarry ? math.carry : ""}
      </button>
      <span />

      <span />
      <Digit hot={round.step === "tens"}>{math.tens}</Digit>
      <Digit hot={round.step === "ones" || round.step === "place"}>{math.ones}</Digit>

      <span />
      <span className="self-center text-2xl font-extrabold text-muted">×</span>
      <Digit hot={round.step === "ones" || round.step === "tens"}>{problem.m}</Digit>

      <span className="col-span-3 my-1 h-0.5 bg-ink" />

      <AnswerCell hot={false}>{restShown && hundreds > 0 ? hundreds : ""}</AnswerCell>
      <AnswerCell hot={round.step === "tens"}>{restShown ? tensDigit : ""}</AnswerCell>
      <AnswerCell
        hot={round.step === "place"}
        button={canPlace && !round.placedOnes}
        onClick={() => onSlot("ones")}
      >
        {onesShown ? math.onesDigit : ""}
      </AnswerCell>

      <Label>{t.hundreds}</Label>
      <Label>{t.tens}</Label>
      <Label>{t.ones}</Label>
    </div>
  );
}

function Digit({ hot, children }: { hot: boolean; children: number }) {
  return (
    <span className={clsx("rounded-xl py-1 text-4xl font-extrabold", hot ? "bg-teal-soft ring-2 ring-teal" : "")}>
      {children}
    </span>
  );
}

function AnswerCell({
  hot,
  button,
  onClick,
  children,
}: {
  hot: boolean;
  button?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = clsx(
    "flex h-14 items-center justify-center rounded-xl text-4xl font-extrabold",
    hot ? "bg-green-soft ring-2 ring-green" : "bg-bg",
    children !== "" && "anim-pop text-green",
  );
  if (button) {
    return (
      <button type="button" onClick={onClick} className={clsx(className, "tap")}>
        {children}
      </button>
    );
  }
  return <span className={className}>{children}</span>;
}

function Label({ children }: { children: string }) {
  return <span className="text-xs font-bold text-muted">{children}</span>;
}

function Token({
  label,
  value,
  tone,
  active,
  done,
  onClick,
}: {
  label: string;
  value: number;
  tone: "carry" | "green";
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={done}
      className={clsx(
        "tap flex h-16 min-w-28 flex-col items-center justify-center rounded-card border-2 font-digit font-extrabold",
        tone === "carry" ? "border-carry text-carry" : "border-green text-green",
        active && (tone === "carry" ? "bg-carry text-on-carry" : "bg-green text-on-green"),
        done && "opacity-40",
      )}
    >
      <span className="text-2xl">{value}</span>
      <span className="font-sans text-xs">{label}</span>
    </button>
  );
}

function Bundles({ t, carry, digit }: { t: ReturnType<typeof messages>; carry: number; digit: number }) {
  return (
    <div className="mt-3 rounded-card bg-surface px-3 py-3">
      <p className="text-sm font-bold">{t.bundles(carry, digit)}</p>
      <div dir="ltr" className="mt-2 flex flex-wrap items-center gap-1.5">
        {Array.from({ length: carry }, (_, i) => (
          <span key={i} className="rounded-lg bg-carry px-2 py-1 font-digit text-sm font-extrabold text-on-carry">
            10
          </span>
        ))}
        {digit > 0 && (
          <span className="flex gap-1">
            {Array.from({ length: digit }, (_, i) => (
              <span key={i} className="size-4 rounded-sm bg-green" />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function Numpad({
  typed,
  checkLabel,
  onDigit,
  onDelete,
  onSubmit,
}: {
  typed: string;
  checkLabel: string;
  onDigit: (d: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div dir="ltr" className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <button key={key} type="button" onClick={() => onDigit(key)} className="tap h-14 rounded-card bg-surface font-digit text-2xl font-extrabold shadow-sm">
          {key}
        </button>
      ))}
      <button type="button" onClick={onDelete} aria-label="delete" className="tap flex h-14 items-center justify-center rounded-card bg-surface text-muted shadow-sm">
        <Delete className="size-6" />
      </button>
      <button type="button" onClick={() => onDigit("0")} className="tap h-14 rounded-card bg-surface font-digit text-2xl font-extrabold shadow-sm">
        0
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={typed.length === 0}
        aria-label={checkLabel}
        className="tap flex h-14 items-center justify-center rounded-card bg-green text-on-green disabled:opacity-40"
      >
        <Check className="size-7" />
      </button>
    </div>
  );
}

function DoneScreen({
  t,
  round,
  onHome,
  onAgain,
  onPractice,
  onChallenge,
}: {
  t: ReturnType<typeof messages>;
  round: Round;
  onHome: () => void;
  onAgain: () => void;
  onPractice: () => void;
  onChallenge: () => void;
}) {
  const starSum = round.results.reduce((sum, item) => sum + item.stars, 0);
  const starMax = round.results.length * 3;
  const solved = round.results.filter((item) => item.correct).length;
  const title =
    round.mode === "learn" ? t.learnDone : round.mode === "practice" ? t.practiceDone : t.challengeDone;

  return (
    <div className="flex flex-1 flex-col py-5 safe-bottom">
      <img src="/mascot.jpg" alt="" className="mx-auto h-40 w-full object-contain" />
      <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
      {round.mode === "challenge" ? (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label={t.score} value={String(round.score)} />
          <Stat label={t.solved} value={`${solved}/${round.problems.length}`} />
          <Stat label={t.combo} value={String(round.bestCombo)} />
        </div>
      ) : (
        <p className="mt-2 font-digit text-xl font-extrabold text-gold">{t.yourStars(starSum, starMax)}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {round.results.map((item) => (
          <Mini key={item.problem.id} problem={item.problem} stars={item.stars} correct={item.correct} />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        {round.mode === "learn" && (
          <button type="button" onClick={onPractice} className="tap h-14 rounded-card bg-green text-lg font-extrabold text-on-green">
            {t.toPractice}
          </button>
        )}
        {round.mode === "practice" && (
          <button type="button" onClick={onChallenge} className="tap h-14 rounded-card bg-green text-lg font-extrabold text-on-green">
            {t.toChallenge}
          </button>
        )}
        <button type="button" onClick={onAgain} className="tap h-12 rounded-card bg-surface text-base font-extrabold">
          {t.again}
        </button>
        <button type="button" onClick={onHome} className="tap h-12 rounded-card text-base font-extrabold text-muted">
          {t.home}
        </button>
      </div>
    </div>
  );
}

function Mini({ problem, stars, correct }: { problem: Problem; stars: number; correct: boolean }) {
  const math = breakdown(problem.n, problem.m);
  return (
    <div className={clsx("rounded-card border-2 bg-surface px-3 py-2", correct ? "border-green" : "border-carry")} dir="ltr">
      <div className="flex items-start justify-between">
        <span className="font-digit text-xs font-extrabold text-carry">{math.carry > 0 ? math.carry : ""}</span>
        {stars > 0 && <StarRow count={stars} />}
      </div>
      <p className="text-end font-digit text-xl font-extrabold leading-none">{problem.n}</p>
      <p className="text-end font-digit text-xl font-extrabold leading-none">× {problem.m}</p>
      <p className="mt-1 border-t-2 border-ink text-end font-digit text-xl font-extrabold text-green">{math.answer}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface px-2 py-3">
      <p className="font-digit text-xl font-extrabold">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
    </div>
  );
}

function StarRow({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3].map((n) => (
        <Star key={n} className={clsx("size-4", n <= count ? "fill-gold text-gold" : "text-line")} />
      ))}
    </span>
  );
}

function StepDot({ n }: { n: string }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green font-digit text-xs font-extrabold text-on-green">
      {n}
    </span>
  );
}

function ModeButton({
  icon,
  title,
  blurb,
  tone,
  badge,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  blurb: string;
  tone: "green" | "teal" | "gold";
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "tap flex items-center gap-3 rounded-card border-2 bg-surface px-4 py-3 text-start",
        tone === "green" && "border-green",
        tone === "teal" && "border-teal",
        tone === "gold" && "border-gold",
      )}
    >
      <span
        className={clsx(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          tone === "green" && "bg-green-soft text-green",
          tone === "teal" && "bg-teal-soft text-teal",
          tone === "gold" && "bg-gold-soft text-gold",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold">{title}</span>
        <span className="block text-sm font-bold text-muted">{blurb}</span>
        {badge && <span className="mt-0.5 block text-xs font-extrabold text-green">{badge}</span>}
      </span>
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="tap flex size-11 items-center justify-center rounded-full bg-surface text-ink">
      {children}
    </button>
  );
}
