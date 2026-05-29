/**
 * 미로 모드 로직.
 * - 캔버스에 격자 렌더 (벽/길/시작/출구/플레이어)
 * - 4방향 이동 (버튼 + 방향키)
 * - 함정 적중 연출 (함정 위치는 백엔드만 알고, 프론트는 trap_hit만 받음)
 * - HINT: BFS 경로를 2초간 표시
 *
 * 전역 객체 Maze로 노출.
 */

const Maze = {
  grid: [],
  start: null,
  exit: null,
  pos: null,
  cell: 40,
  hintPath: null,
  hintTimer: null,
  wallsHidden: false,   // 3초 후 true가 되면 벽을 길 색으로 그려서 안 보이게
  hintUsed: false,      // 미로 힌트는 미로당 1회만 사용 가능
  _memTimer: null,
  _bound: false,

  // ---- 진입 ----
  start_(data) {
    UI.showScreen("screen-maze");
    if (data) {
      this.load(data);
    } else {
      this.fetchAndLoad();
    }
    this.bindControls();
  },

  async fetchAndLoad() {
    const res = await API.mazeMap();
    if (!res.success) { UI.toast(res.message); return; }
    this.load(res.data);
  },

  load(d) {
    this.grid = d.grid;
    this.start = d.start;
    this.exit = d.exit;
    this.pos = d.current_position;
    this.wallsHidden = false;       // 처음엔 벽이 보이는 상태
    this.resetHint();               // 새 미로마다 힌트 사용 가능 상태로
    this.setupCanvas();
    this.draw();
    this.updateInfo();
    this.startMemorize();           // 5초 암기 카운트다운 → 벽 숨김
  },

  // 힌트 사용 가능 상태로 초기화 (미로당 1회)
  resetHint() {
    this.hintUsed = false;
    const btn = document.getElementById("maze-hint");
    btn.disabled = false;
    btn.classList.remove("used");
    btn.textContent = "HINT";
  },

  // 미로를 3초간 보여준 뒤 벽을 길 색으로 덮어 안 보이게 한다.
  startMemorize() {
    clearInterval(this._memTimer);
    const cd = document.getElementById("maze-countdown");
    document.getElementById("maze-msg").textContent = "";
    let count = 5;
    cd.textContent = `미로를 외우세요!  ${count}`;
    cd.classList.add("show");
    this._memTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        cd.textContent = `미로를 외우세요!  ${count}`;
      } else {
        clearInterval(this._memTimer);
        this.wallsHidden = true;
        this.draw();
        cd.textContent = "벽이 사라졌습니다!";
        setTimeout(() => cd.classList.remove("show"), 1600);
      }
    }, 1000);
  },

  setupCanvas() {
    const canvas = document.getElementById("maze-canvas");
    const h = this.grid.length;
    const w = this.grid[0].length;
    this.cell = Math.floor(Math.min(640 / w, 400 / h));
    canvas.width = w * this.cell;
    canvas.height = h * this.cell;
  },

  // ---- 그리기 ----
  draw() {
    const canvas = document.getElementById("maze-canvas");
    const ctx = canvas.getContext("2d");
    const cs = this.cell;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 벽/길 (wallsHidden이면 벽도 길 색으로 그려서 안 보이게)
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[0].length; c++) {
        const isWall = this.grid[r][c] === 1;
        // 숨겨지면 길도 #2a2a32 (전원 꺼진 듯 깜깜) / 평소엔 벽만 어둡고 길은 밝음
        ctx.fillStyle = (this.wallsHidden || isWall) ? "#2a2a32" : "#d9d9d9";
        ctx.fillRect(c * cs, r * cs, cs - 1, cs - 1);
      }
    }

    // BFS 힌트 경로 (있을 때만)
    if (this.hintPath) {
      ctx.fillStyle = "rgba(216, 192, 96, 0.55)";
      this.hintPath.forEach(([r, c]) =>
        ctx.fillRect(c * cs, r * cs, cs - 1, cs - 1));
    }

    this.fillCell(ctx, this.start, "#c0392b");  // 시작(빨강)
    this.fillCell(ctx, this.exit, "#27ae60");   // 출구(초록)
    this.fillCircle(ctx, this.pos, "#2a6cd8");  // 플레이어(파랑)
  },

  fillCell(ctx, [r, c], color) {
    const cs = this.cell;
    ctx.fillStyle = color;
    ctx.fillRect(c * cs, r * cs, cs - 1, cs - 1);
  },

  fillCircle(ctx, [r, c], color) {
    const cs = this.cell;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(c * cs + cs / 2, r * cs + cs / 2, cs * 0.32, 0, Math.PI * 2);
    ctx.fill();
  },

  // ---- 이동 ----
  async move(direction) {
    const res = await API.mazeMove(direction);
    if (!res.success) {
      if (res.error_code === "COLLISION") UI.toast("벽이에요!");
      else UI.toast(res.message);
      return;
    }
    const d = res.data;
    this.pos = d.new_position;
    Store.merge(res.state_changed);
    this.draw();
    this.updateInfo();

    const msg = document.getElementById("maze-msg");
    if (d.trap_hit) {
      this.flashTrap();
      msg.textContent = d.result_text || "함정! 시작점으로 돌아갑니다.";
    } else {
      msg.textContent = "";
    }

    if (d.reached_exit) {
      msg.textContent = "탈출 성공!";
      setTimeout(() => Main.showClear(), 1000);
    }
  },

  flashTrap() {
    const stage = document.querySelector(".maze-stage");
    stage.classList.add("trap-flash");
    setTimeout(() => stage.classList.remove("trap-flash"), 400);
  },

  updateInfo() {
    document.getElementById("maze-steps").textContent =
      "이동: " + (Store.get("maze_steps") || 0);
    document.getElementById("maze-traps").textContent =
      "함정: " + (Store.get("maze_trap_hits") || 0);
  },

  // ---- BFS 힌트 (미로당 1회, 2초 표시) ----
  async showHint() {
    if (this.hintUsed) {
      UI.toast("미로 힌트는 한 번만 사용할 수 있어요.");
      return;
    }
    const res = await API.hintMaze();
    if (!res.success) { UI.toast(res.message); return; }

    // 사용 처리 (성공했을 때만 소모)
    this.hintUsed = true;
    const btn = document.getElementById("maze-hint");
    btn.disabled = true;
    btn.classList.add("used");
    btn.textContent = "HINT (소진)";

    this.hintPath = res.data.path;
    this.draw();
    UI.toast(res.data.hint_text, 2000);
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      this.hintPath = null;
      this.draw();
    }, 2000);
  },

  // ---- 재생성 ----
  async regenerate() {
    const res = await API.mazeRegenerate();
    if (!res.success) { UI.toast(res.message); return; }
    Store.merge(res.state_changed);
    this.load(res.data);
    UI.toast("새 미로 생성됨");
  },

  // ---- 컨트롤 바인딩 (1회) ----
  bindControls() {
    if (this._bound) return;
    document.querySelectorAll(".dpad").forEach((b) => {
      b.onclick = () => this.move(b.dataset.dir);
    });
    document.getElementById("maze-hint").onclick = () => this.showHint();
    document.getElementById("maze-regen").onclick = () => this.regenerate();
    document.addEventListener("keydown", (e) => {
      if (!document.getElementById("screen-maze").classList.contains("active")) return;
      const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      if (map[e.key]) { e.preventDefault(); this.move(map[e.key]); }
    });
    this._bound = true;
  },
};
