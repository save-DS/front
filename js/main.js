/**
 * 메인 부트스트랩.
 * - 전역 상태 저장소(Store)
 * - 화면 흐름 제어 (시작 → 1인칭 → 미로 → 클리어)
 * - 이벤트 바인딩
 */

// ---- 전역 상태 저장소 ----
// 백엔드 응답의 state / state_changed를 여기에 누적해서 보관.
const Store = {
  state: {},
  set(s) { this.state = s || {}; },
  merge(delta) { if (delta) Object.assign(this.state, delta); },
  get(k) { return this.state[k]; },
};

const Main = {
  // ---- 게임 시작 ----
  async start() {
    const res = await API.initGame();
    if (!res.success) { UI.toast(res.message, 4000); return; }
    Store.set(res.data.state);

    // 1인칭 화면을 미리 깔아두고(배경 렌더), 그 위에 검은 인트로를 덮음
    await FP.enter();
    const intro = (res.data.intro_event && res.data.intro_event.narration) ||
      "정신을 차려보니 낯선 폐연구실에 갇혀있다...";
    this.playIntro(intro);
  },

  // 검은 화면에 멘트 → 서서히 배경이 드러남
  playIntro(text) {
    const overlay = document.getElementById("intro-overlay");
    const textEl = document.getElementById("intro-text");
    textEl.textContent = text;
    overlay.classList.remove("fade-out");
    overlay.style.display = "flex";
    // 텍스트 페이드인 애니메이션 재시작
    textEl.style.animation = "none";
    void textEl.offsetWidth;
    textEl.style.animation = "";

    // 3.5초 후 배경으로 페이드아웃
    setTimeout(() => {
      overlay.classList.add("fade-out");
      setTimeout(() => { overlay.style.display = "none"; }, 2000);
    }, 3500);
  },

  // ---- 1인칭 탈출 → 미로 진입 ----
  async enterMaze() {
    const res = await API.switchMode("maze");
    if (!res.success) { UI.toast(res.message); return; }
    Store.merge(res.state_changed);
    Maze.start_(res.data.init_data);
  },

  // ---- 최종 클리어 ----
  showClear() {
    const steps = Store.get("maze_steps") || 0;
    const traps = Store.get("maze_trap_hits") || 0;
    document.getElementById("clear-stats").textContent =
      `미로 이동 ${steps}회 · 함정 적중 ${traps}회`;
    UI.showScreen("screen-clear");
  },

  // ---- 이벤트 바인딩 ----
  bind() {
    document.getElementById("btn-start").onclick = () => this.start();
    document.getElementById("btn-replay").onclick = () => location.reload();

    // 1인칭 컨트롤
    document.getElementById("fp-arrow-left").onclick = () => FP.turn("left");
    document.getElementById("fp-arrow-right").onclick = () => FP.turn("right");
    document.getElementById("fp-hint").onclick = () => FP.showHint();
    document.getElementById("detail-back").onclick = () => UI.closeDetail();

    // 숫자 키패드 버튼
    document.querySelectorAll("#modal-numpad .numpad-grid button").forEach((b) => {
      b.onclick = () => FP.onNumpad(b.dataset.n);
    });

    // AI 힌트 채팅
    document.getElementById("ai-send").onclick = () => FP.sendQuestion();
    document.getElementById("ai-question").addEventListener("keydown", (e) => {
      // 한글 IME 조합 중에는 Enter 무시 (조합 중 전송되면 마지막 글자가 중복 입력됨)
      if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        FP.sendQuestion();
      }
    });
  },
};

document.addEventListener("DOMContentLoaded", () => Main.bind());
