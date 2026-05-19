const inventorySlots = document.querySelectorAll(".inventory-slot");

let inventoryItems = [];
let passwordInput = "";
let isPasswordMode = false;
let currentPasswordModalId = null;

function openHint() {
  console.log("힌트 창 열기");
}

function goPage(target) {
  window.location.href = `./${target}.html`;
}

/* ========================= */
/* 인벤토리 불러오기 */
/* ========================= */

async function loadInventory() {
  try {
    const response = await fetch("/api/inventory");

    if (!response.ok) {
      throw new Error("API 응답 실패");
    }

    const data = await response.json();
    inventoryItems = data.items || [];
    renderInventory(inventoryItems);
  } catch (error) {
    console.error("인벤토리 불러오기 실패:", error);
    renderInventory(inventoryItems);
  }
}

/* ========================= */
/* 인벤토리 렌더링 */
/* ========================= */

function renderInventory(items) {
  inventorySlots.forEach((slot, index) => {
    slot.innerHTML = "";
    slot.dataset.itemId = "";

    const item = items[index];

    if (!item) return;

    slot.dataset.itemId = item.id;

    slot.innerHTML = `
      <img
        src="${item.image}"
        alt="${item.name}"
        class="inventory-item-img"
      >
    `;
  });
}

inventorySlots.forEach((slot) => {
  slot.addEventListener("click", () => {
    const itemId = slot.dataset.itemId;

    if (!itemId) {
      console.log("빈 슬롯");
      return;
    }

    selectItem(itemId);
  });
});

function selectItem(itemId) {
  window.selectedItemId = itemId;
  console.log(`${itemId} 아이템 선택`);
}

/* ========================= */
/* 모달 공통 */
/* ========================= */

function showModal(modalId) {
  document.querySelectorAll(".investigate-overlay").forEach((modal) => {
    modal.classList.add("hidden");
  });

  const modal = document.querySelector(`#${modalId}`);

  if (!modal) {
    console.error(`${modalId} 모달을 찾을 수 없습니다.`);
    return;
  }

  modal.classList.remove("hidden");

  const screenBack = document.querySelector(".screen-back");
  if (screenBack) {
    screenBack.classList.add("hidden");
  }
}

function closeAllModals() {
  document.querySelectorAll(".investigate-overlay").forEach((modal) => {
    modal.classList.add("hidden");
  });

  const screenBack = document.querySelector(".screen-back");
  if (screenBack) {
    screenBack.classList.remove("hidden");
  }

  passwordInput = "";
  isPasswordMode = false;
  currentPasswordModalId = null;
}

/* ========================= */
/* 선반 모달 흐름 */
/* ========================= */

function openShelfModal() {
  showModal("shelfModal1");
}

/* 1단계에서 상자 클릭 → 4단계 */
function openSafeModalFromStep1() {
  console.log("1단계에서 상자 조사");

  showModal("shelfModal4");

  passwordInput = "";
  isPasswordMode = true;
  currentPasswordModalId = "shelfModal4";

  updatePasswordDisplay(currentPasswordModalId);
}

/* 2단계에서 상자 클릭 → 3단계 */
function openSafeModal() {
  console.log("2단계에서 상자 조사");

  showModal("shelfModal3");

  passwordInput = "";
  isPasswordMode = true;
  currentPasswordModalId = "shelfModal3";

  updatePasswordDisplay(currentPasswordModalId);
}

function focusPasswordInput() {
  isPasswordMode = true;
  console.log("비밀번호 입력 대기");
}

/* ========================= */
/* 비밀번호 입력 */
/* ========================= */

document.addEventListener("keydown", (event) => {
  if (!isPasswordMode || !currentPasswordModalId) return;

  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    if (passwordInput.length < 4) {
      passwordInput += key;
      updatePasswordDisplay(currentPasswordModalId);
    }
  }

  if (key === "Backspace") {
    passwordInput = passwordInput.slice(0, -1);
    updatePasswordDisplay(currentPasswordModalId);
  }

  if (key === "Enter") {
    submitPassword();
  }
});

function updatePasswordDisplay(modalId) {
  const modal = document.querySelector(`#${modalId}`);
  if (!modal) return;

  const pw = passwordInput.padEnd(4, "_");

  modal.querySelector(".pw1").textContent = pw[0];
  modal.querySelector(".pw2").textContent = pw[1];
  modal.querySelector(".pw3").textContent = pw[2];
  modal.querySelector(".pw4").textContent = pw[3];
}

