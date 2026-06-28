export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, ai, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  const SYSTEM = `Ти AI-асистент діловодця (Шершун Олександр Петрович) самохідної артилерійської батареї 2-го артилерійського дивізіону (САБ 2АДн) Збройних Сил України.

Твої завдання:
- Відповідати на питання про особовий склад, відпустки, ДВ, відрядження, ВЛК
- Допомагати готувати документи (накази, списки, звітності)
- Аналізувати дані з таблиць
- Відправляти повідомлення в групу WhatsApp "САБ"

Дані підрозділу:
- Командир батареї: капітан Мураховський Владислав Григорович
- Головний сержант: сержант Корчевний Сергій Олександрович
- Діловод: молодший сержант Шершун Олександр Петрович
- Всього посад за штатом: 59 (36 бійців + ваканти)

Відповідай УКРАЇНСЬКОЮ мовою, коротко і по суті. Якщо питання про конкретні дати відпусток — зверни увагу, що потрібно перевірити таблицю. Якщо просять документ — запитай деталі і підготуй текст.`;

  try {
    let reply = '';

    // ── CLAUDE ──────────────────────────────────────────────────────────────
    if (ai === 'claude') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('Claude API ключ не налаштований (ANTHROPIC_API_KEY)');

      const msgs = history
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      msgs.push({ role: 'user', content: message });

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM,
          messages: msgs,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `Claude HTTP ${resp.status}`);
      reply = data.content?.[0]?.text || 'Порожня відповідь від Claude';

    // ── GEMINI ───────────────────────────────────────────────────────────────
    } else if (ai === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error('Gemini API ключ не налаштований (GEMINI_API_KEY)');

      // Будуємо multi-turn history для Gemini
      const contents = [];
      for (const m of history.filter(m => m.role !== 'system').slice(-10)) {
        contents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        });
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM }] },
            contents,
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `Gemini HTTP ${resp.status}`);
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Порожня відповідь від Gemini';

    // ── GPT ──────────────────────────────────────────────────────────────────
    } else if (ai === 'gpt') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('GPT API ключ не налаштований (OPENAI_API_KEY)');

      const msgs = [{ role: 'system', content: SYSTEM }];
      for (const m of history.filter(m => m.role !== 'system').slice(-10)) {
        msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
      }
      msgs.push({ role: 'user', content: message });

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1024, messages: msgs }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `GPT HTTP ${resp.status}`);
      reply = data.choices?.[0]?.message?.content || 'Порожня відповідь від GPT';

    } else {
      throw new Error(`Невідомий AI: ${ai}`);
    }

    return res.json({ reply });

  } catch (e) {
    console.error('[chat]', e.message);
    return res.status(500).json({ error: e.message });
  }
}
