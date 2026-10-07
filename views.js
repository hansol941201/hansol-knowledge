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

  // 전화 메모: 입력 영역은 패널을 채우고, 저장 버튼과 보관함 팝업을 분리한다.
  function memoPanel() {
    return `
    <div class="memo-head">
      <h2>전화 메모</h2>
    </div>
    <div class="memo-note-shell">
      <textarea id="memoNote" rows="20" aria-label="통화내용" placeholder="통화 내용을 넉넉하게 적으세요..."></textarea>
      <div class="memo-character" aria-hidden="true"><img src="theme-art/potato-couple-transparent.png" alt="" /></div>
    </div>
    <div class="memo-tools">
      <label class="memo-file">📷 사진/파일 첨부<input id="memoFile" type="file" accept="image/*" hidden /></label>
      <button type="button" id="memoQuickAdd" class="memo-add-btn">메모 저장</button>
      <button type="button" class="memo-add-btn" style="margin-left:auto" onclick="document.getElementById('phoneArchiveDialog').showModal()">전화메모 보관함 열기</button>
    </div>
    <dialog id="phoneArchiveDialog" aria-label="전화메모 보관함"
      onclick="if(event.target===this)this.close()"
      style="width:min(760px,92vw);max-height:78vh;padding:0;border:1px solid #e5dfe3;border-radius:18px;background:#fffafc;box-shadow:0 24px 70px rgba(80,55,68,.22);overflow:hidden">
      <section class="phone-archive" style="display:flex;flex-direction:column;max-height:78vh;background:#fffafc">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-bottom:1px solid #eee0e6">
          <div><h3 style="margin:0;font-size:18px">전화메모 보관함</h3><small style="display:block;margin-top:4px;color:#9a8390">저장한 전화메모를 한곳에서 확인하고 삭제할 수 있어요.</small></div>
          <button type="button" aria-label="닫기" onclick="this.closest('dialog').close()" style="width:34px;height:34px;border-radius:10px;font-size:21px;background:#f6e9ed;color:#796976">×</button>
        </div>
        <div id="phoneArchiveList" class="call-notes-list" style="min-height:260px;max-height:58vh;overflow:auto;padding:16px 20px 22px"></div>
      </section>
    </dialog>`;
  }

  // 오른쪽 위: 할 일 목록 — 체크 + 별표(중요) + 제목 한 줄, 오른쪽 끝에 지우기(✕)
  // 별표를 누른 것은 맨 위로 올라가고 제목에 형광펜이 그어진다.
  function todoSimpleList(list) {
    return `<ul class="todo-list">${list.map(todo => `
      <li class="todo-line${todo.starred ? ' star' : ''}" data-todo-id="${todo.id}">
        <label class="todo-line-check" title="완료 표시"><input type="checkbox" /><span class="todo-box"></span></label>
        <button type="button" class="todo-star" data-todo-star
          title="${todo.starred ? '중요 표시 끄기' : '중요 표시'}"
          aria-pressed="${todo.starred ? 'true' : 'false'}">${todo.starred ? '★' : '☆'}</button>
        <span class="todo-line-text" title="${helper.escapeHtml(todo.text)}"><span class="todo-mark">${helper.escapeHtml(todo.text)}</span></span>
        ${todo.date ? `<time class="${helper.todoDateState(todo)}">${helper.escapeHtml(String(todo.date).slice(5).replace("-", "/"))}</time>` : ''}
        <button type="button" class="todo-x" data-todo-delete title="지우기">✕</button>
      </li>`).join('')}</ul>`;
  }
  function todoDoneSimpleList(list) {
    return `<ul class="todo-list">${list.map(todo => `
      <li class="todo-line done" data-todo-id="${todo.id}">
        <label class="todo-line-check" title="완료 취소"><input type="checkbox" checked /><span class="todo-box done"></span></label>
        <span class="todo-line-text" title="${helper.escapeHtml(todo.text)}">${helper.escapeHtml(todo.text)}</span>
        ${todo.date ? `<time class="muted">${helper.escapeHtml(String(todo.date).slice(5).replace("-", "/"))}</time>` : ''}
        <time title="완료 ${helper.escapeHtml(helper.todoDoneLabel(todo))}">완료 ${helper.escapeHtml(helper.todoDoneShort(todo))}</time>
        <button type="button" class="todo-x" data-todo-purge title="영구 삭제">✕</button>
      </li>`).join('')}</ul>`;
  }

  // ── 일정 ────────────────────────────────────────────────
  // 같은 날짜끼리 묶고, 각 일정 행에는 날짜 옆에 일정명을 바로 붙여 한눈에 보이게 한다.
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
      ${group.items.map(item => {
        const shortDate = String(item.date || '').slice(5).replace('-', '/');
        return `
        <div class="schedule-row" data-schedule="${item.id}" data-date="${helper.escapeHtml(shortDate)}" title="${helper.escapeHtml(`${item.date} ${item.time || ''} · ${item.title}`)}">
          <span class="schedule-date">${helper.escapeHtml(shortDate)}</span>
          <div class="schedule-body">
            <b>${helper.escapeHtml(item.title)}</b>
            ${item.time ? `<small>${helper.escapeHtml(item.time)}</small>` : ''}
            ${item.memo ? `<small>${helper.escapeHtml(item.memo)}</small>` : ''}
          </div>
          <button type="button" class="schedule-more" data-row-menu title="수정·삭제">${helper.icon('more', 14)}</button>
        </div>`;
      }).join('')}
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