/*여기서부터*/

async function submitPassword() {
  if (!currentPasswordModalId) return;

  const currentModal = document.querySelector(`#${currentPasswordModalId}`);
  const text = currentModal.querySelector(".investigate-text");

  if (passwordInput.length !== 4) {
    text.textContent = "비밀번호 4자리를 입력해야 합니다.";
    return;
  }

  if (passwordInput === "3962") {
    showModal("shelfModal5");
    passwordInput = "";
    isPasswordMode = false;
    currentPasswordModalId = null;
    return;
  }

  text.textContent = "비밀번호가 일치하지 않습니다.";
  passwordInput = "";
  updatePasswordDisplay(currentPasswordModalId);
}

/* 
async function submitPassword() {
  if (!currentPasswordModalId) return;

  const currentModal = document.querySelector(`#${currentPasswordModalId}`);
  const text = currentModal.querySelector(".investigate-text");

  if (passwordInput.length !== 4) {
    text.textContent = "비밀번호 4자리를 입력해야 합니다.";
    return;
  }

  try {
    const response = await fetch("/api/puzzle/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        puzzleId: "safe_box",
        answer: passwordInput,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showModal("shelfModal5");
      passwordInput = "";
      isPasswordMode = false;
      currentPasswordModalId = null;
      return;
    }

    text.textContent = "비밀번호가 일치하지 않습니다.";
    passwordInput = "";
    updatePasswordDisplay(currentPasswordModalId);
  } catch (error) {
    console.error("비밀번호 확인 실패:", error);

    text.textContent = "비밀번호가 일치하지 않습니다.";
    passwordInput = "";
    updatePasswordDisplay(currentPasswordModalId);
  }
}
*/

/* ========================= */
/* 공통 조사 모달 */
/* ========================= */
const infoModalData = {
  memo: {
    image: "../images/memo.png",
    text: "메모가 있다.",
  },
  poster: {
    image: "../images/poster.png",
    text: "이상한 포스터다.",
  },
  book: {
    image: "../images/book.png",
    text: "낡은 책이다.",
  },
};

function openInfoModal(type) {
  const data = infoModalData[type];

  document.querySelector("#infoModalImage").src = data.image;
  document.querySelector("#infoModalText").textContent = data.text;

  showModal("infoModal");
}

/* ========================= */
/* 일지 조사 모달 */
/* ========================= */

function openPaperModal() {
  showModal("paperModal");
}

function getPaper() {
  addItemToInventory({
    id: "paper",
    name: "일지",
    image: "../images/paper_piece.png",
  });

  closeAllModals();
}

/* ========================= */
/* 현미경 모달 */
/* ========================= */
/* 여기서부터*/
function openMicroscopeModal() {
  showModal("microscopeModal1");
}

function useScope() {
  const hasScope = inventoryItems.some((item) => item.id === "scope");

  // 스코프 있음
  if (hasScope) {
    showModal("microscopeModal2");
    return;
  }

  // 스코프 없음
  showModal("microscopeModal3");
}
/*
async function useScope() {
  try {
    const response = await fetch("/api/inventory/check-scope");
    const data = await response.json();

    // scope 있음
    if (data.hasScope) {
      showModal("microscopeModal2");
      return;
    }

    // scope 없음
    showModal("microscopeModal3");

  } catch (error) {
    console.error(error);
  }
}
*/

/* ========================= */
/* 아이템 인벤토리 추가 */
/* ========================= */

function addItemToInventory(item) {
  const alreadyHasItem = inventoryItems.some(
    (inventoryItem) => inventoryItem.id === item.id,
  );

  if (alreadyHasItem) {
    console.log("이미 획득한 아이템");
    return;
  }

  if (inventoryItems.length >= 8) {
    console.log("인벤토리가 가득 찼습니다.");
    return;
  }

  inventoryItems.push(item);
  renderInventory(inventoryItems);
}

function getBattery() {
  addItemToInventory({
    id: "battery",
    name: "건전지",
    image: "../images/battery.png",
  });

  showModal("shelfModal2");
}

function getCardKey() {
  addItemToInventory({
    id: "cardkey",
    name: "카드키",
    image: "../images/cardkey.png",
  });

  showModal("shelfModal6");
}

/* ========================= */
/* 초기 실행 */
/* ========================= */

loadInventory();
