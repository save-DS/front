/**
 * 공용 UI 헬퍼.
 * - 화면 전환
 * - 인벤토리 렌더링 + 아이템 선택
 * - 내레이션 / 토스트
 * - 모달 (숫자/영문 키패드) 열고 닫기
 * - 힌트 패널
 *
 * 전역 객체 UI로 노출.
 */

const UI = {
  // 현재 선택(들고 있는) 아이템 ID. 아이템 사용/조합에 쓰임.
  heldItem: null,

  // ---- 화면 전환 ----
  showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  },

  // ---- 토스트 ----
  toast(msg, ms = 1800) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  },

  // ---- 인벤토리 렌더 ----
  renderInventory(items) {
    // items: 아이템 ID 배열
    const bar = document.getElementById("fp-inventory");
    bar.innerHTML = "";
    const SLOTS = 8;
    for (let i = 0; i < SLOTS; i++) {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      const itemId = items[i];
      if (itemId) {
        slot.classList.add("filled");
        if (this.heldItem === itemId) slot.classList.add("selected");
        const icon = ITEM_ICONS[itemId];
        const name = ITEM_NAMES[itemId] || itemId;
        slot.innerHTML = icon
          ? `<img src="${icon}" alt="${name}" /><span class="item-name">${name}</span>`
          : `<span class="item-name">${name}</span>`;
        slot.onclick = () => UI.onItemClick(itemId);
      }
      bar.appendChild(slot);
    }
  },

  // ---- 아이템 클릭 ----
  onItemClick(itemId) {
    if (this.heldItem === null) {
      // 들고 있는 게 없으면 → 큰 이미지로 보여주기 (+ 사용하기 버튼)
      this.showItemView(itemId);
    } else if (this.heldItem === itemId) {
      this.clearHeld();
    } else {
      // 이미 든 게 있는데 다른 아이템 클릭 → 조합
      const a = this.heldItem;
      const b = itemId;
      this.clearHeld();
      FP.combine(a, b);
    }
  },

  // 인벤토리 아이템을 크게 보여주기 (사용하기 가능)
  showItemView(itemId) {
    const icon = ITEM_ICONS[itemId];
    const name = ITEM_NAMES[itemId] || itemId;
    document.getElementById("itemview-img").src = icon || "";
    document.getElementById("itemview-img").style.display = icon ? "block" : "none";
    document.getElementById("itemview-name").textContent = name;
    document.getElementById("itemview-use").onclick = () => {
      this.closeModal("item-view");
      this.selectItem(itemId);
    };
    this.openModal("item-view");
  },

  // 아이템을 "사용 대기" 상태로 선택
  selectItem(itemId) {
    this.heldItem = itemId;
    this.toast(`${ITEM_NAMES[itemId] || itemId} 선택됨. 사용할 곳을 클릭하세요.`);
    document.getElementById("fp-stage").classList.add("use-mode");
    FP.refreshInventory();
  },

  clearHeld() {
    this.heldItem = null;
    document.getElementById("fp-stage").classList.remove("use-mode");
    FP.refreshInventory();
  },

  // 아이템 획득 → 크게 잠깐 띄우고 자동으로 사라짐 (인벤토리엔 이미 반영됨)
  showItemAcquired(itemId) {
    const icon = ITEM_ICONS[itemId];
    const name = ITEM_NAMES[itemId] || itemId;
    // 여러 개 동시 획득 시 순차로 보여주기 위한 큐
    this._acqQueue = this._acqQueue || [];
    this._acqQueue.push({ icon, name });
    if (!this._acqShowing) this._drainAcquired();
  },

  _drainAcquired() {
    if (!this._acqQueue || this._acqQueue.length === 0) {
      this._acqShowing = false;
      return;
    }
    this._acqShowing = true;
    const { icon, name } = this._acqQueue.shift();
    const overlay = document.getElementById("item-acquired");
    document.getElementById("acquired-img").src = icon || "";
    document.getElementById("acquired-img").style.display = icon ? "block" : "none";
    document.getElementById("acquired-name").textContent = name;
    overlay.classList.add("active");
    setTimeout(() => {
      overlay.classList.remove("active");
      setTimeout(() => this._drainAcquired(), 350);
    }, 1400);
  },

  // ---- 상세 뷰 ----
  openDetail({ image, text, actions, hotspots }) {
    const overlay = document.getElementById("detail-overlay");
    const txt = document.getElementById("detail-text");
    const act = document.getElementById("detail-actions");

    this.setDetailImage(image, hotspots);
    txt.textContent = text || "";

    act.innerHTML = "";
    (actions || []).forEach(({ label, onClick }) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.onclick = onClick;
      act.appendChild(btn);
    });

    overlay.classList.add("active");
  },

  // 이미지/핫스팟만 갱신 (예: 캐비닛에서 건전지 꺼낸 후 shelf1→shelf2)
  setDetailImage(image, hotspots) {
    const img = document.getElementById("detail-img");
    if (image) {
      img.src = image;
      img.classList.remove("hidden");
    } else {
      img.classList.add("hidden");
    }
    const container = document.getElementById("detail-img-hotspots");
    container.innerHTML = "";
    (hotspots || []).forEach((h) => {
      const div = document.createElement("div");
      div.className = "detail-hotspot";
      div.style.left = h.left + "%";
      div.style.top = h.top + "%";
      div.style.width = h.width + "%";
      div.style.height = h.height + "%";
      div.onclick = h.onClick;
      container.appendChild(div);
    });
  },

  closeDetail() {
    document.getElementById("detail-overlay").classList.remove("active");
  },

  // ---- 모달 열고 닫기 ----
  openModal(id) { document.getElementById(id).classList.add("active"); },
  closeModal(id) { document.getElementById(id).classList.remove("active"); },
};

// 모달 "닫기" 버튼들 일괄 바인딩
document.addEventListener("click", (e) => {
  const closeId = e.target.dataset.close;
  if (closeId) UI.closeModal(closeId);
});
