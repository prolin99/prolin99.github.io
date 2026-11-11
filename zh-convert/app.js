/**
 * 簡繁字體雙向轉換器 (Simplified & Traditional Chinese Converter)
 * Powered by OpenCC
 */

(function () {
  'use strict';

  // DOM Elements
  const sourceText = document.getElementById('sourceText');
  const targetText = document.getElementById('targetText');
  const conversionMode = document.getElementById('conversionMode');
  const liveConvertToggle = document.getElementById('liveConvertToggle');
  const diffViewToggle = document.getElementById('diffViewToggle');
  const convertBtn = document.getElementById('convertBtn');
  const swapBtn = document.getElementById('swapBtn');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const clearSourceBtn = document.getElementById('clearSourceBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const uploadFileBtn = document.getElementById('uploadFileBtn');
  const fileInput = document.getElementById('fileInput');
  const downloadBtn = document.getElementById('downloadBtn');
  const dropOverlay = document.getElementById('dropOverlay');
  const sourceWrapper = document.getElementById('sourceWrapper');
  const diffView = document.getElementById('diffView');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const toastContainer = document.getElementById('toastContainer');

  const sourceLabelText = document.getElementById('sourceLabelText');
  const targetLabelText = document.getElementById('targetLabelText');
  const sourceCharCount = document.getElementById('sourceCharCount');
  const sourceLineCount = document.getElementById('sourceLineCount');
  const targetCharCount = document.getElementById('targetCharCount');
  const targetLineCount = document.getElementById('targetLineCount');
  const engineStatus = document.getElementById('engineStatus');

  // Converters Cache
  const converters = {};

  // Sample texts
  const SAMPLES = {
    tech: `这个开源软件的性能非常优秀，不仅支持分布式数据库，还能有效降低服务器的内存占用。
网络工程师在配置硬件和驱动程序时，可以通过算法自动优化数据传输，提升云端云计算与移动应用的响应速度。`,
    homophone: `后天是皇后的生日，全国举办庆典，祝愿国家繁荣发展。
理发师正在为客人理发与护理头发，干部们深入基层干预不正之风，大家一起干一杯乾坤美酒。
白云在云南的高原上飘荡，这几里路走来真不容易。`,
    classic: `千里之行，始於足下；九層之台，起於累土。
世上本沒有路，走的人多了，也便成了路。
落霞與孤齊飛，秋水共長天一色。欲窮千里目，更上一層樓。`
  };

  /**
   * Initialize OpenCC Converter for a specific mode
   */
  function getConverter(mode) {
    if (converters[mode]) {
      return converters[mode];
    }

    if (typeof OpenCC === 'undefined') {
      console.warn('OpenCC is not loaded yet.');
      return null;
    }

    try {
      let options;
      switch (mode) {
        case 's2twp':
          options = { from: 'cn', to: 'twp' };
          break;
        case 's2tw':
          options = { from: 'cn', to: 'tw' };
          break;
        case 's2t':
          options = { from: 'cn', to: 't' };
          break;
        case 's2hk':
          options = { from: 'cn', to: 'hk' };
          break;
        case 'tw2sp':
          options = { from: 'twp', to: 'cn' };
          break;
        case 't2s':
          options = { from: 't', to: 'cn' };
          break;
        default:
          options = { from: 'cn', to: 'twp' };
      }

      converters[mode] = OpenCC.Converter(options);
      return converters[mode];
    } catch (e) {
      console.error('Failed to create converter for mode', mode, e);
      return null;
    }
  }

  /**
   * Update Pane Headers and Badges based on mode
   */
  function updateLabels() {
    const mode = conversionMode.value;
    const isSimplifiedSource = mode.startsWith('s2');

    if (isSimplifiedSource) {
      sourceLabelText.textContent = '簡體中文（輸入）';
      if (mode === 's2twp') {
        targetLabelText.textContent = '繁體中文（臺灣習慣詞彙）';
      } else if (mode === 's2tw') {
        targetLabelText.textContent = '繁體中文（臺灣標準）';
      } else if (mode === 's2hk') {
        targetLabelText.textContent = '繁體中文（香港標準）';
      } else {
        targetLabelText.textContent = '繁體中文（通用標準）';
      }
    } else {
      sourceLabelText.textContent = '繁體中文（輸入）';
      if (mode === 'tw2sp') {
        targetLabelText.textContent = '簡體中文（大陸習慣詞彙）';
      } else {
        targetLabelText.textContent = '簡體中文（通用標準）';
      }
    }
  }

  /**
   * Update Character & Line Count
   */
  function updateStats() {
    const srcVal = sourceText.value;
    const tgtVal = targetText.value;

    sourceCharCount.textContent = srcVal.length.toLocaleString();
    sourceLineCount.textContent = srcVal ? srcVal.split('\n').length.toLocaleString() : '0';

    targetCharCount.textContent = tgtVal.length.toLocaleString();
    targetLineCount.textContent = tgtVal ? tgtVal.split('\n').length.toLocaleString() : '0';
  }

  /**
   * Perform Conversion
   */
  function doConvert() {
    const raw = sourceText.value;
    if (!raw) {
      targetText.value = '';
      diffView.innerHTML = '';
      updateStats();
      return;
    }

    const mode = conversionMode.value;
    const converter = getConverter(mode);

    if (!converter) {
      engineStatus.textContent = '引擎載入中...';
      return;
    }

    engineStatus.textContent = '轉換完成';
    const converted = converter(raw);
    targetText.value = converted;

    if (diffViewToggle.checked) {
      renderDiff(raw, converted);
    }

    updateStats();
  }

  /**
   * Compute character-level diff and render highlighted HTML
   */
  function renderDiff(src, tgt) {
    if (!src || !tgt) {
      diffView.innerHTML = '';
      return;
    }

    const minLen = Math.min(src.length, tgt.length);
    let html = '';
    let i = 0;

    while (i < tgt.length) {
      if (i < minLen && src[i] !== tgt[i]) {
        let diffStart = i;
        while (i < tgt.length && (i >= minLen || src[i] !== tgt[i])) {
          i++;
        }
        const diffText = escapeHtml(tgt.slice(diffStart, i));
        html += `<mark class="diff-highlight" title="已轉換詞句">${diffText}</mark>`;
      } else {
        html += escapeHtml(tgt[i]);
        i++;
      }
    }

    diffView.innerHTML = html;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Toggle Diff View visibility
   */
  function updateDiffView() {
    if (diffViewToggle.checked) {
      targetText.style.display = 'none';
      diffView.style.display = 'block';
      renderDiff(sourceText.value, targetText.value);
    } else {
      targetText.style.display = 'block';
      diffView.style.display = 'none';
    }
  }

  /**
   * Swap Inputs & Flip Conversion Direction
   */
  function swapPanes() {
    const currentSource = sourceText.value;
    const currentTarget = targetText.value;
    const currentMode = conversionMode.value;

    // Flip mode
    let newMode;
    if (currentMode === 's2twp') newMode = 'tw2sp';
    else if (currentMode === 's2tw') newMode = 'tw2sp';
    else if (currentMode === 's2t') newMode = 't2s';
    else if (currentMode === 's2hk') newMode = 't2s';
    else if (currentMode === 'tw2sp') newMode = 's2twp';
    else if (currentMode === 't2s') newMode = 's2t';
    else newMode = 's2twp';

    conversionMode.value = newMode;
    updateLabels();

    // Exchange content
    sourceText.value = currentTarget || currentSource;
    doConvert();

    showToast('已互換文字與轉換方向 ⇄', 'info');
  }

  /**
   * Copy Output to Clipboard
   */
  async function copyOutput() {
    const text = targetText.value;
    if (!text) {
      showToast('目前沒有可複製的內容', 'info');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        targetText.select();
        document.execCommand('copy');
      }

      copyBtnText.textContent = '已複製 ✔';
      showToast('已成功複製到剪貼簿！', 'success');

      setTimeout(() => {
        copyBtnText.textContent = '複製結果';
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('複製失敗，請手動全選複製', 'info');
    }
  }

  /**
   * Paste from Clipboard
   */
  async function pasteToSource() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          sourceText.value = text;
          if (liveConvertToggle.checked) doConvert();
          else updateStats();
          showToast('已貼上剪貼簿內容', 'info');
        }
      } else {
        sourceText.focus();
        showToast('請使用鍵盤 Ctrl+V 貼上', 'info');
      }
    } catch (err) {
      sourceText.focus();
      showToast('請使用鍵盤 Ctrl+V 貼上', 'info');
    }
  }

  /**
   * Download as .txt file
   */
  function downloadTarget() {
    const text = targetText.value;
    if (!text) {
      showToast('目前沒有可下載的內容', 'info');
      return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${conversionMode.value}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('文字檔案已開始下載', 'success');
  }

  /**
   * Load Sample Text
   */
  function loadSample(key) {
    if (!SAMPLES[key]) return;
    sourceText.value = SAMPLES[key];
    doConvert();
    showToast('已載入範例文本', 'info');
  }

  /**
   * Toast notification system
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s ease forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 2400);
  }

  /**
   * Theme Management (Light / Dark)
   */
  function initTheme() {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      document.body.className = savedTheme;
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.className = prefersDark ? 'theme-dark' : 'theme-light';
    }

    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      const nextTheme = isDark ? 'theme-light' : 'theme-dark';
      document.body.className = nextTheme;
      localStorage.setItem('app-theme', nextTheme);
    });
  }

  /**
   * Drag & Drop and File Input handling
   */
  function initFileDrop() {
    ['dragenter', 'dragover'].forEach(eventName => {
      sourceWrapper.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropOverlay.classList.add('active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      sourceWrapper.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropOverlay.classList.remove('active');
      });
    });

    sourceWrapper.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        readFile(files[0]);
      }
    });

    uploadFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        readFile(e.target.files[0]);
      }
    });

    function readFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        sourceText.value = evt.target.result;
        doConvert();
        showToast(`已成功讀取檔案：${file.name}`, 'success');
      };
      reader.onerror = function () {
        showToast('檔案讀取失敗', 'info');
      };
      reader.readAsText(file, 'UTF-8');
    }
  }

  /**
   * Event Listeners Registration
   */
  function initEvents() {
    // Input live conversion
    let debounceTimer = null;
    sourceText.addEventListener('input', () => {
      updateStats();
      if (liveConvertToggle.checked) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doConvert, 60);
      }
    });

    // Keyboard shortcuts: Ctrl+Enter or Cmd+Enter to convert immediately
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        doConvert();
        showToast('已執行轉換', 'info');
      }
    });

    // Conversion mode change
    conversionMode.addEventListener('change', () => {
      updateLabels();
      doConvert();
    });

    // Buttons
    convertBtn.addEventListener('click', doConvert);
    swapBtn.addEventListener('click', swapPanes);
    copyBtn.addEventListener('click', copyOutput);
    pasteBtn.addEventListener('click', pasteToSource);
    downloadBtn.addEventListener('click', downloadTarget);

    clearSourceBtn.addEventListener('click', () => {
      sourceText.value = '';
      targetText.value = '';
      diffView.innerHTML = '';
      updateStats();
      showToast('已清空文字', 'info');
      sourceText.focus();
    });

    diffViewToggle.addEventListener('change', updateDiffView);

    // Quick Samples
    document.querySelectorAll('.sample-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        loadSample(btn.dataset.sample);
      });
    });
  }

  // Initial startup
  function init() {
    initTheme();
    initFileDrop();
    initEvents();
    updateLabels();

    // Check OpenCC ready state
    const checkOpenCC = setInterval(() => {
      if (typeof OpenCC !== 'undefined') {
        clearInterval(checkOpenCC);
        engineStatus.textContent = 'OpenCC 引擎已就緒';
        // Pre-warm default converter
        getConverter('s2twp');
        // Ready for user input immediately
        sourceText.focus();
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
