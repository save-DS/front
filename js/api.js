/**
 * 백엔드 API 클라이언트.
 * Flask 서버(localhost:5050)의 모든 엔드포인트를 감싼다.
 */

const API_BASE = "http://localhost:5050";

/**
 * 공통 fetch 래퍼.
 * 성공 시 응답 JSON 반환, 실패(success:false) 시에도 그대로 반환 (호출부에서 처리).
 */
async function request(path, { method = "GET", body = null } = {}) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error_code: "NETWORK_ERROR",
      message: "서버에 연결할 수 없습니다. 백엔드가 켜져 있나요? (localhost:5050)",
    };
  }
}

const API = {
  // ---- 게임 라이프사이클 ----
  initGame: () => request("/api/game/init", { method: "POST" }),
  getState: () => request("/api/game/state"),
  resetGame: () => request("/api/game/reset", { method: "POST" }),

  // ---- 모드 전환 ----
  switchMode: (target_mode) =>
    request("/api/mode/switch", { method: "POST", body: { target_mode } }),

  // ---- 시점 ----
  turnView: (direction) =>
    request("/api/view/turn", { method: "POST", body: { direction } }),
  currentView: () => request("/api/view/current"),
  viewBack: () => request("/api/view/back", { method: "POST" }),

  // ---- 조사 ----
  investigate: (object_id) =>
    request("/api/investigate", { method: "POST", body: { object_id } }),

  // ---- 오브젝트 안의 아이템 직접 꺼내기 (상세 팝업 핫스팟용) ----
  takeItem: (object_id, item_id) =>
    request("/api/object/take", { method: "POST", body: { object_id, item_id } }),

  // ---- 인벤토리 ----
  getInventory: () => request("/api/inventory"),
  useItem: (item_id, target_id) =>
    request("/api/inventory/use", { method: "POST", body: { item_id, target_id } }),

  // ---- 퍼즐 ----
  submitPuzzle: (puzzle_id, answer) =>
    request("/api/puzzle/submit", { method: "POST", body: { puzzle_id, answer } }),
  combineClues: (puzzle_id, clue_ids) =>
    request("/api/puzzle/combine", { method: "POST", body: { puzzle_id, clue_ids } }),

  // ---- 방 이동 ----
  moveRoom: (target_room_id) =>
    request("/api/move/room", { method: "POST", body: { target_room_id } }),

  // ---- 미로 ----
  mazeMap: () => request("/api/maze/map"),
  mazeMove: (direction) =>
    request("/api/maze/move", { method: "POST", body: { direction } }),
  mazeRegenerate: () => request("/api/maze/regenerate", { method: "POST" }),

  // ---- 힌트 ----
  hintMaze: () => request("/api/hint/maze"),
  hintPuzzle: (puzzle_id) => request(`/api/hint/puzzle?puzzle_id=${puzzle_id}`),
  hintProgress: () => request("/api/hint/progress"),
  hintItemUse: () => request("/api/hint/item-use"),
  askHint: (question) =>
    request("/api/hint/ask", { method: "POST", body: { question } }),

  // ---- UI 보조 ----
  uiClues: () => request("/api/ui/clues"),
  uiMinimap: () => request("/api/ui/minimap"),
  eventsPending: (mode = "peek") => request(`/api/events/pending?mode=${mode}`),
};
