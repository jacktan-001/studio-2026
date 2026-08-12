import { useState } from 'react'

/**
 * 投稿表单 — 调用 /api/submit（公开接口，带 IP 限流与校验）。
 * 管理员可在 /admin 的「投稿审核」中查看并处理。
 */
export function SubmitForm() {
  const [playlistName, setPlaylistName] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'link' | 'manual' | 'screenshot'>('link')
  const [linkUrl, setLinkUrl] = useState('')
  const [songList, setSongList] = useState('')
  const [tags, setTags] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playlistName.trim() || !authorName.trim()) {
      setState('err')
      setMsg('歌单名称和署名为必填项')
      return
    }
    if (linkUrl.trim() && !/^https?:\/\/.+/.test(linkUrl.trim())) {
      setState('err')
      setMsg('链接需以 http:// 或 https:// 开头')
      return
    }
    setState('sending')
    setMsg('')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          playlistName: playlistName.trim(),
          authorName: authorName.trim(),
          description: description.trim(),
          linkUrl: linkUrl.trim(),
          songList: songList.trim(),
          tags: tags
            .split(/[,，\s]+/)
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 5),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setState('ok')
        setMsg('投稿成功，等待审核 🎉')
        setPlaylistName('')
        setAuthorName('')
        setDescription('')
        setLinkUrl('')
        setSongList('')
        setTags('')
      } else if (res.status === 429) {
        setState('err')
        setMsg('投稿过于频繁，请稍后再试')
      } else {
        setState('err')
        setMsg(json.error || '投稿失败，请稍后重试')
      }
    } catch {
      setState('err')
      setMsg('网络错误，请稍后重试')
    }
  }

  return (
    <form className="wave-submit" onSubmit={submit}>
      <div className="wave-submit-row">
        <label className="wave-submit-field">
          <span>歌单名称 *</span>
          <input
            value={playlistName}
            maxLength={100}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="例如：夏夜骑行歌单"
          />
        </label>
        <label className="wave-submit-field">
          <span>署名 *</span>
          <input
            value={authorName}
            maxLength={50}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="你的名字"
          />
        </label>
      </div>

      <label className="wave-submit-field">
        <span>类型</span>
        <div className="wave-submit-types">
          {(['link', 'manual', 'screenshot'] as const).map((t) => (
            <button
              type="button"
              key={t}
              className={`wave-submit-type ${type === t ? 'is-active' : ''}`}
              onClick={() => setType(t)}
            >
              {t === 'link' ? '链接' : t === 'manual' ? '手动录入' : '截图'}
            </button>
          ))}
        </div>
      </label>

      {type === 'link' && (
        <label className="wave-submit-field">
          <span>歌单链接</span>
          <input
            value={linkUrl}
            maxLength={2048}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://music.example.com/playlist/xxx"
          />
        </label>
      )}

      <label className="wave-submit-field">
        <span>歌单内容（每行一首，可选）</span>
        <textarea
          value={songList}
          maxLength={2000}
          onChange={(e) => setSongList(e.target.value)}
          rows={4}
          placeholder={'夜空中最亮的星 - 逃跑计划\n后来 - 刘若英'}
        />
      </label>

      <label className="wave-submit-field">
        <span>描述（可选）</span>
        <textarea
          value={description}
          maxLength={500}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="说说这个歌单适合的场景或心情"
        />
      </label>

      <label className="wave-submit-field">
        <span>标签（逗号分隔，最多 5 个）</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="通勤, 夜晚, 放松"
        />
      </label>

      {msg && (
        <div className={`wave-submit-msg ${state === 'ok' ? 'is-ok' : 'is-err'}`}>{msg}</div>
      )}

      <button className="wave-submit-btn" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? '提交中…' : '提交投稿'}
      </button>
    </form>
  )
}
