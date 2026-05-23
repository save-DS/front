/**
 * 1인칭 모드 로직.
 * - 시점 전환, 오브젝트 조사, 아이템 사용/조합, 퍼즐 모달, 힌트
 *
 * 전역 객체 FP로 노출.
 */

// 핫스팟에 표시할 한글 라벨
const OBJ_LABELS = {
  whiteboard: "화이트보드", computer: "컴퓨터", calendar: "달력",
  desk_drawer: "책상 서랍", shelf_book: "책장",
  cabinet: "캐비닛", uv_poster: "포스터", microscope: "현미경",
  bookshelf_right: "책장", code_note: "노트", photo: "사진",
  escape_door: "탈출문", bookshelf_clock: "책장",
  newspaper_pile: "서류 더미", rug: "러그", memo_wall: "메모",
};

// 퍼즐 종류 (프론트가 어떤 모달을 띄울지 결정)
const PUZZLE_TYPES = {
  cabinet_password:   { type: "number", title: "잠긴 상자" },
  computer_login:     { type: "number", title: "컴퓨터 로그인" },
  escape_door_keypad: { type: "word",   title: "탈출문 키패드" },
};

const FP = {
  activePuzzle: null,
  numpadInput: "",
  keypadInput: "",
  currentDetailObj: null,

  // ---- 진입 ----
  async enter() {
    UI.showScreen("screen-fp");
    await this.renderView();
    this.refreshInventory();
  },

  // ---- 시점 렌더 ----
  async renderView() {
    const view = Store.get("current_view") || "center";
    document.getElementById("fp-bg").src = VIEW_BACKGROUNDS[view];
    document.getElementById("fp-arrow-left").classList.toggle("hidden", view === "left");
    document.getElementById("fp-arrow-right").classList.toggle("hidden", view === "right");
    this.renderHotspots(view);
  },

  renderHotspots(view) {
    const container = document.getElementById("fp-hotspots");
    container.innerHTML = "";
    const spots = HOTSPOTS[view] || {};
    for (const [objId, pos] of Object.entries(spots)) {
      const div = document.createElement("div");
      div.className = "hotspot";
      div.style.left = pos.left + "%";
      div.style.top = pos.top + "%";
      div.style.width = pos.width + "%";
      div.style.height = pos.height + "%";
      div.innerHTML = `<span class="label">${OBJ_LABELS[objId] || objId}</span>`;
      div.onclick = () => this.onHotspotClick(objId);
      container.appendChild(div);
    }
  },

  onHotspotClick(objId) {
    if (UI.heldItem) {
      const item = UI.heldItem;
      UI.clearHeld();
      this.useOnObject(item, objId);
    } else {
      this.investigate(objId);
    }
  },

  // ---- 시점 전환 ----
  async turn(direction) {
    const res = await API.turnView(direction);
    if (!res.success) { UI.toast(res.message); return; }
    Store.merge(res.state_changed);
    await this.renderView();
  },

  // ---- 조사 ----
  async investigate(objId) {
    // API 호출 전에 "이미 조사한 적 있는지" 기록 (이미지/버튼 단계 판정용)
    const wasInvestigated = (Store.get("investigated_objects") || []).includes(objId);

    const res = await API.investigate(objId);
    if (!res.success) { UI.toast(res.message); return; }
    Store.merge(res.state_changed);
    this.refreshInventory();

    const d = res.data;
    const ctx = { wasInvestigated };
    this.showObjectDetail(d.object, d.result_text, ctx);

    // 아이템 획득 → 크게 띄우고(순차) 인벤토리로
    (d.found_items || []).forEach((it) => UI.showItemAcquired(it));
    if (d.found_clue) UI.toast(`단서 발견: ${this.clueLabel(d.found_clue)}`);
  },

  showObjectDetail(obj, text, ctx = {}) {
    this.currentDetailObj = obj;   // 잠긴 상자 해제 시 캐비닛 이미지 갱신에 사용
    const image = this.pickImage(obj, ctx);
    UI.openDetail({ image, text, actions: this.buildActions(obj, ctx) });
  },

  // 오브젝트 + 진행 상황에 맞는 상세 이미지 선택
  pickImage(obj, ctx = {}) {
    const solvedList = Store.get("solved_puzzles") || [];
    const solved = obj.puzzle && solvedList.includes(obj.puzzle);

    // 캐비닛: shelf1(첫 조사·건전지) → shelf2(재조사) → shelf3(방금 해제) → shelf4(이후)
    if (obj.id === "cabinet") {
      if (ctx.justSolved) return "images/shelf3.png";
      if (solved) return "images/shelf4.png";
      if (ctx.wasInvestigated) return "images/shelf2.png";
      return "images/shelf1.png";
    }

    const map = OBJECT_DETAIL_IMAGES[obj.id];
    if (!map) return null;
    // 아이템 사용으로 단서를 이미 해독한 경우 → revealed 이미지 (예: 화이트보드 UV)
    if (map.revealed && obj.gives_clue_on_use) {
      const foundClues = Store.get("found_clues") || [];
      if (foundClues.includes(obj.gives_clue_on_use)) return map.revealed;
    }
    if (map.solved && solved) return map.solved;
    if (map.opened && ctx.wasInvestigated) return map.opened;
    return map.default || null;
  },

  buildActions(obj, ctx = {}) {
    const actions = [];
    const solved = Store.get("solved_puzzles") || [];

    // 아이템 사용은 "인벤토리에서 아이템 선택 → 배경 핫스팟 클릭"으로만 처리.
    // 따라서 상세 뷰에는 비밀번호 입력형 퍼즐 버튼만 남긴다.
    // (탈출문 키패드는 탈출키를 사용해야 열리므로 버튼 없음)
    if (obj.puzzle && !solved.includes(obj.puzzle) && obj.id !== "escape_door") {
      if (obj.id === "cabinet") {
        // 캐비닛은 첫 조사(건전지 획득) 다음부터 잠긴 상자 열기 가능
        if (ctx.wasInvestigated) {
          actions.push({
            label: "잠긴 상자 열기",
            onClick: () => this.openPuzzle(obj.puzzle),
          });
        }
      } else {
        actions.push({
          label: "비밀번호 입력",
          onClick: () => this.openPuzzle(obj.puzzle),
        });
      }
    }

    return actions;
  },

  // ---- 아이템 사용 (오브젝트 대상) ----
  // 인벤토리에서 아이템을 선택한 뒤 배경 핫스팟을 클릭하면 호출됨.
  async useOnObject(itemId, objId) {
    const res = await API.useItem(itemId, objId);
    if (!res.success) { UI.toast(res.message); return; }
    Store.merge(res.state_changed);
    this.refreshInventory();

    const d = res.data;

    // 탈출문 잠금 해제 → 키패드 모달
    if (d.effect === "unlock_keypad") {
      UI.toast(d.result_text);
      this.openKeypad("escape_door_keypad");
      return;
    }

    if (d.found_clue) UI.toast(`단서 발견: ${this.clueLabel(d.found_clue)}`);

    // 결과를 상세 뷰로 표시 (해독 이미지가 있으면 우선 사용)
    const map = OBJECT_DETAIL_IMAGES[objId] || {};
    let image = map.default || null;
    if (d.effect === "reveal_clue" && map.revealed) image = map.revealed;

    this.currentDetailObj = { id: objId };
    UI.openDetail({ image, text: d.result_text, actions: [] });
  },

  // ---- 아이템 조합 ----
  async combine(a, b) {
    const res = await API.useItem(a, b);
    if (!res.success) { UI.toast(res.message); return; }
    Store.merge(res.state_changed);
    this.refreshInventory();
    UI.toast(res.data.result_text);
  },

  // ---- 인벤토리 ----
  refreshInventory() {
    UI.renderInventory(Store.get("inventory") || []);
  },

  // ---- 숫자 키패드 퍼즐 ----
  openPuzzle(puzzleId) {
    this.activePuzzle = puzzleId;
    this.numpadInput = "";
    document.getElementById("numpad-title").textContent =
      (PUZZLE_TYPES[puzzleId] || {}).title || "비밀번호 입력";
    document.getElementById("numpad-msg").textContent = "";
    this.updateNumpadDisplay();
    UI.openModal("modal-numpad");
  },

  onNumpad(n) {
    if (n === "clear") this.numpadInput = "";
    else if (n === "enter") return this.submitNumpad();
    else if (this.numpadInput.length < 4) this.numpadInput += n;
    this.updateNumpadDisplay();
  },

  updateNumpadDisplay() {
    document.getElementById("numpad-display").textContent =
      this.numpadInput.padEnd(4, "_").split("").join(" ");
  },

  async submitNumpad() {
    const res = await API.submitPuzzle(this.activePuzzle, this.numpadInput);
    const msg = document.getElementById("numpad-msg");
    if (!res.success) {
      msg.className = "modal-msg";
      msg.textContent = res.message;
      this.numpadInput = "";
      this.updateNumpadDisplay();
      return;
    }
    msg.className = "modal-msg ok";
    msg.textContent = res.data.result_text;
    Store.merge(res.state_changed);
    this.refreshInventory();
    const reward = res.data.reward || {};
    const puzzleId = this.activePuzzle;

    setTimeout(() => {
      UI.closeModal("modal-numpad");
      // 캐비닛: 방금 해제 → shelf3 화면 + 카드키 획득 팝업
      if (puzzleId === "cabinet_password" && this.currentDetailObj) {
        const image = this.pickImage(this.currentDetailObj, { justSolved: true });
        UI.openDetail({
          image,
          text: "...!! 열렸다! 카드키가 들어있다.",
          actions: [],
        });
      } else {
        UI.closeDetail();
      }
      if (reward.item) UI.showItemAcquired(reward.item);
      if (reward.clue) UI.toast(`단서: ${this.clueLabel(reward.clue)}`);
    }, 1100);
  },

  // ---- 영문 키패드 (탈출문) ----
  openKeypad(puzzleId) {
    this.activePuzzle = puzzleId;
    this.keypadInput = "";
    this.buildKeypadGrid();
    this.updateKeypadDisplay();
    document.getElementById("keypad-msg").textContent = "";
    UI.closeModal("modal-numpad");
    UI.openModal("modal-keypad");
  },

  buildKeypadGrid() {
    const grid = document.getElementById("keypad-grid");
    if (grid.dataset.built) return;
    ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach((row) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "keypad-row";
      row.split("").forEach((ch) => {
        const b = document.createElement("button");
        b.textContent = ch.toUpperCase();
        b.onclick = () => this.onKeypad(ch);
        rowDiv.appendChild(b);
      });
      grid.appendChild(rowDiv);
    });
    const sp = document.createElement("div");
    sp.className = "keypad-row";
    const del = document.createElement("button");
    del.className = "special"; del.textContent = "지움";
    del.onclick = () => this.onKeypad("__del");
    const ent = document.createElement("button");
    ent.className = "special enter"; ent.textContent = "입력";
    ent.onclick = () => this.onKeypad("__enter");
    sp.appendChild(del); sp.appendChild(ent);
    grid.appendChild(sp);
    grid.dataset.built = "1";
  },

  onKeypad(ch) {
    if (ch === "__del") this.keypadInput = this.keypadInput.slice(0, -1);
    else if (ch === "__enter") return this.submitKeypad();
    else this.keypadInput += ch;
    this.updateKeypadDisplay();
  },

  updateKeypadDisplay() {
    document.getElementById("keypad-display").textContent =
      (this.keypadInput.toUpperCase() || "_");
  },

  async submitKeypad() {
    const res = await API.submitPuzzle(this.activePuzzle, this.keypadInput);
    const msg = document.getElementById("keypad-msg");
    if (!res.success) {
      msg.className = "modal-msg";
      msg.textContent = res.message;
      return;
    }
    msg.className = "modal-msg ok";
    msg.textContent = "방 탈출 성공! 미로로 진입합니다...";
    Store.merge(res.state_changed);

    setTimeout(() => {
      UI.closeModal("modal-keypad");
      UI.closeDetail();
      Main.enterMaze();   // 1인칭 탈출 → 미로 모드
    }, 1400);
  },

  // ---- AI 힌트 (1인칭 HINT 버튼) ----
  showHint() {
    UI.openModal("ai-hint-panel");
    // 처음 열 때 안내 메시지 한 번
    const log = document.getElementById("ai-chat-log");
    if (!log.dataset.greeted) {
      this.appendChat("ai", "막힌 부분을 물어보세요. 예: \"지금 뭘 해야 해?\", \"이 건전지 어디 써?\"");
      log.dataset.greeted = "1";
    }
    document.getElementById("ai-question").focus();
  },

  // 채팅 로그에 말풍선 추가
  appendChat(role, text) {
    const log = document.getElementById("ai-chat-log");
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  },

  // 질문 전송 → AI 응답
  async sendQuestion() {
    const input = document.getElementById("ai-question");
    const question = input.value.trim();
    if (!question) return;
    input.value = "";

    this.appendChat("user", question);
    const loading = this.appendChat("ai", "생각 중...");

    const res = await API.askHint(question);
    if (!res.success) {
      loading.textContent = `(${res.message})`;
      loading.classList.add("error");
      return;
    }
    loading.textContent = res.data.answer;
  },

  clueLabel(cid) {
    const map = {
      clue_2: "숫자 2", clue_3: "숫자 3", clue_6: "숫자 6", clue_9: "숫자 9",
      birthday_0418: "생일 0418", research_doc: "연구 일지", code_note: "코드 노트",
    };
    return map[cid] || cid;
  },
};
