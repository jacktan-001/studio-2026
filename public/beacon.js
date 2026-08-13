// ============================================================
// Jack Tan Studio · 轻量访问统计信标（自托管，无第三方脚本）
// 只上报当前路径与外部来源域名：无 Cookie、无指纹、无持久化访客标识。
// 尊重 DNT；HTTPS 之外不工作；任何异常都不会影响主站。
// 由 /api/collect 聚合入库（KV），/admin「访问统计」查看。
// ============================================================
(function () {
  try {
    if (navigator.doNotTrack === '1' || document.doNotTrack === '1') return
    if (location.protocol !== 'https:') return

    var last = ''
    function send() {
      var path = location.pathname.replace(/\/+$/, '') || '/'
      if (path === last) return
      last = path
      var ref = ''
      try {
        ref = document.referrer ? new URL(document.referrer).host : ''
      } catch (e) {
        ref = ''
      }
      if (ref === location.host) ref = ''
      var body = JSON.stringify({ p: path, r: ref })
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/collect', new Blob([body], { type: 'application/json' }))
      } else {
        fetch('/api/collect', { method: 'POST', body: body, keepalive: true }).catch(function () {})
      }
    }

    send()

    // SPA 路由切换监听：包装 history + popstate（React Router 视图切换不刷新页面）
    function wrap(name) {
      var orig = history[name]
      history[name] = function () {
        var r = orig.apply(this, arguments)
        try {
          send()
        } catch (e) {}
        return r
      }
    }
    wrap('pushState')
    wrap('replaceState')
    window.addEventListener('popstate', function () {
      try {
        send()
      } catch (e) {}
    })
  } catch (e) {
    /* 统计永远不应影响页面 */
  }
})()
