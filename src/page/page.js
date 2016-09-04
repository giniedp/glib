var GlibSamples = GlibSamples || {}; 
(function(module) {
  'use strict';
  
    if (Prism.plugins.NormalizeWhitespace) {
      Prism.plugins.NormalizeWhitespace.setDefaults({
        'remove-trailing': true,
        'remove-indent': true,
        'left-trim': true,
        'right-trim': true,
        //'break-lines': 80,
        //'indent': 2,
        //'remove-initial-line-feed': true,
        //'tabs-to-spaces': 4,
        //'spaces-to-tabs': 4
      });
    }

    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;',
      "/": '&#x2F;'
    };
    function escapeHtml(string) {
      return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
      });
    }
    function fixIndents(string) {
      var lines = string.split("\n");
      if (!lines.length) return string;
      if (lines[0].trim().startsWith('<script')) {
        lines[0] = '    ' + lines[0];
        return lines.join('\n');
      }
      return string;
    }

    function makeSnippet(html, language) {
      var preEl = $('<pre>').addClass('language-' + language).addClass('line-numbers');
      var codeEl = $('<code>').appendTo(preEl).text(fixIndents(html));
      Prism.highlightElement(codeEl[0]);
      return preEl;
    }

    function getItem(key) {
      if (window.localStorage) {
        return window.localStorage.getItem(key)
      }
    }
    function setItem(key, value) {
      if (window.localStorage) {
        window.localStorage.setItem(key, value)
      }
    }
    module.bootSample = function(options) {
      var view = $(options.view);
      var code = $(options.code);
      var source = $(options.source);

      var tabs = [];
      function currentTab() {
        var tab = tabs[tabs.length-1] || { 
          name: 'Example', 
          content: $('<div>').addClass('tab-content') 
        };
        tabs[tabs.length-1] = tab;
        return tab;
      }
      source.children().each(function() {
        var $this = $(this);
        if ($this.is('a[name]')) {
          tabs.push({
            name: $this.attr('name'),
            index: Number($this.attr('index'))|0,
            content: $('<div>').addClass('tab-content')
          });
        } else if ($this.is('viewcode')) {
          makeSnippet(view[0].innerHTML, 'html').appendTo(currentTab().content);
        } else if ($this.is('script') && !$this.is('[no-example]')) {
          makeSnippet($this[0].outerHTML, 'html').appendTo(currentTab().content);
        } else if ($this.is('style')) {
          makeSnippet($this[0].outerHTML, 'html').appendTo(currentTab().content);  
        } else if ($this.is('[example]')) {
          $this.detach().appendTo(currentTab().content);
          makeSnippet($this.html(), 'html').appendTo(currentTab().content);
        } else {
          $this.detach().appendTo(currentTab().content);
        }
      });

      var tabsEl = $('<div>').addClass('sample-tabs').appendTo(code);
      var contentsEl = $('<div>').addClass('sample-contents').appendTo(code);

      tabs.sort(function(a, b) {
        return a.index - b.index;
      }).forEach(function(tab) {
        var tabEl = $('<a>').text(tab.name).attr('tab', tab.name).appendTo(tabsEl);
        var contentEl = tab.content.appendTo(contentsEl);
        tabEl.click(function() {
          setItem('recentTab', tab.name);
          contentsEl.children().hide();
          contentEl.show();
          tabsEl.children().removeClass('active');
          tabEl.addClass('active');
        });
      });

      var recent = getItem('recentTab');
      var found = tabsEl.find('[tab="' + recent + '"]');
      if (recent && found.length) {
        found.click();
      } else {
        tabsEl.find('[tab]').first().click();
      }
    };

    //
    // Sample Menu
    //

    module.sampleLinks = [];
    module.sampleIframe = null;
    module.sampleTitle = null;
    module.onHashChanged = function() {
      var hash = location.hash;
      if (!hash) return;
      var link = module
        .sampleLinks
        .removeClass('active')
        .filter('[href="' + hash + '"]')
        .addClass('active');
      module
        .sampleIframe
        .fadeTo(200, 0, function() {
          $(this)
            .attr('src', hash.replace('#', '/samples/'))
            .delay(300)
            .fadeTo(200, 1);
        });
      module.sampleTitle
        .fadeTo(200, 0, function() {
          $(this)
            .text(link.attr('title') || link.text())
            .delay(300)
            .fadeTo(200, 1);
        });
    };
    module.openFirstSample = function() {
      location.hash = module.sampleLinks.first().attr('href')
    };
    module.openNextSample = function() {
      var links = module.sampleLinks;
      var link = links.filter('.active').first()
      if (!link.length) {
        module.openFirstSample();
        return;
      }

      link = $(links[links.index(link) + 1])
      if (!link.length) {
        module.openFirstSample();
        return;
      }
      location.hash = link.attr('href');
    };
    module.openPrevSample = function() {
      var links = module.sampleLinks;
      var link = links.filter('.active').first()
      if (!link.length) {
        module.openFirstSample();
        return;
      }

      link = $(links[links.index(link) - 1])
      if (!link.length) {
        module.openFirstSample();
        return;
      }
      location.hash = link.attr('href');
    };
    module.bootSampleMenu = function(options) {
      module.sampleLinks = $(options.links);
      module.sampleIframe = $(options.iframe);
      module.sampleTitle = $(options.title);
      window.addEventListener("hashchange", module.onHashChanged, false);
      if (location.hash) {
        module.onHashChanged();
      } else {
        module.openFirstSample();
      }
    }
}(GlibSamples));
