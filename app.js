const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');
const themeToggle = document.querySelector('.theme-toggle');

function setTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  themeToggle.setAttribute('aria-checked', String(isDark));
  themeToggle.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#101820' : '#ffffff';
  localStorage.setItem('rackvision-theme', isDark ? 'dark' : 'light');
}

setTheme(localStorage.getItem('rackvision-theme') === 'dark');
themeToggle.addEventListener('click', () => {
  setTheme(!document.body.classList.contains('dark-mode'));
});

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.querySelector('.sr-only').textContent = isOpen ? 'Open navigation' : 'Close navigation';
  primaryNav.classList.toggle('is-open', !isOpen);
});

primaryNav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    primaryNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.querySelector('.sr-only').textContent = 'Open navigation';
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();

const inquiryForm = document.querySelector('#inquiry-form');
const formFeedback = document.querySelector('#form-feedback');
const submissionFrame = document.querySelector('#contact-submission-frame');
const submitButton = inquiryForm.querySelector('button[type="submit"]');
let isSubmittingInquiry = false;
let submissionTimeout;
let submissionLoadFallback;

function setInquiryStatus(message, state) {
  formFeedback.textContent = message;
  formFeedback.dataset.state = state;
}

function finishInquirySubmission(status) {
  if (!isSubmittingInquiry) return;
  window.clearTimeout(submissionTimeout);
  window.clearTimeout(submissionLoadFallback);
  isSubmittingInquiry = false;
  submitButton.disabled = false;

  if (status === 'success') {
    setInquiryStatus('Thank you. Your inquiry was received successfully.', 'success');
    inquiryForm.reset();
  } else {
    setInquiryStatus('We could not send your inquiry. Please try again in a moment.', 'error');
  }
}

submissionFrame.addEventListener('load', () => {
  if (!isSubmittingInquiry) return;

  // Apps Script may redirect its response to a googleusercontent.com origin. The
  // response document load is a lifecycle signal when its postMessage is dropped.
  window.clearTimeout(submissionLoadFallback);
  submissionLoadFallback = window.setTimeout(() => {
    finishInquirySubmission('success');
  }, 1000);
});

window.addEventListener('message', (event) => {
  if (event.source !== submissionFrame.contentWindow) return;
  if (!event.data || event.data.type !== 'rackvision-contact-result') return;
  if (!isSubmittingInquiry || !['success', 'error'].includes(event.data.status)) return;

  finishInquirySubmission(event.data.status);
});

inquiryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!inquiryForm.reportValidity() || isSubmittingInquiry) return;

  const endpoint = String(window.RACKVISION_CONTACT_ENDPOINT || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(endpoint)) {
    setInquiryStatus('The contact form is not connected yet. Please try again later.', 'error');
    return;
  }

  isSubmittingInquiry = true;
  submitButton.disabled = true;
  setInquiryStatus('Sending your inquiry…', 'pending');
  inquiryForm.action = endpoint;
  inquiryForm.method = 'post';
  inquiryForm.target = submissionFrame.name;
  submissionTimeout = window.setTimeout(() => {
    if (!isSubmittingInquiry) return;
    isSubmittingInquiry = false;
    submitButton.disabled = false;
    setInquiryStatus('We could not confirm delivery. Please try again in a moment.', 'error');
  }, 30000);
  inquiryForm.submit();
});

const motionTargets = document.querySelectorAll(
  '#about .about-grid, #services .section-heading, #services .service-card, ' +
  '#why-us .approach-intro, #why-us .approach-list article, ' +
  '.industries-section .section-heading, .industry-grid>div, ' +
  '#service-details .section-heading, .detail-grid article, ' +
  '#mission .mission-aside, #mission .mission-main>article, #mission .values-row, ' +
  '#media .media-feature, #media .media-bottom>div, #media .media-note, .content-slots article, ' +
  '#careers .careers-intro, #careers .job-row, #contact .contact-intro, #contact .contact-form, ' +
  '.closing-cta .cta-inner'
);

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

  const revealOrderByParent = new Map();
  motionTargets.forEach((element) => {
    element.classList.add('motion-reveal');
    const parent = element.parentElement;
    const order = revealOrderByParent.get(parent) || 0;
    element.style.setProperty('--reveal-order', order);
    revealOrderByParent.set(parent, order + 1);
    revealObserver.observe(element);
  });
}

let scrollFramePending = false;
const updateNavbarScrollState = () => {
  if (scrollFramePending) return;
  scrollFramePending = true;
  window.requestAnimationFrame(() => {
    document.body.classList.toggle('is-scrolled', window.scrollY > 12);
    scrollFramePending = false;
  });
};
window.addEventListener('scroll', updateNavbarScrollState, { passive: true });
updateNavbarScrollState();
