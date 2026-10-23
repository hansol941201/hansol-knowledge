(() => {
  const key = 'knowledge-background-v1';
  const dialog = document.getElementById('backgroundDialog');
  const mode = document.getElementById('backgroundMode');
  const color = document.getElementById('backgroundColor');
  const file = document.getElementById('backgroundFile');
  const status = document.getElementById('backgroundStatus');
  let saved = { mode: 'default', color: '#33474e', image: '' };
  let draftImage = '';
  try { Object.assign(saved, JSON.parse(localStorage.getItem(key) || '{}')); } catch { /* 기본 배경 유지 */ }
  function apply(value) {
    const body = document.body;
    body.style.removeProperty('background');
    if (value.mode === 'color' && /^#[0-9a-f]{6}$/i.test(value.color)) {
      body.style.background = value.color;
    } else if (value.mode === 'image' && /^data:image\/(jpeg|png|webp);base64,/.test(value.image)) {
      body.style.background = `linear-gradient(rgba(12,29,38,.18),rgba(12,29,38,.18)), url("${value.image}") center / cover no-repeat fixed`;
    }
  }
  apply(saved);
  document.getElementById('backgroundOpen').onclick = () => {
    mode.value = saved.mode;
    color.value = saved.color;
    draftImage = saved.image;
    file.value = '';
    status.textContent = '';
    dialog.showModal();
  };
  file.onchange = async () => {
    const selected = file.files[0];
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      status.textContent = 'JPG·PNG·WebP 이미지를 선택해 주세요.';
      return;
    }
    status.textContent = '이미지를 준비하고 있습니다…';
    try {
      const bitmap = await createImageBitmap(selected);
      const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      draftImage = canvas.toDataURL('image/webp', 0.85);
      mode.value = 'image';
      status.textContent = '이미지가 준비되었습니다. 저장을 눌러 적용하세요.';
    } catch {
      status.textContent = '이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.';
    }
  };
  color.oninput = () => { mode.value = 'color'; };
  document.getElementById('backgroundReset').onclick = () => {
    mode.value = 'default';
    color.value = '#33474e';
    draftImage = '';
    file.value = '';
    status.textContent = '저장을 누르면 기본 배경으로 돌아갑니다.';
  };
  document.getElementById('backgroundCancel').onclick = () => dialog.close();
  document.getElementById('backgroundForm').onsubmit = event => {
    event.preventDefault();
    if (mode.value === 'image' && !draftImage) {
      status.textContent = '배경 이미지를 먼저 선택해 주세요.';
      return;
    }
    const next = { mode: mode.value, color: color.value, image: draftImage };
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {
      status.textContent = '저장 공간이 부족합니다. 더 작은 이미지로 다시 시도해 주세요.';
      return;
    }
    saved = next;
    apply(saved);
    dialog.close();
  };
})();
