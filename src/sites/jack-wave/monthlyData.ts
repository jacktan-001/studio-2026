// AUTO-GENERATED from 我的每月最爱歌单.xlsx (1月–8月, 12 songs each).
// Authored month titles are curated to match the Jack Wave journal voice.
// Covers are derived at render time (Cover component): real Apple artwork when
// the track id resolves, otherwise a deterministic gradient fallback.

export interface MonthlyTrack {
  id: string
  title: string
  artist: string
  appleMusicUrl: string
  appleTrackId: string | null
}

export interface MonthlyShare {
  id: string
  monthNo: number
  monthCn: string
  monthEn: string
  titleCn: string
  titleEn: string
  tracks: MonthlyTrack[]
}

const CN_MONTHS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

function normalizeMonthlyShare(raw: any, i: number): MonthlyShare {
  const monthNo = Number(raw?.monthNo) || i + 1
  return {
    id: raw?.id || `m${String(monthNo).padStart(2, '0')}`,
    monthNo,
    monthCn: raw?.monthCn || `${CN_MONTHS[monthNo - 1] ?? ''}月`,
    monthEn: raw?.monthEn || '',
    titleCn: raw?.titleCn || '',
    titleEn: raw?.titleEn || '',
    tracks: Array.isArray(raw?.tracks)
      ? raw.tracks.map((t: any, j: number) => ({
          id: t?.id || `m${monthNo}-${j + 1}`,
          title: t?.title || 'Untitled',
          artist: t?.artist || '',
          appleMusicUrl: t?.appleMusicUrl || '',
          appleTrackId: t?.appleTrackId || null,
        }))
      : [],
  }
}

/**
 * 月度歌单数据源：优先从线上 /api/public-data 拉取（后台可编辑）；
 * 后端不可用或为空时回退到本文件静态种子，保证永远有内容。
 */
