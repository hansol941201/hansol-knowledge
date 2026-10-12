(function () {
  let sequence = 0, controller, signature = '', lastQuestion = '', activeTarget;
  const box = () => activeTarget || document.getElementById('aiAnswer');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const format = value => escape(value).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  function message(text) { box().classList.remove('hidden'); box().textContent = text; }
  function clear() { sequence++; controller?.abort(); box().classList.add('hidden'); box().replaceChildren(); lastQuestion = ''; }
  async function ask(question, sync, target) {
    clear(); question = question.trim(); if (!question) return;
    activeTarget = target || document.getElementById('aiAnswer');
    activeTarget.dataset.aiAnswer = 'true';
    lastQuestion = question;
    const current = sequence;
    if (question.length > 1000) return message('질문은 1,000자 이내로 입력해 주세요. 긴 원문은 지식 추가 또는 기록 저장으로 넣어 주세요.');
    if (!window.HANSOL_AUTH?.currentUser) return message('AI 검색은 동기화 로그인 후 사용할 수 있어요. 기존 자료 검색은 아래에서 확인할 수 있습니다.');
    controller = new AbortController();
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 550000);
    let elapsed;
    try {
      message('최신 기록 동기화 확인 중…');
      const result = await sync();
      if (current !== sequence) return;
      if (!result.verified) throw new Error('수정·삭제 내용을 동기화하지 못했어요. 연결 후 다시 검색해 주세요.');
      message('전체 원문 색인 확인 및 의미 검색 중… 처음 검색하는 긴 기록은 시간이 걸릴 수 있어요.');
      elapsed = setTimeout(() => { if (current === sequence) message('긴 기록의 색인·검색·답변을 처리 중입니다. 완료될 때까지 기다려 주세요. 실패하면 별도로 안내합니다.'); }, 15000);
      const token = await window.HANSOL_AUTH.currentUser.getIdToken();
      const response = await fetch(window.HANSOL_AI_CONFIG.endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ question }), signal: requestController.signal });
      if (current !== sequence) return;
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('AI 서버가 아직 연결되지 않았어요. 서버 배포와 API 키 설정이 필요합니다.');
      const answer = await response.json();
      if (!response.ok) throw new Error(answer.error || 'AI 검색 연결에 실패했습니다.');
      if (current !== sequence) return;
      const lines = answer.lines;
      if (!Array.isArray(lines) || !Array.isArray(answer.citations)) throw new Error('AI 답변을 확인하지 못했습니다.');
      const contents = answer.format === 'steps' ? `<ol>${lines.map(line => `<li>${format(line)}</li>`).join('')}</ol>` : lines.map(line => `<p>${format(line)}</p>`).join('');
      box().innerHTML = `${answer.status === 'conflict' ? '<strong class="ai-conflict">확인 필요</strong>' : ''}<div class="ai-answer-text">${contents}</div><div class="ai-answer-tools">${answer.citations.length ? '<button type="button" data-evidence aria-expanded="false">근거 보기</button>' : ''}<button type="button" data-copy-answer>답변 복사</button></div><div class="ai-evidence hidden">${answer.citations.map(c => `<article><strong>${escape(c.title)}</strong><blockquote>${escape(c.quote)}</blockquote></article>`).join('')}</div>`;
      box().querySelector('[data-evidence]')?.addEventListener('click', event => {
        const hidden = box().querySelector('.ai-evidence').classList.toggle('hidden');
        event.currentTarget.setAttribute('aria-expanded', String(!hidden));
      });
      box().querySelector('[data-copy-answer]').onclick = async event => {
        try { await navigator.clipboard.writeText(`${answer.status === 'conflict' ? '확인 필요\n' : ''}${lines.map((line, i) => `${answer.format === 'steps' ? `${i + 1}. ` : ''}${line.replace(/\*\*/g, '')}`).join('\n')}`); event.target.textContent = '복사됨'; }
        catch { event.target.textContent = '복사 실패 · 텍스트를 선택해 주세요'; }
      };
    } catch (error) {
      if (current === sequence) message(error.name === 'AbortError' ? 'AI 검색 처리 시간이 초과됐어요. 잠시 후 다시 검색해 주세요.' : error instanceof TypeError ? 'AI 서버에 연결하지 못했어요. 서버 배포·API 키 설정과 인터넷 연결을 확인해 주세요.' : error.message);
    } finally { clearTimeout(timeout); clearTimeout(elapsed); }
  }
  function changed(state) {
    const next = JSON.stringify(state);
    if (signature && signature !== next && lastQuestion) {
      sequence++; controller?.abort(); message('기록이 변경됐어요. 검색 버튼을 눌러 최신 기록으로 다시 질문해 주세요.');
    }
    signature = next;
  }
  window.addEventListener('storage-status', event => {
    const target = document.getElementById('storageStatus');
    if (target) { target.textContent = event.detail.message; target.dataset.error = String(event.detail.ok === false); }
  });
  window.HANSOL_AI = { ask, clear, changed };
})();
