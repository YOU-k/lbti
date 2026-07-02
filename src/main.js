/**
 * 应用入口 —— 状态机：intro → quiz → result
 */
import './style.css'
import { calcDimensionScores, scoresToLevels, determineResult } from './engine.js'
import { buildQuestionOrder, renderQuestion } from './quiz.js'
import { renderResult } from './result.js'

import questionsData from '../data/questions.json'
import dimensions from '../data/dimensions.json'
import typesData from '../data/types.json'
import config from '../data/config.json'

const app = document.getElementById('app')

const state = {
  view: 'intro',
  answers: {},
  currentIdx: 0,
  order: buildQuestionOrder(questionsData),
}

function render() {
  app.innerHTML = ''
  if (state.view === 'intro') renderIntro()
  else if (state.view === 'quiz') renderQuiz()
  else if (state.view === 'result') renderResultView()
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
  const scores = calcDimensionScores(state.answers, questionsData.main)
  const levels = scoresToLevels(scores, config.scoring.levelThresholds)

  const gateId = config.emoGate.questionId
  const isEmo = state.answers[gateId] === config.emoGate.triggerValue

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

render()