export async function fetchMonthlyShares(): Promise<MonthlyShare[]> {
  try {
    const res = await fetch('/api/public-data', { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const json = await res.json()
      const remote = json?.data?.monthlyShares
      if (Array.isArray(remote) && remote.length > 0) {
        return remote.map(normalizeMonthlyShare)
      }
    }
  } catch {
    /* 离线 / 后端未就绪 → 回退静态种子 */
  }
  return MONTHLY_SHARES
}

export const MONTHLY_SHARES: MonthlyShare[] = [
  {
    id: "m01",
    monthNo: 1,
    monthCn: "一月",
    monthEn: "January",
    titleCn: "初雪与告白",
    titleEn: "First Snow, First Confession",
    tracks: [
      {
        id: "m1-1",
        title: "Darling",
        artist: "Halsey",
        appleMusicUrl: "https://music.apple.com/cn/album/darling/1574984717?i=1574985088&uo=4",
        appleTrackId: "1574985088",
      },
      {
        id: "m1-2",
        title: "How Long Will I Love You (Bonus Track)",
        artist: "Ellie Goulding",
        appleMusicUrl: "https://music.apple.com/cn/album/how-long-will-i-love-you-bonus-track/1445845727?i=1445846557&uo=4",
        appleTrackId: "1445846557",
      },
      {
        id: "m1-3",
        title: "MOON MUSiC",
        artist: "Coldplay & Jon Hopkins",
        appleMusicUrl: "https://music.apple.com/cn/album/moon-music/1751728791?i=1751728799&uo=4",
        appleTrackId: "1751728799",
      },
      {
        id: "m1-4",
        title: "Married Life",
        artist: "Michael Giacchino",
        appleMusicUrl: "https://music.apple.com/cn/album/married-life/1440617705?i=1440617708&uo=4",
        appleTrackId: "1440617708",
      },
      {
        id: "m1-5",
        title: "We Belong",
        artist: "Ingrid Michaelson",
        appleMusicUrl: "https://music.apple.com/cn/album/we-belong/1750086958?i=1750086961&uo=4",
        appleTrackId: "1750086961",
      },
      {
        id: "m1-6",
        title: "You Are My Sunshine",
        artist: "Jasmine Thompson",
        appleMusicUrl: "https://music.apple.com/cn/album/you-are-my-sunshine/1182619544?i=1182619563&uo=4",
        appleTrackId: "1182619563",
      },
      {
        id: "m1-7",
        title: "Fix You",
        artist: "Coldplay",
        appleMusicUrl: "https://music.apple.com/cn/album/fix-you/1123076757?i=1123076826&uo=4",
        appleTrackId: "1123076826",
      },
      {
        id: "m1-8",
        title: "Beautiful Boy (Darling Boy)",
        artist: "John Lennon",
        appleMusicUrl: "https://music.apple.com/cn/album/beautiful-boy-darling-boy/1440987952?i=1440988084&uo=4",
        appleTrackId: "1440988084",
      },
      {
        id: "m1-9",
        title: "EDIE CELINE",
        artist: "MAX",
        appleMusicUrl: "https://music.apple.com/cn/album/edie-celine/1729390300?i=1729392878&uo=4",
        appleTrackId: "1729392878",
      },
      {
        id: "m1-10",
        title: "Can't Help Falling in Love",
        artist: "Kacey Musgraves",
        appleMusicUrl: "https://music.apple.com/cn/album/cant-help-falling-in-love/1631910951?i=1631910971&uo=4",
        appleTrackId: "1631910971",
      },
      {
        id: "m1-11",
        title: "Lava",
        artist: "Kuana Torres Kahele & Napua Greig & James Ford Murphy",
        appleMusicUrl: "https://music.apple.com/cn/album/lava-from-lava/1444604166?i=1444604167&uo=4",
        appleTrackId: "1444604167",
      },
      {
        id: "m1-12",
        title: "Breathe Me",
        artist: "Sia",
        appleMusicUrl: "https://music.apple.com/cn/album/breathe-me/1444005606?i=1444005733&uo=4",
        appleTrackId: "1444005733",
      },
    ],
  },
  {
    id: "m02",
    monthNo: 2,
    monthCn: "二月",
    monthEn: "February",
    titleCn: "短情书",
    titleEn: "Short Love Letters",
    tracks: [
      {
        id: "m2-1",
        title: "A Whole New World (Aladdin's Theme)",
        artist: "Peabo Bryson & Regina Belle",
        appleMusicUrl: "https://music.apple.com/cn/album/a-whole-new-world-aladdins-theme-soundtrack-version/1440722016?i=1440722345&uo=4",
        appleTrackId: "1440722345",
      },
      {
        id: "m2-2",
        title: "Hvn High",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/hvn-high/1830380820?i=1830380826&uo=4",
        appleTrackId: "1830380826",
      },
      {
        id: "m2-3",
        title: "Résumé",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/r%C3%A9sum%C3%A9/1578938206?i=1578938435&uo=4",
        appleTrackId: "1578938435",
      },
      {
        id: "m2-4",
        title: "Haiku",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/haiku/1810116376?i=1810116377&uo=4",
        appleTrackId: "1810116377",
      },
      {
        id: "m2-5",
        title: "Love Quotes",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/love-quotes/1638256523?i=1638256544&uo=4",
        appleTrackId: "1638256544",
      },
      {
        id: "m2-6",
        title: "Baby Powder",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/baby-powder/1562021855?i=1562022041&uo=4",
        appleTrackId: "1562022041",
      },
      {
        id: "m2-7",
        title: "Crybaby",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/crybaby/1578938008?i=1578938115&uo=4",
        appleTrackId: "1578938115",
      },
      {
        id: "m2-8",
        title: "Head Over Heels",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/head-over-heels/1817504664?i=1817504936&uo=4",
        appleTrackId: "1817504936",
      },
      {
        id: "m2-9",
        title: "A Whole New World",
        artist: "Lea Salonga & Brad Kane",
        appleMusicUrl: "https://music.apple.com/cn/album/a-whole-new-world/714526030?i=714526145&uo=4",
        appleTrackId: "714526145",
      },
      {
        id: "m2-10",
        title: "How Come, How Long (feat. Stevie Wonder)",
        artist: "Babyface",
        appleMusicUrl: "https://music.apple.com/cn/album/how-come-how-long-feat-stevie-wonder/169929959?i=169930878&uo=4",
        appleTrackId: "169930878",
      },
      {
        id: "m2-11",
        title: "Good Days",
        artist: "SZA",
        appleMusicUrl: "https://music.apple.com/cn/album/good-days/1546390012?i=1546390013&uo=4",
        appleTrackId: "1546390013",
      },
      {
        id: "m2-12",
        title: "Agora Hills",
        artist: "Doja Cat",
        appleMusicUrl: "https://music.apple.com/cn/album/agora-hills/1707937663?i=1707937781&uo=4",
        appleTrackId: "1707937781",
      },
    ],
  },
  {
    id: "m03",
    monthNo: 3,
    monthCn: "三月",
    monthEn: "March",
    titleCn: "春风的语法",
    titleEn: "Grammar of Spring",
    tracks: [
      {
        id: "m3-1",
        title: "Missing Persons",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/missing-persons/1827147857?i=1827147861&uo=4",
        appleTrackId: "1827147861",
      },
      {
        id: "m3-2",
        title: "DOWN BAD",
        artist: "SAILORR",
        appleMusicUrl: "https://music.apple.com/cn/album/down-bad/1809267067?i=1809267073&uo=4",
        appleTrackId: "1809267073",
      },
      {
        id: "m3-3",
        title: "Sneaky Link",
        artist: "Muni Long",
        appleMusicUrl: "https://music.apple.com/cn/album/sneaky-link/1617342346?i=1617342354&uo=4",
        appleTrackId: "1617342354",
      },
      {
        id: "m3-4",
        title: "Bluebirds",
        artist: "蔡健雅",
        appleMusicUrl: "https://music.apple.com/cn/album/bluebirds/1579625486?i=1579625488&uo=4",
        appleTrackId: "1579625488",
      },
      {
        id: "m3-5",
        title: "Just the Two of Us",
        artist: "Bill Withers & Grover Washington Jr.",
        appleMusicUrl: "https://music.apple.com/cn/album/just-the-two-of-us/321974938?i=321975002&uo=4",
        appleTrackId: "321975002",
      },
      {
        id: "m3-6",
        title: "What It Is",
        artist: "Amber Mark",
        appleMusicUrl: "https://music.apple.com/cn/album/what-it-is/1586330404?i=1586330798&uo=4",
        appleTrackId: "1586330798",
      },
      {
        id: "m3-7",
        title: "Me & U",
        artist: "Tems",
        appleMusicUrl: "https://music.apple.com/cn/album/me-u/1710052036?i=1710052037&uo=4",
        appleTrackId: "1710052037",
      },
      {
        id: "m3-8",
        title: "CaNdY LiEs",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/candy-lies/1780589231?i=1780589278&uo=4",
        appleTrackId: "1780589278",
      },
      {
        id: "m3-9",
        title: "Island In the Sun",
        artist: "Weezer",
        appleMusicUrl: "https://music.apple.com/cn/album/island-in-the-sun/1440797971?i=1440798251&uo=4",
        appleTrackId: "1440798251",
      },
      {
        id: "m3-10",
        title: "Beautiful",
        artist: "Christina Aguilera",
        appleMusicUrl: "https://music.apple.com/cn/album/beautiful/279647264?i=279647290&uo=4",
        appleTrackId: "279647290",
      },
      {
        id: "m3-11",
        title: "Killing Me Softly With His Song",
        artist: "Roberta Flack",
        appleMusicUrl: "https://music.apple.com/cn/album/killing-me-softly-with-his-song/355038498?i=355038523&uo=4",
        appleTrackId: "355038523",
      },
      {
        id: "m3-12",
        title: "My All",
        artist: "Mariah Carey",
        appleMusicUrl: "https://music.apple.com/cn/album/my-all/192812283?i=192812595&uo=4",
        appleTrackId: "192812595",
      },
    ],
  },
  {
    id: "m04",
    monthNo: 4,
    monthCn: "四月",
    monthEn: "April",
    titleCn: "樱时",
    titleEn: "Cherry Blossom Time",
    tracks: [
      {
        id: "m4-1",
        title: "bellyache",
        artist: "Billie Eilish",
        appleMusicUrl: "https://music.apple.com/cn/album/bellyache/1440898929?i=1440899447&uo=4",
        appleTrackId: "1440899447",
      },
      {
        id: "m4-2",
        title: "María",
        artist: "Ricky Martin",
        appleMusicUrl: "https://music.apple.com/cn/album/mar%C3%ADa/187287914?i=187288293&uo=4",
        appleTrackId: "187288293",
      },
      {
        id: "m4-3",
        title: "2NLuv (feat. Benziboy)",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/2nluv-feat-benziboy/1632148760?i=1632148773&uo=4",
        appleTrackId: "1632148773",
      },
      {
        id: "m4-4",
        title: "Midnight Charm",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/midnight-charm/1780589231?i=1780589291&uo=4",
        appleTrackId: "1780589291",
      },
      {
        id: "m4-5",
        title: "What a Girl Wants",
        artist: "Christina Aguilera",
        appleMusicUrl: "https://music.apple.com/cn/album/what-a-girl-wants/1308542675?i=1308542774&uo=4",
        appleTrackId: "1308542774",
      },
      {
        id: "m4-6",
        title: "ocean eyes",
        artist: "Billie Eilish",
        appleMusicUrl: "https://music.apple.com/cn/album/ocean-eyes/1440898929?i=1440899467&uo=4",
        appleTrackId: "1440899467",
      },
      {
        id: "m4-7",
        title: "Still Don't Know My Name",
        artist: "Labrinth",
        appleMusicUrl: "https://music.apple.com/cn/album/still-dont-know-my-name-from-euphoria-season-1-soundtrack/1481092579?i=1481092695&uo=4",
        appleTrackId: "1481092695",
      },
      {
        id: "m4-8",
        title: "Always",
        artist: "Daniel Caesar",
        appleMusicUrl: "https://music.apple.com/cn/album/always/1681329711?i=1681329730&uo=4",
        appleTrackId: "1681329730",
      },
      {
        id: "m4-9",
        title: "watch",
        artist: "Billie Eilish",
        appleMusicUrl: "https://music.apple.com/cn/album/watch/1440898929?i=1440899134&uo=4",
        appleTrackId: "1440899134",
      },
      {
        id: "m4-10",
        title: "Never Felt So Alone",
        artist: "Labrinth",
        appleMusicUrl: "https://music.apple.com/cn/album/never-felt-so-alone/1680654050?i=1680654413&uo=4",
        appleTrackId: "1680654413",
      },
      {
        id: "m4-11",
        title: "SHUT YOUR DAMN 95.7892",
        artist: "Labrinth",
        appleMusicUrl: "https://music.apple.com/cn/album/shut-your-damn-95-7892/6778161187?i=6778161191&uo=4",
        appleTrackId: "6778161191",
      },
      {
        id: "m4-12",
        title: "Thriller",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/thriller/269572838?i=269573303&uo=4",
        appleTrackId: "269573303",
      },
    ],
  },
  {
    id: "m05",
    monthNo: 5,
    monthCn: "五月",
    monthEn: "May",
    titleCn: "迟来的盛夏",
    titleEn: "The Summer That Came Late",
    tracks: [
      {
        id: "m5-1",
        title: "Lost",
        artist: "Frank Ocean",
        appleMusicUrl: "https://music.apple.com/us/album/lost/1440765580?i=1440766784&uo=4",
        appleTrackId: "1440766784",
      },
      {
        id: "m5-2",
        title: "take it or leave it",
        artist: "The Crane",
        appleMusicUrl: "https://music.apple.com/cn/album/take-it-or-leave-it/1820899961?i=1820900012",
        appleTrackId: "1820900012",
      },
      {
        id: "m5-3",
        title: "Dirty Diana (2012 Remaster)",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/dirty-diana-2012-remaster/559334659?i=559334762&uo=4",
        appleTrackId: "559334762",
      },
      {
        id: "m5-4",
        title: "盖亚",
        artist: "林忆莲",
        appleMusicUrl: "https://music.apple.com/cn/album/%E7%9B%96%E4%BA%9A/1541919859?i=1541920202&uo=4",
        appleTrackId: "1541920202",
      },
      {
        id: "m5-5",
        title: "失忆症",
        artist: "蔡健雅",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%A4%B1%E5%BF%86%E7%97%87/255921226?i=255922636&uo=4",
        appleTrackId: "255922636",
      },
      {
        id: "m5-6",
        title: "Nocturne",
        artist: "Jenevieve",
        appleMusicUrl: "https://music.apple.com/cn/album/nocturne/1827147857?i=1827147870&uo=4",
        appleTrackId: "1827147870",
      },
      {
        id: "m5-7",
        title: "Leave Me Alone",
        artist: "Chris Brown",
        appleMusicUrl: "https://music.apple.com/cn/album/leave-me-alone/6780611205?i=6780611361&uo=4",
        appleTrackId: "6780611361",
      },
      {
        id: "m5-8",
        title: "Black or White",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/black-or-white/322847038?i=322847191&uo=4",
        appleTrackId: "322847191",
      },
      {
        id: "m5-9",
        title: "快一点,慢一点",
        artist: "汉堡黄",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%BF%AB%E4%B8%80%E7%82%B9-%E6%85%A2%E4%B8%80%E7%82%B9/1722758517?i=1722758523&uo=4",
        appleTrackId: "1722758523",
      },
      {
        id: "m5-10",
        title: "Dangerous",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/dangerous/322847038?i=322847216&uo=4",
        appleTrackId: "322847216",
      },
      {
        id: "m5-11",
        title: "特别",
        artist: "The Crane",
        appleMusicUrl: "https://music.apple.com/cn/album/%E7%89%B9%E5%88%AB/1802554619?i=1802554622&uo=4",
        appleTrackId: "1802554622",
      },
      {
        id: "m5-12",
        title: "Make It to Me",
        artist: "Sam Smith",
        appleMusicUrl: "https://music.apple.com/cn/album/make-it-to-me/1763638888?i=1763639149&uo=4",
        appleTrackId: "1763639149",
      },
    ],
  },
  {
    id: "m06",
    monthNo: 6,
    monthCn: "六月",
    monthEn: "June",
    titleCn: "仲夏夜信号",
    titleEn: "Midsummer Night Signal",
    tracks: [
      {
        id: "m6-1",
        title: "我对缘分小心翼翼",
        artist: "林俊杰",
        appleMusicUrl: "https://music.apple.com/cn/album/%E6%88%91%E5%AF%B9%E7%BC%98%E5%88%86%E5%B0%8F%E5%BF%83%E7%BF%BC%E7%BF%BC-%E5%BD%B1%E8%A7%86%E5%89%A7-%E9%80%90%E7%8E%89-%E4%B8%BB%E9%A2%98%E6%9B%B2/1874801973?i=1874801974&uo=4",
        appleTrackId: "1874801974",
      },
      {
        id: "m6-2",
        title: "是非之地",
        artist: "杨乃文",
        appleMusicUrl: "https://music.apple.com/cn/album/%E6%98%AF%E9%9D%9E%E4%B9%8B%E5%9C%B0/1483930790?i=1483931012&uo=4",
        appleTrackId: "1483931012",
      },
      {
        id: "m6-3",
        title: "Latch (Acoustic)",
        artist: "Sam Smith",
        appleMusicUrl: "https://music.apple.com/cn/album/latch-acoustic/1440837455?i=1440838352&uo=4",
        appleTrackId: "1440838352",
      },
      {
        id: "m6-4",
        title: "心酸",
        artist: "林宥嘉",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%BF%83%E9%85%B8/547158777?i=547187876&uo=4",
        appleTrackId: "547187876",
      },
      {
        id: "m6-5",
        title: "Drowning Shadows",
        artist: "Sam Smith",
        appleMusicUrl: "https://music.apple.com/cn/album/drowning-shadows/1536993568?i=1536994185&uo=4",
        appleTrackId: "1536994185",
      },
      {
        id: "m6-6",
        title: "Smooth Criminal",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/smooth-criminal/159292399?i=159294551&uo=4",
        appleTrackId: "159294551",
      },
      {
        id: "m6-7",
        title: "Richest",
        artist: "Muni Long",
        appleMusicUrl: "https://music.apple.com/cn/album/richest/6781003616?i=6781003715&uo=4",
        appleTrackId: "6781003715",
      },
      {
        id: "m6-8",
        title: "垃圾宝贝",
        artist: "林宥嘉",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%9E%83%E5%9C%BE%E5%AE%9D%E8%B4%9D/1704511725?i=1704512060&uo=4",
        appleTrackId: "1704512060",
      },
      {
        id: "m6-9",
        title: "妄想",
        artist: "杨乃文",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%A6%84%E6%83%B3/1483930790?i=1483931013&uo=4",
        appleTrackId: "1483931013",
      },
      {
        id: "m6-10",
        title: "我不是神,我只是平凡却直拗爱着你的人",
        artist: "林宥嘉",
        appleMusicUrl: "https://music.apple.com/cn/album/%E6%88%91%E4%B8%8D%E6%98%AF%E7%A5%9E-%E6%88%91%E5%8F%AA%E6%98%AF%E5%B9%B3%E5%87%A1%E5%8D%B4%E7%9B%B4%E6%8B%97%E7%88%B1%E7%9D%80%E4%BD%A0%E7%9A%84%E4%BA%BA/1681262555?i=1681262557&uo=4",
        appleTrackId: "1681262557",
      },
      {
        id: "m6-11",
        title: "越美丽越看不见",
        artist: "杨乃文",
        appleMusicUrl: "https://music.apple.com/cn/album/%E8%B6%8A%E7%BE%8E%E4%B8%BD%E8%B6%8A%E7%9C%8B%E4%B8%8D%E8%A7%81/1483930790?i=1483931015&uo=4",
        appleTrackId: "1483931015",
      },
      {
        id: "m6-12",
        title: "在爱和你之间",
        artist: "杨乃文",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%9C%A8%E7%88%B1%E5%92%8C%E4%BD%A0%E4%B9%8B%E9%97%B4/1483930790?i=1483931014&uo=4",
        appleTrackId: "1483931014",
      },
    ],
  },
  {
    id: "m07",
    monthNo: 7,
    monthCn: "七月",
    monthEn: "July",
    titleCn: "海与七月",
    titleEn: "Sea & July",
    tracks: [
      {
        id: "m7-1",
        title: "圍牆",
        artist: "李玖哲",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%9C%8D%E7%89%86/1646768216?i=1646768617&uo=4",
        appleTrackId: "1646768617",
      },
      {
        id: "m7-2",
        title: "Snooze",
        artist: "SZA",
        appleMusicUrl: "https://music.apple.com/cn/album/snooze/1658650093?i=1658650499&uo=4",
        appleTrackId: "1658650499",
      },
      {
        id: "m7-3",
        title: "酿成想念",
        artist: "蔡宥绮",
        appleMusicUrl: "https://music.apple.com/cn/album/%E9%85%BF%E6%88%90%E6%83%B3%E5%BF%B5/1732389601?i=1732389603&uo=4",
        appleTrackId: "1732389603",
      },
      {
        id: "m7-4",
        title: "One Kiss",
        artist: "Calvin Harris & Dua Lipa",
        appleMusicUrl: "https://music.apple.com/cn/album/one-kiss/1364709432?i=1364709436&uo=4",
        appleTrackId: "1364709436",
      },
      {
        id: "m7-5",
        title: "Levitating",
        artist: "Dua Lipa",
        appleMusicUrl: "https://music.apple.com/cn/album/levitating/1538003494?i=1538003843&uo=4",
        appleTrackId: "1538003843",
      },
      {
        id: "m7-6",
        title: "New Love",
        artist: "Dua Lipa",
        appleMusicUrl: "https://music.apple.com/cn/album/new-love/1434849473?i=1434849683&uo=4",
        appleTrackId: "1434849683",
      },
      {
        id: "m7-7",
        title: "Love Again",
        artist: "Dua Lipa",
        appleMusicUrl: "https://music.apple.com/cn/album/love-again/1538003494?i=1538004007&uo=4",
        appleTrackId: "1538004007",
      },
      {
        id: "m7-8",
        title: "重来",
        artist: "蔡健雅",
        appleMusicUrl: "https://music.apple.com/cn/album/%E9%87%8D%E6%9D%A5/1445015172?i=1445015174&uo=4",
        appleTrackId: "1445015174",
      },
      {
        id: "m7-9",
        title: "Break My Heart",
        artist: "Dua Lipa",
        appleMusicUrl: "https://music.apple.com/cn/album/break-my-heart/1552269067?i=1552269077&uo=4",
        appleTrackId: "1552269077",
      },
      {
        id: "m7-10",
        title: "P.Y.T. (Pretty Young Thing)",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/p-y-t-pretty-young-thing/269572838?i=269573447&uo=4",
        appleTrackId: "269573447",
      },
      {
        id: "m7-11",
        title: "Human Nature",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/human-nature/269572838?i=269573405&uo=4",
        appleTrackId: "269573405",
      },
      {
        id: "m7-12",
        title: "Remember the Time",
        artist: "Michael Jackson",
        appleMusicUrl: "https://music.apple.com/cn/album/remember-the-time/322847038?i=322847187&uo=4",
        appleTrackId: "322847187",
      },
    ],
  },
  {
    id: "m08",
    monthNo: 8,
    monthCn: "八月",
    monthEn: "August",
    titleCn: "余温",
    titleEn: "Lingering Warmth",
    tracks: [
      {
        id: "m8-1",
        title: "hate that i made you love me",
        artist: "Ariana Grande",
        appleMusicUrl: "https://music.apple.com/cn/album/hate-that-i-made-you-love-me/1895420989?i=6763656876&uo=4",
        appleTrackId: "6763656876",
      },
      {
        id: "m8-2",
        title: "耳朵",
        artist: "李荣浩",
        appleMusicUrl: "https://music.apple.com/cn/album/%E8%80%B3%E6%9C%B5/1438734966?i=1438735302&uo=4",
        appleTrackId: "1438735302",
      },
      {
        id: "m8-3",
        title: "kiss me",
        artist: "Ariana Grande",
        appleMusicUrl: "https://music.apple.com/cn/album/kiss-me/1895420989?i=6763656871&uo=4",
        appleTrackId: "6763656871",
      },
      {
        id: "m8-4",
        title: "stay",
        artist: "Ariana Grande",
        appleMusicUrl: "https://music.apple.com/cn/album/stay/1895420989?i=6763656880&uo=4",
        appleTrackId: "6763656880",
      },
      {
        id: "m8-5",
        title: "Ac-Cent-Tchu-Ate the Positive",
        artist: "Beegie Adair",
        appleMusicUrl: "https://music.apple.com/cn/album/ac-cent-tchu-ate-the-positive/716736785?i=716736816&uo=4",
        appleTrackId: "716736816",
      },
      {
        id: "m8-6",
        title: "night night",
        artist: "Andr & Whys Young",
        appleMusicUrl: "https://music.apple.com/cn/album/night-night/6785855912?i=6785856252&uo=4",
        appleTrackId: "6785856252",
      },
      {
        id: "m8-7",
        title: "Love U U",
        artist: "林俊杰",
        appleMusicUrl: "https://music.apple.com/cn/album/love-u-u/1663699419?i=1663699821&uo=4",
        appleTrackId: "1663699821",
      },
      {
        id: "m8-8",
        title: "距离",
        artist: "林俊杰",
        appleMusicUrl: "https://music.apple.com/cn/album/%E8%B7%9D%E7%A6%BB/1071753622?i=1071753634&uo=4",
        appleTrackId: "1071753634",
      },
      {
        id: "m8-9",
        title: "天使心",
        artist: "林俊杰",
        appleMusicUrl: "https://music.apple.com/cn/album/%E5%A4%A9%E4%BD%BF%E5%BF%83/1071753622?i=1071753630&uo=4",
        appleTrackId: "1071753630",
      },
      {
        id: "m8-10",
        title: "Free Mind",
        artist: "Tems",
        appleMusicUrl: "https://music.apple.com/cn/album/free-mind/1532252592?i=1532252603&uo=4",
        appleTrackId: "1532252603",
      },
      {
        id: "m8-11",
        title: "The Rhythm Of The Night",
        artist: "Corona",
        appleMusicUrl: "https://music.apple.com/cn/album/the-rhythm-of-the-night/6786652222?i=6786652230&uo=4",
        appleTrackId: "6786652230",
      },
      {
        id: "m8-12",
        title: "Let the Sun Shine",
        artist: "Labrinth",
        appleMusicUrl: "https://music.apple.com/cn/album/let-the-sun-shine/516905302?i=516905350&uo=4",
        appleTrackId: "516905350",
      },
    ],
  },
]
