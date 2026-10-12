'use strict';
class OpenAIProvider {
  constructor(key) { this.key = key; this.embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'; }
  async request(path, payload) {
    if (!this.key) throw new Error('AI 서버에 OPENAI_API_KEY 설정이 필요합니다.');
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`https://api.openai.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(90000) });
      if (response.ok) return response.json();
      if ([429, 500, 502, 503].includes(response.status) && attempt < 2) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
      throw new Error(`AI 제공자 연결 실패 (${response.status}). 서버 키·사용 한도를 확인해 주세요.`);
    }
  }
  async embed(input) {
    const response = await this.request('embeddings', { model: this.embeddingModel, input, encoding_format: 'float' });
    const data = response.data?.sort((a, b) => a.index - b.index).map(row => row.embedding);
    if (data?.length !== input.length || data.some(v => !Array.isArray(v) || !v.length || v.some(n => !Number.isFinite(n)))) throw new Error('임베딩 응답 검증 실패');
    return data;
  }
  async json(name, schema, system, data) {
    const response = await this.request('chat/completions', { model: process.env.ANSWER_MODEL || 'gpt-4.1-mini', temperature: 0, store: false, messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(data) }], response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } } });
    const choice = response.choices?.[0];
    if (choice?.finish_reason !== 'stop' || choice.message.refusal) throw new Error('AI가 답변을 완료하지 못했습니다. 다시 질문해 주세요.');
    return JSON.parse(choice.message.content);
  }
}
module.exports = { OpenAIProvider };
