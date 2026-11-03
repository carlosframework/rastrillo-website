// 🤖 The tour pages' one script: the step list's collapse, the editor's
// file tabs, and the copy buttons. No dependencies, no network.
//
// Every page is complete without it: the step list is open, the files
// are stacked one under another, and the code is selectable text. This
// only adds conveniences, and each one is switched on by state this
// script sets (a class, the hidden attribute), so a script that fails
// part way leaves the page open rather than half-hidden.
//
// Loaded in <head>, so the remembered collapsed state is on <html>
// before the first paint; the rest waits for the DOM.
(function () {
  var root = document.documentElement;
  var KEY = 'rastrillo-tour-steps';
  // Must match the narrow breakpoint in tour.css.
  var narrow = matchMedia('(max-width: 60rem)');

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: forget it */ }
  }

  // On a phone the columns stack, and an open list of every step would
  // push the lesson off the first screen, so it starts collapsed there.
  // On a wide screen it is however the reader last left it.
  if (narrow.matches || stored() === 'collapsed') root.classList.add('steps-collapsed');

  function stepList() {
    var button = document.querySelector('.steplist .tgl');
    if (!button) return;
    function sync() {
      var collapsed = root.classList.contains('steps-collapsed');
      var label = collapsed ? 'Expand steps' : 'Collapse steps';
      button.setAttribute('aria-expanded', String(!collapsed));
      button.setAttribute('aria-label', label);
      button.title = label;
    }
    button.addEventListener('click', function () {
      var collapsed = root.classList.toggle('steps-collapsed');
      if (!narrow.matches) store(collapsed ? 'collapsed' : 'open');
      sync();
    });
    button.hidden = false;
    sync();
  }

  // The files arrive stacked, each under its own name. Turning them into
  // tabs shows the tab strip, hides every file but one, and hides each
  // file's own name (the strip now carries it).
  function tabs() {
    var editor = document.querySelector('.editor');
    if (!editor) return;
    var strip = editor.querySelector('.tablist');
    var tabs = Array.prototype.slice.call(strip.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
      showFirstChange(panels[index]);
    }
    // A long file opens at its first changed line, not at its imports.
    function showFirstChange(panel) {
      var first = panel.querySelector('pre.code .hl');
      var box = first && first.parentElement;
      while (box && box !== document.body && box.scrollHeight <= box.clientHeight) box = box.parentElement;
      if (!first || !box || box === document.body) return;
      var above = first.getBoundingClientRect().top - box.getBoundingClientRect().top;
      box.scrollTop = Math.max(0, box.scrollTop + above - 32);
    }
    tabs.forEach(function (tab, i) {
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', tab.id);
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (event) {
        var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
        if (to === undefined) return;
        event.preventDefault();
        select((to + tabs.length) % tabs.length, true);
      });
    });
    strip.hidden = false;
    editor.classList.add('tabbed');
    select(0, false);
  }

  // "Copy file" copies the file exactly as written: the <pre>'s text is
  // the file, one line per span. "Copy" copies the commands without the
  // "$ " prompts, one per line.
  function copyButtons() {
    if (!navigator.clipboard) return;
    var status = document.querySelector('.codepane [role="status"]');
    document.querySelectorAll('.copy').forEach(function (button) {
      var text;
      if (button.hasAttribute('data-copy')) {
        var pre = document.getElementById(button.getAttribute('data-copy'));
        text = function () { return pre.textContent; };
      } else {
        var cmds = document.getElementById(button.getAttribute('data-copy-commands'));
        text = function () {
          return Array.prototype.map.call(cmds.querySelectorAll('.c'), function (c) { return c.textContent; }).join('\n');
        };
      }
      var timer;
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(text()).then(function () {
          button.classList.add('done');
          if (status) status.textContent = 'Copied';
          clearTimeout(timer);
          timer = setTimeout(function () {
            button.classList.remove('done');
            if (status) status.textContent = '';
          }, 2000);
        });
      });
      button.hidden = false;
    });
  }

  function init() {
    // Each is independent: one failing must not keep the others off.
    [stepList, tabs, copyButtons].forEach(function (setUp) {
      try { setUp(); } catch (e) { if (window.console) console.error(e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
