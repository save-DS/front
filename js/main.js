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

    // 1인칭 화면을 미리 깔아두고(배경 렌더), 그 위에 인트로를 덮음
    await FP.enter();
    this.playIntro();
  },

  // 인트로 슬라이드들 (마지막은 urgent: true → 빨강)
  _introSlides: [
    { text: '"20XX년 11월 14일, 마지막 기록이다."' },
    { text: '"놈들은 통제를 벗어났고, 전원은 곧 차단될 거다. 사람들은 이곳을 버렸다고 생각하겠지만..."' },
    { text: '"아니, 여긴 버려진 게 아니라 격리될 것이다. 만약 누군가 이 메시지를 듣는다면, 제발 부탁하건대"' },
    { text: '"당장 거기서 탈출해!!"', urgent: true },
  ],

  playIntro() {
    this._introIndex = 0;
    const overlay = document.getElementById("intro-overlay");
    overlay.classList.remove("fade-out");
    overlay.style.display = "flex";
    this._renderIntroSlide();

    // 클릭 / 스페이스·엔터·→ 로 다음 슬라이드
    this._introClick = () => this._advanceIntro();
    overlay.addEventListener("click", this._introClick);
    this._introKey = (e) => {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        this._advanceIntro();
      }
    };
    document.addEventListener("keydown", this._introKey);
  },

  _renderIntroSlide() {
    const slide = this._introSlides[this._introIndex];
    const textEl = document.getElementById("intro-text");
    textEl.textContent = slide.text;
    textEl.classList.toggle("urgent", !!slide.urgent);
    // 페이드인 애니메이션 재시작
    textEl.style.animation = "none";
    void textEl.offsetWidth;
    textEl.style.animation = "";

    const hint = document.getElementById("intro-next-hint");
    if (hint) {
      const last = this._introIndex >= this._introSlides.length - 1;
      hint.textContent = last ? "▶  들어가기  ▶" : "▶  화면을 클릭해 계속  ▶";
    }
  },

  _advanceIntro() {
    this._introIndex += 1;
    if (this._introIndex < this._introSlides.length) {
      this._renderIntroSlide();
    } else {
      this._endIntro();
    }
  },

  _endIntro() {
    const overlay = document.getElementById("intro-overlay");
    overlay.removeEventListener("click", this._introClick);
    document.removeEventListener("keydown", this._introKey);
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.style.display = "none"; }, 2000);
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
