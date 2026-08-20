/** @jsxImportSource @kitajs/html */
export function InspectionDrawer() {
  return (
    <>
      <div class="drawer-backdrop" id="drawer-backdrop" hidden onclick="closeTestDrawer()" />
      <aside class="test-drawer" id="test-drawer" hidden aria-label="Test Inspection Details">
        <div class="drawer-header">
          <div class="drawer-header__title-group">
            <span class="drawer-test-id" id="drawer-test-id">
              SC-01
            </span>
            <h2 class="drawer-test-title" id="drawer-test-title">
              Test Title
            </h2>
          </div>
          <button
            type="button"
            class="drawer-close-btn"
            onclick="closeTestDrawer()"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        <div class="drawer-meta-bar" id="drawer-meta-bar" />

        <div class="drawer-tabs" role="tablist" aria-label="Inspection tabs">
          <button
            class="drawer-tab drawer-tab--active"
            id="dtab-trace"
            role="tab"
            aria-selected="true"
            data-drawer-tab="trace"
            onclick="switchDrawerTab('trace')"
          >
            Error &amp; Stack Trace
          </button>
          <button
            class="drawer-tab"
            id="dtab-steps"
            role="tab"
            aria-selected="false"
            data-drawer-tab="steps"
            onclick="switchDrawerTab('steps')"
          >
            Steps Timeline
          </button>
          <button
            class="drawer-tab"
            id="dtab-evidence"
            role="tab"
            aria-selected="false"
            data-drawer-tab="evidence"
            onclick="switchDrawerTab('evidence')"
          >
            Evidence &amp; Media
          </button>
          <button
            class="drawer-tab"
            id="dtab-diagnosis"
            role="tab"
            aria-selected="false"
            data-drawer-tab="diagnosis"
            onclick="switchDrawerTab('diagnosis')"
          >
            AI Triage &amp; Cause
          </button>
        </div>

        <div class="drawer-body">
          <div class="drawer-panel drawer-panel--active" id="drawer-panel-trace">
            <div id="drawer-content-trace" class="drawer-content">
              Select a test to view error details.
            </div>
          </div>
          <div class="drawer-panel drawer-panel--hidden" id="drawer-panel-steps">
            <div id="drawer-content-steps" class="drawer-content">
              Select a test to view steps.
            </div>
          </div>
          <div class="drawer-panel drawer-panel--hidden" id="drawer-panel-evidence">
            <div id="drawer-content-evidence" class="drawer-content">
              No media attachments available.
            </div>
          </div>
          <div class="drawer-panel drawer-panel--hidden" id="drawer-panel-diagnosis">
            <div id="drawer-content-diagnosis" class="drawer-content">
              No diagnosis available.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function InspectionDrawerScript() {
  return (
    <script>
      {`
    (function() {
      window.openTestDrawer = function(testId) {
        var testDataMap = window.__TEST_DATA_MAP__ || {};
        var data = testDataMap[testId];

        if (!data) {
          var keys = Object.keys(testDataMap);
          for (var i = 0; i < keys.length; i++) {
            if (keys[i].toLowerCase() === String(testId).toLowerCase()) {
              data = testDataMap[keys[i]];
              break;
            }
          }
        }
        if (!data) return;

        var drawer = document.getElementById('test-drawer');
        var backdrop = document.getElementById('drawer-backdrop');
        if (!drawer || !backdrop) return;

        document.getElementById('drawer-test-id').textContent = data.testId || 'TEST';
        document.getElementById('drawer-test-title').textContent = data.title || 'Untitled Test';

        var metaBar = document.getElementById('drawer-meta-bar');
        var statusCls = data.status === 'passed' ? 'status-pill--passed' : data.status === 'skipped' ? 'status-pill--skipped' : 'status-pill--failed';
        var html = '<span class="status-pill ' + statusCls + '">' + escapeHtml(String(data.status || 'unknown').toUpperCase()) + '</span>';
        if (data.priority) {
          html += ' <span class="priority-badge priority-badge--' + escapeHtml(String(data.priority).toLowerCase()) + '">' + escapeHtml(String(data.priority).toUpperCase()) + '</span>';
        }
        if (data.module) {
          html += ' <span class="module-chip">' + escapeHtml(data.module) + '</span>';
        }
        if (data.feature) {
          html += ' <span class="feature-chip">' + escapeHtml(data.feature) + '</span>';
        }
        if (data.failureSource) {
          html += ' <span class="failure-source failure-source--' + escapeHtml(String(data.failureSource)) + '">Cause: ' + escapeHtml(String(data.failureSource).toUpperCase()) + '</span>';
        }
        metaBar.innerHTML = html;

        var traceContent = document.getElementById('drawer-content-trace');
        var errText = data.errorMessage || (data.errors && data.errors.length > 0 ? data.errors.map(function(e){ return e.message + (e.stack ? String.fromCharCode(10) + e.stack : ''); }).join(String.fromCharCode(10) + String.fromCharCode(10)) : '');
        if (errText) {
          traceContent.innerHTML = '<pre class="test-error-view error-block">' + escapeHtml(errText) + '</pre>';
        } else if (data.status === 'passed') {
          traceContent.innerHTML = '<div class="drawer-ok-view"><svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="var(--passed)"/><path d="M4.5 8.2l2.3 2.3 4.7-4.8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="empty-state--ok">Test passed cleanly — no errors recorded.</span></div>';
        } else {
          traceContent.innerHTML = '<p class="empty-state">No errors recorded for this test case.</p>';
        }

        var stepsContent = document.getElementById('drawer-content-steps');
        if (data.steps && data.steps.length > 0) {
          stepsContent.innerHTML = '<div class="tree-item-list">' + data.steps.map(function(st) {
            var icon = st.status === 'passed' ? '✓' : st.status === 'skipped' ? '⊘' : '✕';
            var iconCls = st.status === 'passed' ? 'tree-item__status--passed' : st.status === 'skipped' ? 'tree-item__status--skipped' : 'tree-item__status--failed';
            return '<div class="tree-item"><span class="tree-item__status ' + iconCls + '">' + icon + '</span> ' + escapeHtml(st.title) + ' <span class="tree-item__duration">' + st.duration + 'ms</span></div>';
          }).join('') + '</div>';
        } else {
          stepsContent.innerHTML = '<p class="empty-state">' + (data.status === 'passed'
            ? 'No step-level trace recorded. Test completed successfully.'
            : 'No steps recorded.' + (data.duration ? ' Total duration: ' + data.duration + 'ms.' : '')) + '</p>';
        }

        var evContent = document.getElementById('drawer-content-evidence');
        if (data.attachments && data.attachments.length > 0) {
          evContent.innerHTML = data.attachments.map(function(att) {
            if (att.kind === 'screenshot') {
              return '<figure class="attachment-card"><img src="' + escapeHtml(att.relativePath) + '" style="max-width:100%;border-radius:6px;" /><figcaption>' + escapeHtml(att.name) + '</figcaption></figure>';
            }
            if (att.kind === 'trace') {
              return '<a class="attachment-chip attachment-chip--trace" href="' + escapeHtml(att.relativePath) + '" target="_blank" rel="noopener">Open Trace Viewer · ' + escapeHtml(att.name) + '</a>';
            }
            return '<div class="attachment-chip">' + escapeHtml(att.name) + '</div>';
          }).join('<br>');
        } else {
          var evNote = 'No attachments or evidence captured for this test.';
          if ((data.attachmentCount || 0) > 0) {
            evNote = data.attachmentCount + ' attachment(s) recorded but unavailable in serve mode.';
          }
          evContent.innerHTML = '<p class="empty-state">' + evNote + '</p>';
        }

        var diagContent = document.getElementById('drawer-content-diagnosis');
        if (data.failureSource) {
          diagContent.innerHTML = '<div class="src-cell"><p><strong>Failure Source:</strong> ' + escapeHtml(data.failureSource.toUpperCase()) + '</p><p><strong>Expected vs Actual:</strong></p><pre>Expected: ' + escapeHtml(data.expectedResult || '-') + String.fromCharCode(10) + 'Actual: ' + escapeHtml(data.actualResult || '-') + '</pre></div>';
        } else {
          var kv = '';
          if (data.inputData && Object.keys(data.inputData).length) {
            kv = '<p><strong>Input Data:</strong></p><div class="drawer-kv">' + Object.keys(data.inputData).map(function(k) {
              return '<div class="drawer-kv__row"><span class="drawer-kv__k">' + escapeHtml(k) + '</span><span class="drawer-kv__v">' + escapeHtml(data.inputData[k]) + '</span></div>';
            }).join('') + '</div>';
          }
          var layers = (data.affectedLayer && data.affectedLayer.length) ? data.affectedLayer.join(', ') : '-';
          diagContent.innerHTML = '<div class="src-cell src-cell--ok"><p><strong>✅ Test verified — no diagnosis needed</strong></p>' +
            '<p><strong>Expected:</strong> ' + escapeHtml(data.expectedResult || '-') + '</p>' +
            '<p><strong>Actual:</strong> ' + escapeHtml(data.actualResult || '-') + '</p>' +
            kv +
            '<p><strong>Affected Layer:</strong> ' + escapeHtml(layers) + '</p>' +
            '<p><strong>Duration:</strong> ' + escapeHtml(String(data.duration || 0)) + 'ms</p></div>';
        }

        window.switchDrawerTab('trace');
        drawer.hidden = false;
        backdrop.hidden = false;
      };

      window.closeTestDrawer = function() {
        var drawer = document.getElementById('test-drawer');
        var backdrop = document.getElementById('drawer-backdrop');
        if (drawer && backdrop) {
          drawer.hidden = true;
          backdrop.hidden = true;
        }
      };

      window.switchDrawerTab = function(tabName) {
        var tabs = ['trace', 'steps', 'evidence', 'diagnosis'];
        tabs.forEach(function(t) {
          var tabBtn = document.getElementById('dtab-' + t);
          var panel = document.getElementById('drawer-panel-' + t);
          if (tabBtn && panel) {
            var active = t === tabName;
            tabBtn.classList.toggle('drawer-tab--active', active);
            tabBtn.setAttribute('aria-selected', active ? 'true' : 'false');
            panel.classList.toggle('drawer-panel--active', active);
            panel.classList.toggle('drawer-panel--hidden', !active);
          }
        });
      };

      document.addEventListener('click', function(ev) {
        var el = ev.target;
        while (el && el !== document) {
          if (el.getAttribute && el.hasAttribute('data-test-id')) {
            var id = el.getAttribute('data-test-id');
            if (id) window.openTestDrawer(id);
            break;
          }
          el = el.parentNode;
        }
      });

      function escapeHtml(str) {
        return String(str == null ? '' : str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    })();
      `}
    </script>
  );
}
