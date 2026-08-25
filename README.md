# 한솔 지식창

HTML/CSS/JavaScript로 만든 개인 지식 메신저입니다. Firebase Firestore를 통해 지식·할 일·임시 계정 정보가 컴퓨터 간 동기화됩니다.

공개 사이트: https://hansol941201.github.io/hansol-knowledge/

## 바로 확인

`index.html`을 더블클릭하면 브라우저에서 UI와 저장·검색 기능을 확인할 수 있습니다.

## Windows 앱 실행

1. Node.js 설치
2. 이 폴더에서 `npm install`
3. `npm start`

Windows 단독 실행 파일은 `npm run pack`으로 생성합니다.
### 실행 파일 내려받기

로그인 없이 아래 주소에서 바로 받을 수 있습니다(항상 최신 빌드).

**https://github.com/hansol941201/hansol-knowledge/releases/latest/download/hansol-knowledge.exe**

main 에 푸시할 때마다 자동으로 빌드해서 `latest` 릴리스로 올립니다.

앱은 실행할 때 배포된 사이트(https://hansol941201.github.io/hansol-knowledge/)를 직접 띄웁니다.
그래서 사이트를 고치면 앱을 다시 받지 않아도 바로 반영되고, 팝업과 웹사이트가 같은 주소·같은
저장 공간·같은 Firebase 문서를 씁니다. 인터넷이 안 되면 실행 파일에 들어 있는 사본으로 열리고,
연결이 돌아온 뒤 팝업을 다시 열면 최신 사이트로 복귀합니다.

## 사용법

- 점 클릭: 지식창 열기
- 메시지 입력: 기존 지식 검색
- 빠른 추가: `시방서 문의 = 심혜진 / 010-9954-7653`
- Esc: 점으로 축소
- Electron 실행 시 Ctrl+Alt+K: 열기/접기

### 팝업 저장 명령어

팝업에 아래처럼 입력하면 자동으로 분류해 저장하고, 같은 Firebase 문서를 쓰는 웹사이트에
새로고침 없이 바로 나타납니다.

| 입력 | 저장 위치 | 저장 후 안내 |
| --- | --- | --- |
| `할일 내용` / `할 일 내용` | `todos` | `✓ 할 일 저장 및 연동 완료` |
| `기록 내용` / `기억 내용` | `memories` | `✓ 기록 저장 및 연동 완료` |
| `지식 제목 \| 내용` | `knowledge` | `✓ 지식 저장 및 연동 완료` |
| 그 외 일반 문장 | `memories` | `✓ 기록 저장 및 연동 완료` |

- `할일` / `기억`만 입력하면 저장하지 않고 목록만 보여 줍니다.
- 일반 문장은 찾은 검색 결과를 보여 준 뒤 문장 자체도 기억 저장소에 남깁니다.
- 항목마다 고유 ID, 원문(`raw`), 생성 시각(`createdAt`), 수정 시각(`updatedAt`),
  입력 출처(`source`)를 함께 저장합니다.
- 인터넷이 끊기면 로컬에 먼저 저장하고, 연결이 복구되면 밀린 항목을 자동으로 올립니다.
- 동기화는 항상 ID 기준 병합입니다. 다른 기기의 자료를 덮어쓰거나 지우지 않습니다.
- 삭제는 삭제 표시로 남겨 두어 다른 기기와 합칠 때 되살아나지 않습니다.

### 저장 경로

팝업이든 사이트 화면이든 저장은 아래 공통 함수만 거칩니다. 같은 배열, 같은 localStorage 키,
같은 Firebase 문서(`shared/state`)를 씁니다.

| 함수 | 하는 일 |
| --- | --- |
| `createTodo(text, source)` | `todos` 배열에 항목 생성 |
| `createMemory(text, source)` | `memories` 배열에 항목 생성 |
| `createKnowledge(title, answer, options)` | `knowledge` 배열에 항목 생성 |
| `saveLocalState()` | 네 배열을 localStorage 에 저장 |
| `saveCloudState({ verifyIds })` | Firebase 에 ID 기준 병합 저장 후, 서버에서 문서를 다시 읽어 확인 |

`commitEntry()` 가 이 순서를 강제합니다:
배열 추가 → `saveLocalState()` → 화면 다시 표시 → `saveCloudState()` → **저장된 문서 확인** →
확인된 경우에만 `✓ … 저장 및 연동 완료`, 아니면 `로컬 저장 완료·클라우드 연동 대기 중`.
`실시간 연동 중` 표시만으로 성공 처리하지 않습니다.

협력업체 카드에는 업체명이 들어간 할 일·기억이 「관련 기록」으로 함께 표시됩니다.

### 통합 검색

사이트 상단 검색창에서 지식 · 할 일 · 기억(기록) · 협력업체 · 계정 · 연락처를 한 번에 찾습니다.

## 동작 확인

```bash
npm install
npm test
```

- `test/entry-check.mjs` — 팝업 입력이 배열 · localStorage · Firebase 문서까지 실제로 들어가는지,
  저장 확인에 실패하면 완료로 표시하지 않는지 점검합니다.
- `test/sync-check.mjs` — Firebase 대역(`test/fake-firebase.js`)을 끼운 브라우저 두 탭으로 팝업 ↔ 사이트
  실시간 연동, 오프라인 보관 후 자동 업로드, ID 기준 병합, 구버전 클라이언트와 섞였을 때의 자동 복구,
  기억 저장소 화면 크기와 날짜 표기를 점검합니다.
- `test/offline-check.mjs` — Firebase 가 아예 안 붙거나 동기화 로그인이 안 된 상태에서도
  팝업 저장과 사이트 표시가 정상인지 점검합니다.

동기화 PIN 창은 언제든 닫을 수 있습니다. 닫아도 저장은 이 컴퓨터에 계속 쌓이고,
상단 연동 상태 배지를 누르면 다시 로그인 창을 열 수 있습니다.
