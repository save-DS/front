/**
 * 프론트엔드 설정.
 * - 배경 이미지별 오브젝트 핫스팟 좌표 (% 단위, 배경에 상대적)
 * - 오브젝트/아이템 상세 이미지 매핑
 *
 * 핫스팟 좌표는 배경 이미지를 보고 대략 맞춘 값.
 * 정밀 조정이 필요하면 left/top/width/height(%)만 수정하면 됨.
 */

// 배경 이미지 (시점별)
const VIEW_BACKGROUNDS = {
  left: "images/left_basic.png",
  center: "images/middle_basic.png",
  right: "images/right_basic.png",
};

// 시점별 오브젝트 핫스팟 (left/top/width/height 모두 % 단위)
const HOTSPOTS = {
  center: {
    whiteboard:  { left: 34, top: 3,  width: 30, height: 22 },
    computer:    { left: 39, top: 28, width: 18, height: 25 },
    calendar:    { left: 57, top: 38, width: 9,  height: 15 },
    desk_drawer: { left: 54, top: 60, width: 16, height: 28 },
    // 책장 버튼을 가로 길이(13)만큼 오른쪽으로 이동
    shelf_book:  { left: 12, top: 10, width: 13, height: 20 },
  },
  right: {
    // 캐비닛 버튼: 가로 절반(11)으로 줄이고 그만큼 오른쪽 이동
    cabinet:         { left: 12, top: 6,  width: 11, height: 72 },
    uv_poster:       { left: 28, top: 4,  width: 26, height: 36 },
    microscope:      { left: 58, top: 38, width: 18, height: 28 },
    bookshelf_right: { left: 28, top: 46, width: 22, height: 30 },
    // 노트 버튼: 세로 길이(10)만큼 아래로 이동
    code_note:       { left: 48, top: 56, width: 8,  height: 10 },
    photo:           { left: 55, top: 22, width: 8,  height: 12 },
  },
  left: {
    escape_door:     { left: 38, top: 12, width: 24, height: 66 },
    // 책장(시계) 버튼: 세로 절반(34)으로 줄이고 원래 위치 기준 가운데 정렬
    bookshelf_clock: { left: 68, top: 27, width: 20, height: 34 },
    newspaper_pile:  { left: 24, top: 70, width: 14, height: 18 },
    rug:             { left: 40, top: 82, width: 26, height: 14 },
    memo_wall:       { left: 86, top: 24, width: 12, height: 28 },
  },
};

// 오브젝트 상세 이미지 (조사 시 확대 화면).
//  - default : 기본
//  - opened  : 이미 조사(아이템 회수)한 뒤 다시 열었을 때
//  - solved  : 연결된 퍼즐을 해결한 뒤
// 캐비닛은 단계가 많아 firstperson.js의 pickImage()에서 별도 처리.
const OBJECT_DETAIL_IMAGES = {
  computer:        { default: "images/computer1.png", solved: "images/computer2.png" },
  desk_drawer:     { default: "images/drawer1.png",   opened: "images/drawer2.png" },
  calendar:        { default: "images/calender.png" },
  microscope:      { default: "images/microscope.png" },
  whiteboard:      { default: "images/whiteboard.png" },
  uv_poster:       { default: "images/poster.png" },
  newspaper_pile:  { default: "images/papers.png" },
  memo_wall:       { default: "images/memo2.png" },
  code_note:       { default: "images/paper.png" },
  photo:           { default: "images/memo.png" },
  rug:             { default: "images/rug.png" },
  shelf_book:      { default: "images/shelf5.png" },
  bookshelf_right: { default: "images/book.png" },
  bookshelf_clock: { default: "images/watch.png" },
  escape_door:     { default: "images/keypad.png" },
};

// 인벤토리 아이템 아이콘
const ITEM_ICONS = {
  battery:          "images/battery.png",
  flashlight:       "images/light.png",
  uv_flashlight:    "images/UVlight.png",
  escape_key:       "images/cardkey.png",
  microscope_scope: "images/scope.png",
  code_note:        "images/paper.png",
};

// 한글 이름 (백엔드가 안 줄 때 폴백용)
const ITEM_NAMES = {
  battery: "건전지",
  flashlight: "손전등",
  uv_flashlight: "UV 손전등",
  escape_key: "탈출키",
  microscope_scope: "현미경 스코프",
  code_note: "코드 노트",
};
