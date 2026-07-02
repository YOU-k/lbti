/**
 * 答题流程控制
 */

export function buildQuestionOrder(questionsData) {
  return [...questionsData.main]
}

/**
 * 渲染当前问题
 * @param {Object} question
 * @param {number} index
 * @param {number} total
 * @param {Object} callbacks - { onAnswer, onBack, currentAnswer }
 *   - onAnswer(qid, value): 选择选项时触发（前进）
 *   - onBack(): 点"上一题"时触发；index === 0 时不会渲染
 *   - currentAnswer: 已选过的 value（undefined 表示未选），会高亮
 */
export function renderQuestion(question, index, total, callbacks) {
  const { onAnswer, onBack, currentAnswer } = callbacks
  const container = document.createElement('div')
  container.className = 'quiz-question'
  const canGoBack = index > 0
  container.innerHTML = `
    <div class="progress">
      <div class="progress-row">
        <button class="back-btn" type="button" ${canGoBack ? '' : 'disabled'}>← 上一题</button>
        <span class="progress-text">${index + 1} / ${total}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${((index + 1) / total) * 100}%"></div></div>
    </div>
    <p class="question-text">${escapeHtml(question.text)}</p>
    <div class="option-list"></div>
  `

  if (canGoBack) {
    container.querySelector('.back-btn').addEventListener('click', onBack)
  }

  const list = container.querySelector('.option-list')
  question.options.forEach((opt) => {
    const btn = document.createElement('button')
    btn.className = 'option-btn' + (currentAnswer === opt.value ? ' option-btn--selected' : '')
    btn.type = 'button'
    btn.textContent = opt.label
    btn.addEventListener('click', () => onAnswer(question.id, opt.value))
    list.appendChild(btn)
  })

  return container
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
