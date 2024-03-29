import {html, render} from 'https://unpkg.com/lit-html@2.8.0/lit-html.js?module';
import {unsafeHTML} from 'https://unpkg.com/lit-html@2.8.0/directives/unsafe-html.js?module';

async function fetchVideoQuiz(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const formDataObj = Object.fromEntries(formData.entries());
  const body = JSON.stringify(formDataObj);
  render(renderLoading(), document.body);

  const quiz = await fetch('/api/fetchVideoQuiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  }).then(res=>res.json());

  render(html`
    <header>
      <h1>${quiz.title}</h1>
    </header>
    <main>
      ${renderVideo(quiz.url)}
      <h2>Quiz</h2>
      ${renderQuiz(quiz)}
    </main>
    <footer>
      <h2>Transcript</h2>
      ${renderTranscript(quiz)}
    </footer>
  `, document.body);
}

function renderLoading() {
  return html`
    <svg version="1.1" id="L6" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve" style="margin: 30vh auto; width: 120px; height: 120px;">
      <rect fill="none" stroke="#fff" stroke-width="4" x="25" y="25" width="50" height="50">
        <animateTransform attributeName="transform" dur="0.5s" from="0 50 50" to="180 50 50" type="rotate" id="strokeBox" attributeType="XML" begin="rectBox.end"></animateTransform>
      </rect>
      <rect x="27" y="27" fill="#fff" width="46" height="50">
        <animate attributeName="height" dur="1.3s" attributeType="XML" from="50" to="0" id="rectBox" fill="freeze" begin="0s;strokeBox.end"></animate>
      </rect>
    </svg>
  `;
}

function renderQuiz(quiz) {
  return html`
    <form @submit=${checkUserResponses}>
      <input type="hidden" name="quiz" value="${JSON.stringify(quiz)}">
      ${unsafeHTML(quiz.questions)}
      <button>Check Answers</button>
    </form>
  `;
}

function renderTranscript(quiz) {
  return html`
    <pre id="transcript">${quiz.transcript}</pre>
  `;
}

async function checkUserResponses(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const formDataObj = Object.fromEntries(formData.entries());
  const body = JSON.stringify(formDataObj);

  render(renderLoading(), document.body);

  const result = await fetch('/api/checkUserResponses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  }).then(res=>res.json());

  render(html`
    <header>
      <h1>${result.title}</h1>
    </header>
    <main>
      ${renderVideo(result.url)}
      <h2>Quiz Results</h2>
      ${renderFeedback(result.feedback)}
    </main>
    <footer>
      <p>Enter another YouTube video url to generate a new quiz</p>
      <form @submit=${fetchVideoQuiz}>
        <input type="text" name="url" placeholder="Enter YouTube Url">
        <button>Start Quiz!</button>
      </form>
    </footer>
  `, document.body);
};

function renderFeedback(feedback) {
  return feedback.split('\n\n')
    .map(p=>
      html`<p>${p.split('\n').map(l=>html`${l}<br>`)}</p>`
    );
}

function renderVideo(urlStr) {
  const targetUrl = new URL(urlStr);
  const embedUrl = new URL('./'+targetUrl.searchParams.get('v'),'https://www.youtube.com/embed/');

  return html`
    <iframe src="${embedUrl.toString()}" title="StatQuest: Histograms, Clearly Explained" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  `;
}

function renderVideoInput() {
  return html`
    <header>
      <h1>Video Quiz</h1>
    </header>
    <main>
      <form @submit=${fetchVideoQuiz}>
        <input type="text" name="url" placeholder="Enter YouTube Url">
        <button>Start Quiz!</button>
      </form>
    </main>
  `;
}

render(renderVideoInput(), document.body);