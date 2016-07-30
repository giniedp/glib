var GlibSamples = GlibSamples || {}; 
(function(module) {
  'use strict';
  
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
    function removeIndents(string) {
      var lines = string.split("\n");
      var min = null;
      for (var i = 0; i<lines.length; i++){
        var line = lines[i];
        if (i == 0) {
          // hack
          line = '    ' + line;
          lines[i] = line;
        }

        if (!line) continue;
        var match = line.match(/^(\s+)/)
        if (!match) return string;
        if (min == null) min = match[1].length; 
        min = Math.min(min, match[1].length);
      }
      for (var i = 0; i<lines.length; i++){
        var line = lines[i];
        if (!line) continue;
        lines[i] = line.substring(min);
      }
      return lines.join("\n").trim();
    }

    function makeSnippet(html, language) {
      var preEl = $('<pre>');
      var codeEl = $('<code>').appendTo(preEl).text(removeIndents(html)).addClass('language-' + language);
      Prism.highlightElement(codeEl[0]);
      return preEl;
    }

    module.bootSample = function(options) {
      var view = $(options.view);
      var code = $(options.code);
      var source = $(options.source);

      var tabs = [{
        name: 'HTML',
        content: $('<div>').addClass('tab-content').append(makeSnippet(view[0].outerHTML, 'html'))
      }];
      var tab = tabs[0];

      source.children().each(function() {
        var $this = $(this);
        if ($this.is('a[name]')) {
          tabs.push({
            name: $this.attr('name'),
            content: $('<div>').addClass('tab-content')
          });
          tab = tabs[tabs.length-1];
        } else if ($this.is('script')) {
          makeSnippet($this[0].outerHTML, 'html').appendTo(tab.content);
        } else {
          $this.detach().appendTo(tab.content);
        } 
      });

      var tabsEl = $('<div>').addClass('sample-tabs').appendTo(code);
      var contentsEl = $('<div>').addClass('sample-contents').appendTo(code);

      tabs.forEach(function(tab) {
        var tabEl = $('<a>').text(tab.name).appendTo(tabsEl);
        var contentEl = tab.content.appendTo(contentsEl);
        tabEl.click(function() {
          contentsEl.children().hide();
          contentEl.show();
          tabsEl.children().removeClass('active');
          tabEl.addClass('active');
        });
      });
      tabsEl.children().first().click();
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
      location.hash = links.first().attr('href')
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
