/**
 * 应用入口 —— 状态机：intro → quiz → result
 */
import './style.css'
import { calcDimensionScores, scoresToLevels, determineResult } from './engine.js'
import { buildQuestionOrder, renderQuestion } from './quiz.js'
import { renderResult } from './result.js'
import { parseSharedFromLocation } from './share.js'
import { renderSharedCard } from './shared.js'

import questionsData from '../data/questions.json'
import dimensions from '../data/dimensions.json'
import typesData from '../data/types.json'
import config from '../data/config.json'

const app = document.getElementById('app')

const shared = parseSharedFromLocation()

const state = {
  view: shared ? 'shared' : 'intro',
  answers: {},
  currentIdx: 0,
  order: buildQuestionOrder(questionsData),
  shared,
}

function render() {
  app.innerHTML = ''
  if (state.view === 'shared') renderSharedView()
  else if (state.view === 'intro') renderIntro()
  else if (state.view === 'quiz') renderQuiz()
  else if (state.view === 'result') renderResultView()
}

function renderSharedView() {
  const allTypes = [...typesData.standard, ...typesData.special]
  const node = renderSharedCard({
    shared: state.shared,
    allTypes,
    onStartMine: () => {
      state.view = 'intro'
      state.shared = null
      // Clean URL so the shared payload doesn't come back on refresh
      history.replaceState(null, '', window.location.pathname)
      render()
    },
  })
  app.appendChild(node)
}

function renderIntro() {
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
        <span>约 2-3 分钟</span>
        <span>·</span>
        <span>17 种可能人格</span>
      </div>
      <p class="intro-anchor">请代入你现在或最近一段稳定关系里的那个人。如果没有，请想象一个交往 4 个月、日常在同城不同居、每周见 2-3 次的人。<br><br><b>选<u>最接近你</u>的那个态度标签</b>——每个选项后面的具体行为是例子，不用 100% 复刻。你就是你。</p>
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
  const scores = calcDimensionScores(state.answers, questionsData.main)
  const levels = scoresToLevels(scores, config.scoring.levelThresholds)

  const result = determineResult(
    levels,
    dimensions.order,
    typesData.standard,
    typesData.special,
  )

  const node = renderResult({
    result,
    dimensions,
    config,
    standardTypes: typesData.standard,
    userLevels: levels,
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

render()
