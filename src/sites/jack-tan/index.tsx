import { SplitHeading } from '../../system/SplitHeading'
import { SiteAvatar } from '../../system/avatars'
import { SiteBadge } from '../../system/SiteBadge'
import { Reveal } from '../../system/Reveal'
import { PinnedChapter } from '../../system/PinnedChapter'
import { SpatialGallery, type SpatialItem } from '../../system/SpatialGallery'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'

const STATS = [
  { num: '9+', label: '年行业经验' },
  { num: '2 项', label: '国家发明专利' },
  { num: '8+', label: '核心系统建设' },
  { num: 'IOSA', label: '零不符合项通过' },
]

const EXP = [
  {
    org: '民航行业监管信息化机构',
    period: '2023.10 - 至今',
    role: '安全监管数字化负责人 · 中级工程师',
    note: '主导民航机场监管数字化平台建设，整合安全监察、行政执法、工程招投标、专用设备等多业务系统，搭建统一业务中台，实现多源业务数据互通与能力复用；牵头民航公安门户网站建设与运维，保障指挥调度系统稳定运行；推动监管业务数据治理与遗留系统数据迁移，沉淀监管数据资产，支撑管理决策与业务拓展；负责全国监管系统用户业务培训与落地推广，覆盖各级监管人员与机场运行单位。',
  },
  {
    org: '天津航空有限责任公司',
    period: '2019.11 - 2023.10',
    role: '安全监察主管',
    note: '统筹公司安全监察体系全流程管理，主导编制年度监察计划，覆盖 12 个业务部门的日常合规检查与专项安全审核；牵头推进数字化安全监督管理系统建设，实现监察任务下发、跟踪、检查单维护、整改闭环的数字化与自动化；建立「跟踪-验证-闭环」整改管理机制，依托数字化系统推动问题落地整改，提升安全管理闭环效率；负责安全管理体系（SMS）日常运行维护与持续优化，开展系统性风险识别与管控。',
  },
  {
    org: '海南航空控股股份有限公司',
    period: '2017.3 - 2019.11',
    role: '航空安保质量主管',
    note: '统筹境内外机场安保合作协议签署与落地执行，主导航空安保管理体系（SeMS）建设与持续优化；全程负责国际航协运行安全审计（IOSA）安保模块迎审，以零不符合项通过审计；建立「制度-执行-评估」质量管理闭环，推动安保问题整改完成率显著提升；开展机组出境证件需求分析，优化人员调配利用率，统筹国际证照系统建设。',
  },
  {
    org: '东海航空有限公司',
    period: '2016.7 - 2017.3',
    role: '航空安保专员',
    note: '负责对接民航监管机构，保障公司年度安保审计与国际标准审计（IOSA）顺利通过；管理国内各机场安保合作协议的签署与执行，参与公司安保管理体系（SeMS）的搭建与落地。',
  },
]

const PROJECTS_TAN = [
  {
    title: '民航智慧监管数字化建设项目',
    period: '2023.10 - 至今',
    desc: '面向全国民航监管场景的数字化平台建设工程，覆盖机场安全监管、行政执法、专业工程管理等核心业务领域，服务各级监管人员与全国机场运行单位。整合多业务监管模块，构建标准化共享能力组件，提升监管系统的复用性与拓展效率；设计统一的业务数据架构，打通多系统数据壁垒，支撑监管业务协同与数据应用；推进历史业务数据治理与迁移，完成存量数据资产化沉淀，强化决策数据支撑；搭建全国范围用户培训体系，保障平台落地应用效果，覆盖各级监察员。',
  },
  {
    title: '民航公安局新版门户网站建设',
    period: '2023.12 - 2024.06',
    desc: '牵头完成民航公安局新版门户网站建设，重新设计栏目板块，增加工作动态投稿、视频新闻播放、分类统计等功能，采用多层防御安全架构，运行稳定获用户好评。重新设计门户栏目架构，优化信息分类与用户体验；采用多层安全防御架构，保障政务系统安全稳定运行。',
  },
  {
    title: '数字化安全监督管理系统（企业端）',
    period: '2020.06 - 2020.12',
    desc: '在航空公司任职期间，牵头推进数字化安全平台建设，实现监察审核全流程数字化管理，有效提升安全管理效能。推进整改单、监察审核等核心模块落地，实现全流程数字化自动化；建立监察任务下发、跟踪、检查单维护、整改闭环的数字化管理机制。',
  },
]

