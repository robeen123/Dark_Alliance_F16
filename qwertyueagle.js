/**
 * أداة استنساخ الويب المتقدمة
 * الإصدار 3.0
 * 
 * المميزات:
 * - استنساخ كامل لصفحات الويب
 * - تحليل SEO والأداء
 * - كشف البيانات السرية والمخفية
 * - تصدير متعدد الصيغ
 * - واجهة سهلة الاستخدام
 */

// حالة التطبيق
const AppState = {
    currentPage: null,
    clonedPages: [],
    settings: {
        darkMode: false,
        language: 'ar',
        autoScan: true,
        saveHistory: true,
        maxDepth: 2
    },
    isCloning: false,
    abortController: null
};

// عناصر DOM
const DOM = {
    // النموذج
    urlInput: document.getElementById('url-input'),
    cloneBtn: document.getElementById('clone-btn'),
    includeAssets: document.getElementById('include-assets'),
    includeJS: document.getElementById('include-js'),
    scanSecrets: document.getElementById('scan-secrets'),
    depthSelect: document.getElementById('depth-select'),
    
    // التقدم
    progressSection: document.getElementById('progress-section'),
    progressFill: document.getElementById('progress-fill'),
    statusMessage: document.getElementById('status-message'),
    cancelBtn: document.getElementById('cancel-btn'),
    
    // النتائج
    resultSection: document.getElementById('result-section'),
    pageTitle: document.getElementById('page-title'),
    pageUrl: document.getElementById('page-url'),
    cloneTime: document.getElementById('clone-time'),
    
    // المعاينة
    pagePreview: document.getElementById('page-preview'),
    htmlContent: document.getElementById('html-content'),
    
    // الأصول
    imagesContainer: document.getElementById('images-container'),
    cssContainer: document.getElementById('css-container'),
    jsContainer: document.getElementById('js-container'),
    
    // التحليل
    seoScore: document.getElementById('seo-score'),
    seoScoreText: document.getElementById('seo-score-text'),
    seoIssues: document.getElementById('seo-issues'),
    pageSize: document.getElementById('page-size'),
    loadTime: document.getElementById('load-time'),
    requestsCount: document.getElementById('requests-count'),
    performanceSuggestions: document.getElementById('performance-suggestions'),
    
    // البيانات السرية
    apiKeysList: document.getElementById('api-keys-list'),
    credentialsList: document.getElementById('credentials-list'),
    storageData: document.getElementById('storage-data'),
    
    // التصدير
    exportPDF: document.getElementById('export-pdf'),
    exportHTML: document.getElementById('export-html'),
    exportJSON: document.getElementById('export-json'),
    exportZIP: document.getElementById('export-zip'),
    
    // الإعدادات
    settingsBtn: document.getElementById('settings-btn'),
    helpBtn: document.getElementById('help-btn'),
    settingsModal: document.getElementById('settings-modal'),
    helpModal: document.getElementById('help-modal'),
    languageSelect: document.getElementById('language-select'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    autoScanToggle: document.getElementById('auto-scan-toggle'),
    saveHistoryToggle: document.getElementById('save-history-toggle'),
    saveSettingsBtn: document.getElementById('save-settings')
};

// تهيئة التطبيق
function initApp() {
    loadSettings();
    setupEventListeners();
    updateUI();
}

// تحميل الإعدادات
function loadSettings() {
    const savedSettings = localStorage.getItem('webClonerSettings');
    if (savedSettings) {
        AppState.settings = JSON.parse(savedSettings);
    }
}

// حفظ الإعدادات
function saveSettings() {
    localStorage.setItem('webClonerSettings', JSON.stringify(AppState.settings));
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أحداث النموذج
    DOM.cloneBtn.addEventListener('click', startCloning);
    DOM.cancelBtn.addEventListener('click', cancelCloning);
    
    // أحداث التصدير
    DOM.exportPDF.addEventListener('click', () => exportReport('pdf'));
    DOM.exportHTML.addEventListener('click', () => exportReport('html'));
    DOM.exportJSON.addEventListener('click', () => exportReport('json'));
    DOM.exportZIP.addEventListener('click', () => exportReport('zip'));
    
    // أحداث الإعدادات
    DOM.settingsBtn.addEventListener('click', openSettingsModal);
    DOM.helpBtn.addEventListener('click', openHelpModal);
    DOM.saveSettingsBtn.addEventListener('click', saveAppSettings);
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // النقر خارج النافذة المنبثقة لإغلاقها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// تحديث واجهة المستخدم حسب الإعدادات
function updateUI() {
    // الوضع الداكن
    if (AppState.settings.darkMode) {
        document.body.classList.add('dark-mode');
        DOM.darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        DOM.darkModeToggle.checked = false;
    }
    
    // اللغة
    DOM.languageSelect.value = AppState.settings.language;
    
    // الإعدادات الأخرى
    DOM.autoScanToggle.checked = AppState.settings.autoScan;
    DOM.saveHistoryToggle.checked = AppState.settings.saveHistory;
    DOM.depthSelect.value = AppState.settings.maxDepth;
}

// بدء عملية الاستنساخ
async function startCloning() {
    const url = DOM.urlInput.value.trim();
    
    if (!url) {
        showStatus('يرجى إدخال رابط الصفحة', 'error');
        DOM.urlInput.focus();
        return;
    }
    
    if (!isValidUrl(url)) {
        showStatus('الرابط غير صالح، يرجى التحقق من الرابط', 'error');
        return;
    }
    
    try {
        // إعداد حالة الاستنساخ
        AppState.isCloning = true;
        AppState.abortController = new AbortController();
        
        // إعداد واجهة المستخدم
        prepareForCloning();
        
        // استنساخ الصفحة
        const pageData = await clonePage(url);
        
        // حفظ النتائج
        AppState.currentPage = pageData;
        if (AppState.settings.saveHistory) {
            AppState.clonedPages.unshift(pageData);
        }
        
        // عرض النتائج
        displayResults(pageData);
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('فشل استنساخ الصفحة:', error);
            showStatus(`فشل استنساخ الصفحة: ${error.message}`, 'error');
        }
    } finally {
        // إعادة تعيين حالة الاستنساخ
        AppState.isCloning = false;
        AppState.abortController = null;
        
        // إعادة تعيين واجهة المستخدم
        resetUIAfterCloning();
    }
}

// إعداد واجهة المستخدم لعملية الاستنساخ
function prepareForCloning() {
    // إظهار مؤشر التقدم
    DOM.progressSection.classList.remove('hidden');
    DOM.resultSection.classList.add('hidden');
    
    // تعطيل النموذج
    DOM.cloneBtn.disabled = true;
    DOM.urlInput.disabled = true;
    
    // إعادة تعيين شريط التقدم
    DOM.progressFill.style.width = '0%';
    showStatus('جاري تحميل الصفحة...', 'info');
}

// إعادة تعيين واجهة المستخدم بعد الاستنساخ
function resetUIAfterCloning() {
    // إخفاء مؤشر التقدم
    DOM.progressSection.classList.add('hidden');
    
    // تمكين النموذج
    DOM.cloneBtn.disabled = false;
    DOM.urlInput.disabled = false;
}

// إلغاء عملية الاستنساخ
function cancelCloning() {
    if (AppState.isCloning && AppState.abortController) {
        AppState.abortController.abort();
        showStatus('تم إلغاء عملية الاستنساخ', 'warning');
    }
}

// استنساخ صفحة الويب
async function clonePage(url) {
    try {
        const pageData = {
            url: url,
            title: '',
            html: '',
            assets: {
                images: [],
                css: [],
                js: []
            },
            stats: {
                size: 0,
                loadTime: 0,
                requests: 0
            },
            seo: {
                score: 0,
                issues: [],
                suggestions: []
            },
            secrets: {
                apiKeys: [],
                credentials: [],
                storage: []
            },
            clonedAt: new Date().toISOString()
        };
        
        // استخدام CORS Proxy للتحايل على القيود
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        // جلب الصفحة
        updateProgress(10, 'جاري جلب محتوى الصفحة...');
        const startTime = Date.now();
        const response = await fetch(proxyUrl, {
            signal: AppState.abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`فشل جلب الصفحة: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.contents) {
            throw new Error('لا يوجد محتوى في الاستجابة');
        }
        
        // تحليل HTML
        updateProgress(30, 'جاري تحليل المحتوى...');
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // استخراج المعلومات الأساسية
        pageData.title = doc.title || 'صفحة بدون عنوان';
        pageData.html = data.contents;
        pageData.stats.size = new Blob([data.contents]).size;
        pageData.stats.loadTime = (Date.now() - startTime) / 1000;
        
        // استخراج الصور
        updateProgress(50, 'جاري استخراج الصور...');
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            const src = img.src || img.getAttribute('data-src');
            if (src) {
                try {
                    const absoluteSrc = new URL(src, url).href;
                    pageData.assets.images.push({
                        src: absoluteSrc,
                        alt: img.alt || '',
                        width: img.width || 0,
                        height: img.height || 0
                    });
                } catch (e) {
                    console.warn('رابط الصورة غير صالح:', src);
                }
            }
        });
        
        // استخراج ملفات CSS
        updateProgress(60, 'جاري استخراج ملفات CSS...');
        const cssLinks = doc.querySelectorAll('link[rel="stylesheet"]');
        cssLinks.forEach(link => {
            const href = link.href;
            if (href) {
                try {
                    const absoluteHref = new URL(href, url).href;
                    pageData.assets.css.push({
                        href: absoluteHref,
                        media: link.media || 'all'
                    });
                } catch (e) {
                    console.warn('رابط CSS غير صالح:', href);
                }
            }
        });
        
        // استخراج ملفات JavaScript
        updateProgress(70, 'جاري استخراج ملفات JavaScript...');
        const scripts = doc.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.src;
            if (src) {
                try {
                    const absoluteSrc = new URL(src, url).href;
                    pageData.assets.js.push({
                        src: absoluteSrc,
                        async: script.async,
                        defer: script.defer,
                        type: script.type || 'text/javascript'
                    });
                } catch (e) {
                    console.warn('رابط JavaScript غير صالح:', src);
                }
            }
        });
        
        // حساب عدد الطلبات
        pageData.stats.requests = 
            pageData.assets.images.length + 
            pageData.assets.css.length + 
            pageData.assets.js.length;
        
        // تحليل SEO
        updateProgress(80, 'جاري تحليل SEO...');
        analyzeSEO(pageData, doc);
        
        // البحث عن البيانات السرية
        if (AppState.settings.autoScan) {
            updateProgress(90, 'جاري البحث عن بيانات سرية...');
            scanForSecrets(pageData, data.contents);
        }
        
        updateProgress(100, 'تم استنساخ الصفحة بنجاح!');
        return pageData;
        
    } catch (error) {
        throw error;
    }
}

// تحليل SEO للصفحة
function analyzeSEO(pageData, doc) {
    let score = 100;
    const issues = [];
    const suggestions = [];
    
    // التحقق من وجود عنوان
    if (!pageData.title || pageData.title === 'صفحة بدون عنوان') {
        issues.push('الصفحة لا تحتوي على عنوان');
        score -= 15;
    } else if (pageData.title.length > 60) {
        issues.push('عنوان الصفحة طويل جداً (يفضل أقل من 60 حرفاً)');
        score -= 5;
    }
    
    // التحقق من وجود وصف
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (!metaDesc || !metaDesc.content) {
        issues.push('الصفحة لا تحتوي على وصف meta');
        score -= 10;
    } else if (metaDesc.content.length > 160) {
        issues.push('وصف الصفحة طويل جداً (يفضل أقل من 160 حرفاً)');
        score -= 3;
    }
    
    // التحقق من وجود كلمات مفتاحية
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    if (!metaKeywords || !metaKeywords.content) {
        suggestions.push('إضافة كلمات مفتاحية meta لتحسين SEO');
        score -= 5;
    }
    
    // التحقق من العناوين
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length === 0) {
        issues.push('الصفحة لا تحتوي على أي عنصر h1');
        score -= 10;
    } else if (h1s.length > 1) {
        issues.push('الصفحة تحتوي على أكثر من عنصر h1 (يفضل وجود واحد فقط)');
        score -= 5;
    }
    
    // التحقق من الصور بدون نص بديل
    const imagesWithoutAlt = pageData.assets.images.filter(img => !img.alt);
    if (imagesWithoutAlt.length > 0) {
        issues.push(`هناك ${imagesWithoutAlt.length} صورة بدون نص بديل (alt)`);
        score -= imagesWithoutAlt.length * 2;
    }
    
    // ضمان أن الدرجة لا تقل عن 0
    pageData.seo.score = Math.max(0, score);
    pageData.seo.issues = issues;
    pageData.seo.suggestions = suggestions;
}

// البحث عن بيانات سرية
function scanForSecrets(pageData, htmlContent) {
    // أنماط للبحث عن بيانات سرية
    const patterns = {
        apiKeys: /(api|access|secret|private)[_\-]?key(=|:|\s)[\'"]?[a-z0-9]{20,}[\'"]?/gi,
        passwords: /(password|passwd|pwd)(=|:|\s)[\'"]?[^\s\'"]+[\'"]?/gi,
        tokens: /(token|session|auth)[_\-]?(id|key|secret)(=|:|\s)[\'"]?[a-z0-9]{20,}[\'"]?/gi
    };
    
    // البحث في محتوى HTML
    for (const [type, regex] of Object.entries(patterns)) {
        const matches = htmlContent.match(regex) || [];
        if (matches.length > 0) {
            pageData.secrets[type] = matches;
        }
    }
    
    // البحث في الروابط
    const allAssets = [
        ...pageData.assets.images,
        ...pageData.assets.css,
        ...pageData.assets.js
    ];
    
    const sensitiveUrls = allAssets.filter(asset => {
        return asset.src.includes('api_key') || 
               asset.src.includes('secret') || 
               asset.src.includes('token');
    });
    
    if (sensitiveUrls.length > 0) {
        pageData.secrets.apiKeys.push(...sensitiveUrls.map(asset => asset.src));
    }
}

// عرض النتائج
function displayResults(pageData) {
    // المعلومات الأساسية
    DOM.pageTitle.textContent = pageData.title;
    DOM.pageUrl.textContent = pageData.url;
    DOM.pageUrl.href = pageData.url;
    DOM.cloneTime.textContent = new Date(pageData.clonedAt).toLocaleString();
    
    // المعاينة
    DOM.pagePreview.srcdoc = pageData.html;
    DOM.htmlContent.textContent = pageData.html;
    
    // الأصول
    displayAssets(pageData.assets);
    
    // تحليل SEO
    displaySEOAnalysis(pageData.seo);
    
    // الأداء
    DOM.pageSize.textContent = `${Math.round(pageData.stats.size / 1024)} KB`;
    DOM.loadTime.textContent = pageData.stats.loadTime.toFixed(2);
    DOM.requestsCount.textContent = pageData.stats.requests;
    
    // البيانات السرية
    displaySecrets(pageData.secrets);
    
    // إظهار قسم النتائج
    DOM.resultSection.classList.remove('hidden');
}

// عرض الأصول
function displayAssets(assets) {
    // الصور
    DOM.imagesContainer.innerHTML = '';
    assets.images.forEach(img => {
        const imgElement = document.createElement('div');
        imgElement.className = 'asset-item';
        imgElement.innerHTML = `
            <img src="${img.src}" alt="${img.alt}" class="asset-img" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Cpath%20fill%3D%22%23ddd%22%20d%3D%22M30%2C50%20L70%2C50%20L50%2C30%20Z%22%2F%3E%3C%2Fsvg%3E'">
            <div class="asset-info">
                <div class="asset-name">${getFileNameFromUrl(img.src)}</div>
                <div class="asset-size">${img.width}x${img.height}</div>
            </div>
        `;
        DOM.imagesContainer.appendChild(imgElement);
    });
    
    // ملفات CSS
    DOM.cssContainer.innerHTML = '';
    assets.css.forEach(css => {
        const cssElement = document.createElement('div');
        cssElement.className = 'asset-item';
        cssElement.innerHTML = `
            <i class="fas fa-file-css"></i>
            <div class="asset-info">
                <div class="asset-name">${getFileNameFromUrl(css.href)}</div>
                <a href="${css.href}" target="_blank">فتح</a>
            </div>
        `;
        DOM.cssContainer.appendChild(cssElement);
    });
    
    // ملفات JavaScript
    DOM.jsContainer.innerHTML = '';
    assets.js.forEach(js => {
        const jsElement = document.createElement('div');
        jsElement.className = 'asset-item';
        jsElement.innerHTML = `
            <i class="fas fa-file-code"></i>
            <div class="asset-info">
                <div class="asset-name">${getFileNameFromUrl(js.src)}</div>
                <a href="${js.src}" target="_blank">فتح</a>
            </div>
        `;
        DOM.jsContainer.appendChild(jsElement);
    });
}

// عرض تحليل SEO
function displaySEOAnalysis(seoData) {
    DOM.seoScore.style.width = `${seoData.score}%`;
    DOM.seoScoreText.textContent = `${seoData.score}%`;
    
    // المشكلات
    DOM.seoIssues.innerHTML = '';
    seoData.issues.forEach(issue => {
        const li = document.createElement('li');
        li.textContent = issue;
        DOM.seoIssues.appendChild(li);
    });
    
    // الاقتراحات
    DOM.performanceSuggestions.innerHTML = '';
    seoData.suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        DOM.performanceSuggestions.appendChild(li);
    });
}

// عرض البيانات السرية
function displaySecrets(secrets) {
    // مفاتيح API
    DOM.apiKeysList.innerHTML = '';
    secrets.apiKeys.forEach(key => {
        const item = document.createElement('div');
        item.className = 'secret-item';
        item.textContent = key;
        DOM.apiKeysList.appendChild(item);
    });
    
    // بيانات الاعتماد
    DOM.credentialsList.innerHTML = '';
    secrets.credentials.forEach(cred => {
        const item = document.createElement('div');
        item.className = 'secret-item';
        item.textContent = cred;
        DOM.credentialsList.appendChild(item);
    });
    
    // بيانات التخزين
    DOM.storageData.innerHTML = '';
    secrets.storage.forEach(item => {
        const div = document.createElement('div');
        div.className = 'secret-item';
        div.textContent = item;
        DOM.storageData.appendChild(div);
    });
}

// تصدير التقرير
function exportReport(format) {
    if (!AppState.currentPage) {
        showStatus('لا توجد بيانات للتصدير', 'error');
        return;
    }
    
    try {
        switch (format) {
            case 'pdf':
                exportAsPDF();
                break;
            case 'html':
                exportAsHTML();
                break;
            case 'json':
                exportAsJSON();
                break;
            case 'zip':
                exportAsZIP();
                break;
            default:
                showStatus('صيغة التصدير غير مدعومة', 'error');
        }
    } catch (error) {
        console.error('خطأ في التصدير:', error);
        showStatus('فشل عملية التصدير', 'error');
    }
}

// تصدير كـ PDF
function exportAsPDF() {
    showStatus('جاري إنشاء ملف PDF...', 'info');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // إضافة عنوان
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('تقرير استنساخ الصفحة', 105, 20, { align: 'center' });
    
    // إضافة معلومات الصفحة
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`العنوان: ${AppState.currentPage.title}`, 20, 40);
    doc.text(`الرابط: ${AppState.currentPage.url}`, 20, 50);
    doc.text(`تاريخ الاستنساخ: ${new Date(AppState.currentPage.clonedAt).toLocaleString()}`, 20, 60);
    
    // إضافة تحليل SEO
    doc.setFont('Helvetica', 'bold');
    doc.text('تحليل SEO:', 20, 80);
    doc.setFont('Helvetica', 'normal');
    doc.text(`الدرجة: ${AppState.currentPage.seo.score}/100`, 30, 90);
    
    let yPos = 100;
    if (AppState.currentPage.seo.issues.length > 0) {
        doc.text('المشكلات:', 30, yPos);
        yPos += 10;
        
        AppState.currentPage.seo.issues.forEach(issue => {
            doc.text(`- ${issue}`, 40, yPos);
            yPos += 10;
        });
    }
    
    // حفظ الملف
    doc.save(`استنساخ_${getFileNameFromUrl(AppState.currentPage.url)}.pdf`);
    showStatus('تم تصدير الملف بنجاح', 'success');
}

// تصدير كـ HTML
function exportAsHTML() {
    showStatus('جاري إنشاء ملف HTML...', 'info');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير استنساخ: ${AppState.currentPage.title}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                h1, h2 { color: #3498db; }
                .report-section { margin-bottom: 30px; }
                .issue { color: #e74c3c; }
                .suggestion { color: #2ecc71; }
            </style>
        </head>
        <body>
            <h1>تقرير استنساخ الصفحة</h1>
            <div class="report-section">
                <h2>معلومات الصفحة</h2>
                <p><strong>العنوان:</strong> ${AppState.currentPage.title}</p>
                <p><strong>الرابط:</strong> <a href="${AppState.currentPage.url}">${AppState.currentPage.url}</a></p>
                <p><strong>تاريخ الاستنساخ:</strong> ${new Date(AppState.currentPage.clonedAt).toLocaleString()}</p>
            </div>
            
            <div class="report-section">
                <h2>تحليل SEO</h2>
                <p><strong>الدرجة:</strong> ${AppState.currentPage.seo.score}/100</p>
                
                ${AppState.currentPage.seo.issues.length > 0 ? `
                <h3>المشكلات</h3>
                <ul>
                    ${AppState.currentPage.seo.issues.map(issue => `<li class="issue">${issue}</li>`).join('')}
                </ul>
                ` : ''}
                
                ${AppState.currentPage.seo.suggestions.length > 0 ? `
                <h3>اقتراحات للتحسين</h3>
                <ul>
                    ${AppState.currentPage.seo.suggestions.map(suggestion => `<li class="suggestion">${suggestion}</li>`).join('')}
                </ul>
                ` : ''}
            </div>
            
            <div class="report-section">
                <h2>البيانات السرية</h2>
                ${AppState.currentPage.secrets.apiKeys.length > 0 ? `
                <h3>مفاتيح API</h3>
                <ul>
                    ${AppState.currentPage.secrets.apiKeys.map(key => `<li>${key}</li>`).join('')}
                </ul>
                ` : '<p>لم يتم العثور على مفاتيح API</p>'}
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    saveAs(blob, `استنساخ_${getFileNameFromUrl(AppState.currentPage.url)}.html`);
    showStatus('تم تصدير الملف بنجاح', 'success');
}

// تصدير كـ JSON
function exportAsJSON() {
    showStatus('جاري إنشاء ملف JSON...', 'info');
    
    const jsonContent = JSON.stringify(AppState.currentPage, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    saveAs(blob, `استنساخ_${getFileNameFromUrl(AppState.currentPage.url)}.json`);
    showStatus('تم تصدير الملف بنجاح', 'success');
}

// تصدير كـ ZIP
function exportAsZIP() {
    showStatus('جاري إنشاء ملف ZIP...', 'info');
    
    const zip = new JSZip();
    const folder = zip.folder('cloned_page');
    
    // إضافة ملف HTML
    folder.file('index.html', AppState.currentPage.html);
    
    // إضافة ملف التقرير
    const reportContent = `
        عنوان الصفحة: ${AppState.currentPage.title}
        الرابط: ${AppState.currentPage.url}
        تاريخ الاستنساخ: ${new Date(AppState.currentPage.clonedAt).toLocaleString()}
        
        تحليل SEO:
        الدرجة: ${AppState.currentPage.seo.score}/100
        
        المشكلات:
        ${AppState.currentPage.seo.issues.join('\n')}
        
        الاقتراحات:
        ${AppState.currentPage.seo.suggestions.join('\n')}
    `;
    
    folder.file('report.txt', reportContent);
    
    // إنشاء ملف ZIP
    zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, `استنساخ_${getFileNameFromUrl(AppState.currentPage.url)}.zip`);
        showStatus('تم تصدير الملف بنجاح', 'success');
    });
}

// فتح نافذة الإعدادات
function openSettingsModal() {
    DOM.settingsModal.classList.add('active');
}

// فتح نافذة المساعدة
function openHelpModal() {
    DOM.helpModal.classList.add('active');
}

// إغلاق جميع النوافذ المنبثقة
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// حفظ إعدادات التطبيق
function saveAppSettings() {
    AppState.settings = {
        darkMode: DOM.darkModeToggle.checked,
        language: DOM.languageSelect.value,
        autoScan: DOM.autoScanToggle.checked,
        saveHistory: DOM.saveHistoryToggle.checked,
        maxDepth: parseInt(DOM.depthSelect.value)
    };
    
    saveSettings();
    updateUI();
    closeAllModals();
    showStatus('تم حفظ الإعدادات بنجاح', 'success');
}

// تحديث شريط التقدم
function updateProgress(percent, message) {
    DOM.progressFill.style.width = `${percent}%`;
    showStatus(message, 'info');
}

// عرض رسالة الحالة
function showStatus(message, type) {
    DOM.statusMessage.textContent = message;
    DOM.statusMessage.className = 'status-message';
    
    switch (type) {
        case 'error':
            DOM.statusMessage.classList.add('error');
            break;
        case 'success':
            DOM.statusMessage.classList.add('success');
            break;
        case 'warning':
            DOM.statusMessage.classList.add('warning');
            break;
        default:
            DOM.statusMessage.classList.add('info');
    }
}

// التحقق من صحة الرابط
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// استخراج اسم الملف من الرابط
function getFileNameFromUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '') || 'page';
    } catch (e) {
        return 'page';
    }
}

// بدء تشغيل التطبيق
document.addEventListener('DOMContentLoaded', initApp);