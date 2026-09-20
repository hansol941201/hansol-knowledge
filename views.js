// 대시보드 화면 구성 — 자료를 받아 HTML 글자를 돌려주기만 한다.
//
// 여기에는 저장·불러오기도, 클릭 처리도 없다. 그래서 디자인을 고칠 때
// 이 파일과 styles.css 만 보면 되고, 자료나 기능이 함께 망가지지 않는다.
// 필요한 잔심부름(글자 이스케이프·아이콘 등)은 setup() 으로 받아 둔다.
(function (global) {
  'use strict';

  let helper = {
    escapeHtml: (text) => String(text == null ? '' : text),
    icon: () => '',
    todoDateState: () => 'none',
    todoDoneShort: () => '',
    todoDoneLabel: () => '',
    scheduleDayTitle: (key) => String(key || ''),
    scheduleBadge: () => '',
    shortcutHref: (url) => String(url || ''),
    shortcutBadge: (item) => String((item && item.name) || '?'),
    thumbImage: () => ''
  };
  function setup(parts) { helper = Object.assign({}, helper, parts || {}); }

  // 왼쪽: 통화 & 빠른 메모 — 한 줄 입력으로 할 일을 넣고, 아래에 긴 통화 기록을 적는다.
  function memoPanel() {
    return `
    <div class="memo-head">
      <h2>📞 통화 &amp; 빠른 메모</h2>
      <small>엔터(Enter)는 왼쪽 할 일 목록으로 · Shift+Enter는 줄바꿈</small>
    </div>
    <textarea id="memoNote" rows="9"
      placeholder="통화 내용이나 할 일을 적으세요...&#10;엔터를 누르면 왼쪽 할 일 목록에 들어갑니다.&#10;길게 적은 뒤 [추가]를 누르면 기억 저장소에 담깁니다."></textarea>
    <div class="memo-tools">
      <label class="memo-file">📷 사진/파일 첨부<input id="memoFile" type="file" accept="image/*" hidden /></label>
      <button type="button" id="memoQuickAdd" class="memo-add-btn">추가 → 기억 저장소</button>
    </div>`;
  }

  // 오른쪽 위: 할 일 목록 — 체크 + 별표(중요) + 제목 한 줄, 오른쪽 끝에 지우기(✕)
  // 별표를 누른 것은 맨 위로 올라오고 제목에 형광펜이 그어진다.
  function todoSimpleList(list) {
    return `<ul class="todo-list">${list.map(todo => `
      <li class="todo-line${todo.starred ? ' star' : ''}" data-todo-id="${todo.id}">
        <label class="todo-line-check" title="완료 표시"><input type="checkbox" /><span class="todo-box"></span></label>
        <button type="button" class="todo-star" data-todo-star
          title="${todo.starred ? '중요 표시 끄기' : '중요 표시'}"
          aria-pressed="${todo.starred ? 'true' : 'false'}">${todo.starred ? '★' : '☆'}</button>
        <span class="todo-line-text" title="${helper.escapeHtml(todo.text)}"><span class="todo-mark">${helper.escapeHtml(todo.text)}</span></span>
        ${todo.date ? `<time class="${helper.todoDateState(todo)}">${helper.escapeHtml(todo.date)}</time>` : ''}
        <button type="button" class="todo-x" data-todo-delete title="지우기">✕</button>
      </li>`).join('')}</ul>`;
  }
  function todoDoneSimpleList(list) {
    return `<ul class="todo-list">${list.map(todo => `
      <li class="todo-line done" data-todo-id="${todo.id}">
        <label class="todo-line-check" title="완료 취소"><input type="checkbox" checked /><span class="todo-box done"></span></label>
        <span class="todo-line-text" title="${helper.escapeHtml(todo.text)}">${helper.escapeHtml(todo.text)}</span>
        ${todo.date ? `<time class="muted">${helper.escapeHtml(todo.date)}</time>` : ''}
        <time title="완료 ${helper.escapeHtml(helper.todoDoneLabel(todo))}">완료 ${helper.escapeHtml(helper.todoDoneShort(todo))}</time>
        <button type="button" class="todo-x" data-todo-purge title="영구 삭제">✕</button>
      </li>`).join('')}</ul>`;
  }

  // ── 일정 ────────────────────────────────────────────────
  // 같은 날짜끼리 묶어서 날짜 머리글 아래에 나란히 보여 준다.
  function scheduleGroups(rows) {
    const groups = [];
    for (const item of rows) {
      const last = groups[groups.length - 1];
      if (last && last.date === item.date) last.items.push(item);
      else groups.push({ date: item.date, items: [item] });
    }
    return groups.map(group => `
    <div class="schedule-group">
      <div class="schedule-group-head">
        <b>${helper.escapeHtml(helper.scheduleDayTitle(group.date))}</b>
        ${helper.scheduleBadge(group.date) ? `<em class="schedule-badge">${helper.scheduleBadge(group.date)}</em>` : ''}
        <span class="schedule-group-count">${group.items.length}건</span>
      </div>
      ${group.items.map(item => `
        <div class="schedule-row" data-schedule="${item.id}">
          ${item.time ? `<span class="schedule-date">${helper.escapeHtml(item.time)}</span>` : '<span class="schedule-date muted">종일</span>'}
          <div class="schedule-body">
            <b>${helper.escapeHtml(item.title)}</b>
            ${item.memo ? `<small>${helper.escapeHtml(item.memo)}</small>` : ''}
          </div>
          <button type="button" class="schedule-more" data-row-menu title="수정·삭제">${helper.icon('more', 14)}</button>
        </div>`).join('')}
    </div>`).join('');
  }

  // ── 즐겨찾기 카드 ───────────────────────────────────────
  function shortcutGrid(list) {
    return list.map(item => `
    <div class="shortcut" data-shortcut="${item.id}" draggable="true">
      <a href="${helper.escapeHtml(helper.shortcutHref(item.url))}" target="_blank" rel="noopener noreferrer" title="${helper.escapeHtml(item.name)}">
        <span class="shortcut-thumb">${item.image
          ? helper.thumbImage(item.image)
          : `<span class="shortcut-badge">${helper.escapeHtml(helper.shortcutBadge(item))}</span>`}</span>
        <b>${helper.escapeHtml(item.name)}</b>
      </a>
      <button type="button" class="shortcut-more" data-row-menu data-shortcut-edit title="수정·삭제">${helper.icon('more', 14)}</button>
    </div>`).join('') + `
    <button type="button" class="shortcut add" id="shortcutAdd">${helper.icon('plus', 18)}<b>사이트 추가</b></button>`;
  }

  global.HANSOL_VIEWS = {
    setup,
    memoPanel, todoSimpleList, todoDoneSimpleList,
    scheduleGroups, shortcutGrid
  };
})(window);
