#!/usr/bin/env python3
"""엑셀에 정리된 특허 목록을 patents.js 에 합칩니다(덮어쓰지 않고 추가).

    python3 tools/add_patents_from_xlsx.py 목록.xlsx

엑셀은 머리글 없이 아래 순서로 봅니다.
    0 등록번호(또는 공법·신기술 이름)  1 (빈칸)  2 업체  3 공법명  4 명칭  5 명칭(보조)
이미 patents.js 에 있는 번호는 건너뜁니다.
"""
import io
import json
import re
import sys

import pandas as pd

PATENTS_JS = 'patents.js'
HEADER = (
    '// POUR 특허 리스트.xlsx 에서 생성한 특허·상표·디자인 목록입니다.\n'
    '// 직접 고치지 말고 원본 엑셀을 갱신한 뒤 build_patents_js.py 를 다시 돌리세요.\n'
    '// 다른 업체 특허는 tools/add_patents_from_xlsx.py 로 덧붙입니다.\n'
    'window.PATENTS = [\n'
)
KIND_BY_PREFIX = {'10': '특허', '20': '실용신안', '30': '디자인', '40': '상표'}
# 엑셀에 소프트하이픈(U+00AD)이나 각종 대시가 섞여 있어 전부 보통 하이픈으로 맞춘다.
DASHES = '­‐‑‒–—−'
NUMBER_RE = re.compile(r'^(\d{2})-(\d{5,8})$')


def clean(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ''
    text = str(value)
    for dash in DASHES:
        text = text.replace(dash, '-')
    return re.sub(r'\s+', ' ', text).strip()


def digits(text):
    return re.sub(r'[^0-9]', '', str(text or ''))


def load_existing():
    source = io.open(PATENTS_JS, encoding='utf-8').read()
    return json.loads(source[source.index('['):source.rindex(']') + 1])


def write(records):
    lines = [json.dumps(item, ensure_ascii=False, sort_keys=True) for item in records]
    io.open(PATENTS_JS, 'w', encoding='utf-8').write(HEADER + ''.join(f'  {line},\n' for line in lines) + '];\n')


def main(path):
    existing = load_existing()
    seen_numbers = {digits(item.get('num')) for item in existing if digits(item.get('num'))}
    seen_names = {clean(item.get('name')) for item in existing if clean(item.get('name'))}

    frame = pd.read_excel(path, header=None)
    added, skipped_existing, skipped_empty = [], 0, 0

    for _, row in frame.iterrows():
        cells = [clean(row[column]) if column in row else '' for column in range(6)]
        first, _blank, owner, method, name, alt_name = cells
        match = NUMBER_RE.match(first)
        number = f'제 {match.group(1)}-{match.group(2)}호' if match else ''
        kind = KIND_BY_PREFIX.get(match.group(1), '특허') if match else '특허'

        # 번호만 있고 이름이 없으면 명칭은 비워 둔다(번호를 두 번 보여 주지 않는다).
        title = name or alt_name or method or ('' if number else first)
        if not title and not number:
            skipped_empty += 1
            continue

        if number and digits(number) in seen_numbers:
            skipped_existing += 1
            continue
        if not number and title and title in seen_names:
            skipped_existing += 1
            continue

        # 화면에 안 나오는 나머지 표기도 검색으로는 찾히도록 별칭에 모아 둔다.
        aliases = [value for value in (first if not match else '', alt_name if alt_name != title else '', method)
                   if value and value != title]
        added.append({
            'aliases': sorted(set(aliases)),
            'appDate': '', 'appNum': '', 'gongbeop': method, 'gongjong': [],
            'inventor': '', 'kind': kind, 'name': title, 'no': '',
            'num': number, 'owner': owner, 'regDate': '', 'status': '',
        })
        if number:
            seen_numbers.add(digits(number))
        if title:
            seen_names.add(title)

    write(existing + added)
    print(f'기존 {len(existing)}건 + 추가 {len(added)}건 = {len(existing) + len(added)}건')
    print(f'건너뜀: 이미 있음 {skipped_existing}건, 내용 없음 {skipped_empty}건')


if __name__ == '__main__':
    main(sys.argv[1])