const WORKS: SpatialItem[] = [
  { id: 'sop', title: '民用机场安全监察系统', subtitle: 'sop.caac.gov.cn', href: 'https://sop.caac.gov.cn' },
  { id: 'license', title: '机场建设管理类行政许可系统', subtitle: 'sop.caac.gov.cn', href: 'https://sop.caac.gov.cn' },
  { id: 'caecs', title: '民航工程建设标准化管理信息系统', subtitle: 'caecs.org.cn', href: 'https://www.caecs.org.cn/' },
  { id: 'zbtb', title: '民航专业工程招投标管理系统', subtitle: 'zbtb.caac.gov.cn', href: 'https://zbtb.caac.gov.cn/' },
  { id: 'adeqpt', title: '民用机场专用设备信息管理系统', subtitle: 'adeqpt.caac.gov.cn', href: 'https://adeqpt.caac.gov.cn/' },
  { id: 'gaa', title: '通用机场信息管理系统', subtitle: 'gaa.caac.gov.cn', href: 'https://gaa.caac.gov.cn/' },
  { id: 'ga-app', title: '民航公安综合应用系统', subtitle: '内部系统 · 不对外公开' },
  { id: 'ga-site', title: '民航局公安局官方网站', subtitle: '政务门户 · 不对外公开' },
]

const PATENTS = [
  { no: 'ZL 2024 1 1889392.1', title: '一种无人机适飞空域中位置坐标判断方法', date: '授权 2025.08.29' },
  { no: 'ZL 2025 1 1493541.7', title: '一种民航数据中台的异构数据存储方法及系统', date: '授权 2026.01.27' },
]

const HONORS = [
  { title: 'USOAP 国际审计迎审', org: '突出贡献集体成员 · 民航局通报表扬' },
  { title: '行业感谢信', org: '中国航空运输协会' },
]

const SKILLS_PRO = [
  '安全管理体系 (SMS)', '安保管理体系 (SeMS)', '国际航协 IOSA 审计',
  '民航安全监察', '风险管理', '合规管理',
  '监管数字化', '数据中台建设', '数据治理',
  '系统集成', '无人机监管', '网络与数据安全',
]
const SKILLS_CERT = ['英语（工作语言）', 'CET-6', '普通话二甲', '中级工程师', 'IOSA 专项培训', '民航安全管理资质', '法定自查初训']

/**
 * Jack Tan personal site — Apple-style scroll narrative.
 * Hero stats → pinned manifesto (scrubbed progress) → About → Experience
 * timeline → Projects → Works (spatial gallery) → Patents/Honors → Skills →
 * Contact. All content is real; animation comes from the shared primitives.
 */
