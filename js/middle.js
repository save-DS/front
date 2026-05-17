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
/* 공통 조사 모달 */
/* ========================= */
const infoModalData = {
  shelf: {
    image: "../images/shelf.png",
    text: "메모가 있다.",
  },
  plant: {
    image: "../images/plant.png",
    text: "이상한 포스터다.",
  },
  calender: {
    image: "../images/calender.png",
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
/* 아이템 인벤토리 추가 */
/* ========================= */

function addItemToInventory(item) {
  const alreadyHasItem = inventoryItems.some(
    (inventoryItem) => inventoryItem.id === item.id
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