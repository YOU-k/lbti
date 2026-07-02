/**
 * Preview 入口 —— 用 fetch() 加载 JSON，可直接用 `python3 -m http.server` 跑，无需 vite。
 * 逻辑与 main.js 一致，只是数据源改为 runtime fetch。
 */
import { calcDimensionScores, scoresToLevels, determineResult } from './engine.js'
import { buildQuestionOrder, renderQuestion } from './quiz.js'
import { renderResult } from './result.js'

const app = document.getElementById('app')

async function loadAll() {
  const [questionsData, dimensions, typesData, config] = await Promise.all([
    fetch('./data/questions.json').then((r) => r.json()),
    fetch('./data/dimensions.json').then((r) => r.json()),
    fetch('./data/types.json').then((r) => r.json()),
    fetch('./data/config.json').then((r) => r.json()),
  ])
  return { questionsData, dimensions, typesData, config }
}

const state = {
  view: 'intro',
  answers: {},
  currentIdx: 0,
  order: [],
  data: null,
}

function render() {
  app.innerHTML = ''
  if (state.view === 'intro') renderIntro()
  else if (state.view === 'quiz') renderQuiz()
  else if (state.view === 'result') renderResultView()
}

function renderIntro() {
  const { config } = state.data
  const el = document.createElement('div')
  el.className = 'intro-page'
  el.innerHTML = `
    <div class="intro-inner">
      <h1 class="intro-title">${escapeHtml(config.display.title)}</h1>
      <p class="intro-subtitle">${escapeHtml(config.display.subtitle)}</p>
      <p class="intro-tagline">${escapeHtml(config.display.tagline)}</p>
      <div class="intro-meta">
        <span>共 ${state.order.length} 题</span>
        <span>·</span>
        <span>约 3-5 分钟</span>
        <span>·</span>
        <span>14 种可能人格</span>
      </div>
      <button class="btn btn-primary btn-lg" id="start-btn">开始测试</button>
      <p class="intro-author">${escapeHtml(config.display.author)}</p>
      <p class="intro-warning">${escapeHtml(config.display.funNote)}</p>
    </div>
  `
  el.querySelector('#start-btn').addEventListener('click', () => {
    state.view = 'quiz'
    state.currentIdx = 0
    state.answers = {}
    render()
  })
  app.appendChild(el)
}

function renderQuiz() {
  const q = state.order[state.currentIdx]
  const node = renderQuestion(q, state.currentIdx, state.order.length, {
    onAnswer: (qid, val) => {
      state.answers[qid] = val
      if (state.currentIdx < state.order.length - 1) {
        state.currentIdx++
        render()
      } else {
        state.view = 'result'
        render()
      }
    },
    onBack: () => {
      if (state.currentIdx > 0) {
        state.currentIdx--
        render()
      }
    },
    currentAnswer: state.answers[q.id],
  })
  app.appendChild(node)
}

function renderResultView() {
  const { questionsData, dimensions, typesData, config } = state.data
  const scores = calcDimensionScores(state.answers, questionsData.main)
  const levels = scoresToLevels(scores, config.scoring.levelThresholds)
  const isEmo = state.answers[config.emoGate.questionId] === config.emoGate.triggerValue
  const result = determineResult(
    levels,
    dimensions.order,
    typesData.standard,
    typesData.special,
    { isEmo },
  )
  const node = renderResult({
    result,
    dimensions,
    config,
    standardTypes: typesData.standard,
    onRestart: () => {
      state.view = 'intro'
      render()
    },
  })
  app.appendChild(node)
  window.scrollTo(0, 0)
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

;(async () => {
  app.innerHTML = '<div style="padding:40px;text-align:center;color:#a89599;">加载中...</div>'
  try {
    state.data = await loadAll()
    state.order = buildQuestionOrder(state.data.questionsData)
    render()
  } catch (e) {
    app.innerHTML = `<div style="padding:40px;color:#d25260;">加载失败：${escapeHtml(e.message)}</div>`
  }
})()