export default function JackTan() {
  return (
    <div className="tan">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="tan-hero">
        <SiteAvatar siteId="jack-tan" className="site-avatar-hero" />
        <SiteBadge className="tan-badge">PERSONAL PORTFOLIO · BEIJING</SiteBadge>
        <SplitHeading as="h1" className="tan-name" text="Jack Tan" splitBy="chars" />
        <p className="tan-statement">
          民航安全监管数字化负责人。<strong>技术驱动者</strong>——让安全监管可被计算、可被追溯。
        </p>
        <div className="tan-stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} className="tan-stat" delay={i * 0.06}>
              <span className="tan-stat-num">{s.num}</span>
              <span className="tan-stat-label">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Pinned manifesto ────────────────────────────────── */}
      <PinnedChapter distance={70} className="tan-manifesto-chapter">
        <div className="tan-manifesto">
          <span className="tan-manifesto-eyebrow">MANIFESTO</span>
          <h2 className="tan-manifesto-title">
            技术驱动者
            <br />
            让安全监管
            <br />
            可被计算
          </h2>
          <div className="tan-manifesto-progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </PinnedChapter>

      {/* ── About ───────────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="About" splitBy="chars" />
        <Reveal as="p" className="tan-prose">
          现就职于民航行业监管信息化机构，驻地北京，中级工程师。入行 9 年，从航空安保质量管理起步，历经安全监察体系建设与审计落地，逐步转向监管场景数字化建设，完成了从业务专家到技术驱动者的职业转型。深度参与国际航协运行安全审计（IOSA）、航空安保审计及国际民航组织 USOAP 审计迎审，主导安全管理体系（SMS）与安保管理体系（SeMS）全流程落地，熟悉国内外民航安全监管法规标准；当前聚焦民航智慧监管领域，主导多个核心监管系统平台建设，持有 2 项国家发明专利，推动机场安全监管场景的数字化升级与业务协同。
        </Reveal>
      </section>

      {/* ── Experience ──────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="Experience" splitBy="chars" />
        <ul className="tan-timeline">
          {EXP.map((e) => (
            <Reveal as="li" key={e.org + e.period} className="tan-tl-item">
              <span className="tan-tl-period">{e.period}</span>
              <div className="tan-tl-body">
                <span className="tan-tl-org">{e.org}</span>
                <span className="tan-tl-role">{e.role}</span>
                <span className="tan-tl-note">{e.note}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── Projects ────────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="Projects" splitBy="chars" />
        <div className="tan-projects">
          {PROJECTS_TAN.map((p) => (
            <Reveal key={p.title} className="tan-project">
              <span className="tan-project-period">{p.period}</span>
              <span className="tan-project-title">{p.title}</span>
              <span className="tan-project-desc">{p.desc}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Works (spatial gallery) ─────────────────────────── */}
      <section className="tan-section">
        <div className="tan-works-head">
          <SplitHeading as="h2" className="tan-h2" text="Works" splitBy="chars" />
          <span className="tan-works-badge">8 SYSTEMS LIVE</span>
        </div>
        <SpatialGallery items={WORKS} />
      </section>

      {/* ── Patents & Honors ────────────────────────────────── */}
      <section className="tan-section tan-split">
        <div className="tan-split-col">
          <SplitHeading as="h3" className="tan-h3" text="Patents" splitBy="chars" />
          <ul className="tan-patents">
            {PATENTS.map((p) => (
              <Reveal as="li" key={p.no} className="tan-patent">
                <span className="tan-patent-no">{p.no}</span>
                <span className="tan-patent-title">{p.title}</span>
                <span className="tan-patent-date">{p.date}</span>
              </Reveal>
            ))}
          </ul>
        </div>
        <div className="tan-split-col">
          <SplitHeading as="h3" className="tan-h3" text="Honors" splitBy="chars" />
          <ul className="tan-honors">
            {HONORS.map((h) => (
              <Reveal as="li" key={h.title} className="tan-honor">
                <span className="tan-honor-title">{h.title}</span>
                <span className="tan-honor-org">{h.org}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Skills ──────────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="Skills" splitBy="chars" />
        <Reveal as="div" className="tan-skills">
          {SKILLS_PRO.map((s) => (
            <span key={s} className="tan-skill">{s}</span>
          ))}
        </Reveal>
        <Reveal as="div" className="tan-skills tan-skills-cert">
          {SKILLS_CERT.map((s) => (
            <span key={s} className="tan-skill tan-skill-cert">{s}</span>
          ))}
        </Reveal>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <footer className="tan-contact">
        <SplitHeading as="h2" className="tan-contact-title" text="Let’s talk." splitBy="chars" />
        <div className="tan-contact-links">
          <ContactBar />
        </div>
        <TransitionLink to="/" className="tan-back">← 返回工作室</TransitionLink>
      </footer>
    </div>
  )
}
