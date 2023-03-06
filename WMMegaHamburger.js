/* =========
  Full Screen Menu 
  A Simple Full Screen Menu For Squarespace
  This Code is Licensed by Will-Myers.com
========== */
(function () {
  const utils = {
    emitEvent: function (type, detail = {}, elem = document) {
      if (!type) return;
      let event = new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        detail: detail,
      });
      return elem.dispatchEvent(event);
    },
    async getHTML(url, selector = null) {
      try {
        let response = await fetch(`${url}`),
            selector = utils.templateVersion == '7' ? 'main > *:first-child' : '#sections' ;

        // If the call failed, throw an error
        if (!response.ok) {
          throw `Something went wrong with ${url}`;
        }

        let data = await response.text(),
            frag = document.createRange().createContextualFragment(data),
            section = frag.querySelector(selector).innerHTML;

        if (selector) section = frag.querySelector(selector).innerHTML;

        return section;

      } catch (error) {
        return `<div class="load-plugin wm-alert"><p>Hey there, it looks like the url you are using, <code>${url}</code>, doesn't exist. Check the URL in the code block. And don't worry, this note is only showing in the Squarespace Editor, not on the live site.</p><p>If you continue to have issues, reach out to our team here: <a>https://will-myers.com/ask</a></p></div>`
        console.error(error);
      }
    },
    getPropertyValue: function (el, prop) {
      let propValue = window.getComputedStyle(el).getPropertyValue(prop),
          cleanedValue = propValue.trim().toLowerCase(),
          value = cleanedValue;

      /*If First & Last Chars are Quotes, Remove*/
      if (cleanedValue.charAt(0).includes('"') || cleanedValue.charAt(0).includes("'")) value = value.substring(1);
      if (cleanedValue.charAt(cleanedValue.length-1).includes('"') || cleanedValue.charAt(cleanedValue.length-1).includes("'")) value = value.slice(0, -1);;

      if (value == 'true') value = true;
      if (value == 'false') value = false;
      return value;
    },
    templateVersion: Static.SQUARESPACE_CONTEXT.templateVersion,
    loadScripts: []
  };
  
  function loadScripts() {
    if (!utils.loadScripts.length) return;
    let hasLoaded = [];
    for (let el of utils.loadScripts){
      if (hasLoaded.includes(el.src) || hasLoaded.includes(el.innerHTML)) continue;
      const script = document.createElement('script');
      script.src = el.src;
      script.async = el.async;

      script.onload = () => {
        //console.log(`${el.src} loaded successfuly`);
      };

      script.onerror = () => {
        //console.log(`Error occurred while loading ${el.src}`);
      };

      if (el.innerHTML) {
        eval(el.innerHTML);
        hasLoaded.push(el.innerHTML)
      } else {
        document.body.appendChild(script);
        hasLoaded.push(el.src)
      }
    }
  }

  let LoadMenu = (function () {    
    function loadSquarespaceContent(instance){
      let container = instance.elements.rootFolder;
      window.Squarespace?.initializeLayoutBlocks(Y, Y.one(container));
      window.Squarespace?.initializeNativeVideo(Y, Y.one(container));
    }

    function pushScripts(instance){
      let allow = utils.getPropertyValue(instance.elements.rootFolder, '--load-scripts'),
          scripts = instance.elements.scripts;

      if (allow === 'false' || allow === false) return;
      if (!scripts.length) return;
      scripts.forEach(el => utils.loadScripts.push(el))
    }
    
    function pushSqsSpecificScripts(instance) {
      /*Like Background Videos*/
      let hasBkgVideos = instance.elements.bkgVideos;
      
      /*If Background Video*/
      if (hasBkgVideos.length) {
        let sqsLoaderScript = document.querySelector('body > [src*="https://static1.squarespace.com/static/vta"]');
        utils.loadScripts.push(sqsLoaderScript)
      }
    }
    
    function toggleMenu(instance){
      let burger = instance.elements.burger;
      burger.click();
    }
    
    function addClickEventToClose(instance) {
      document.addEventListener('click', function(e){
        if (!instance.settings.isOpen) return;
        if (e.target.closest('#header')) return;
        toggleMenu(instance)
      })
    }
    
    function matchColorScheme(instance){
      let header = instance.elements.header,
          colorTheme = instance.settings.colorTheme,
          defaultColorTheme = instance.settings.defaultColorTheme;
      
      header.classList.remove(defaultColorTheme)
      header.classList.add(colorTheme)
    }
    
    function unMatchColorScheme(instance) {
      let header = instance.elements.header,
          colorTheme = instance.settings.colorTheme,
          defaultColorTheme = instance.settings.defaultColorTheme;

      header.classList.add(defaultColorTheme)
      header.classList.remove(colorTheme)
    }

    function menuOpened(instance) {
      if (instance.settings.colorMatch){
        matchColorScheme(instance)
      }
    }

    function menuClosed(instance) {
      if (instance.settings.colorMatch){
        unMatchColorScheme(instance)      
      }
    }

    function menuToggleEventListener(instance) {
      let body = document.body;

      const observer = new MutationObserver((el) => {
        let isOpen = !!body.classList.contains('header--menu-open')
        if (isOpen) {
          menuOpened(instance)
        } else {
          menuClosed(instance);
        }
      });

      observer.observe(body, { 
        attributes: true, 
        attributeFilter: ['class'] });
    }

    function imageLoader(instance) {
      //if (!document.body.classList.contains('sqs-edit-mode')) return;
      let bkgImages = instance.elements.bkgImages;
      bkgImages.forEach(el => {
        el.classList.add('wm-image-loaded')
        let fData = el.dataset.imageFocalPoint.split(',');
        let focalPoint = {};
        focalPoint.x = (parseFloat(fData[0]) * 100) + '%';
        focalPoint.y = (parseFloat(fData[1]) * 100) + '%';
        el.style.setProperty('--x', focalPoint.x);
        el.style.setProperty('--y', focalPoint.y);     
        el.dataset.load = true;
        el.src = el.dataset.src
      })
    }

    async function buildHTML(instance) {
      let rootFolder = instance.elements.rootFolder,
          url = instance.settings.desktopUrl,
          html = '';
     
      if (window.location.pathname == url && window.top !== window.self) {
        html = `<p>You're currently on the menu page!</p>`;
      } else {
        html = await utils.getHTML(url);
      }
      instance.elements.header.classList.add('wm-mega-hamburger')
      rootFolder.innerHTML = `<div class="site-wrapper">${html}</div>`
      
      window.dispatchEvent(new Event('megaHamburger:loaded'));
    }

    function Constructor() {
      let instance = this;
      let el = document.querySelector('.wm-mega-hamburger');
      instance.settings = {
        get isOpen() {
          return document.body.classList.contains('header--menu-open');
        },
        get desktopUrl() {
          let url = utils.getPropertyValue(el, '--url');
          return url;
        },
        get colorMatch() {
          let shouldMatch = utils.getPropertyValue(el, '--color-match');
          shouldMatch  = shouldMatch === false ? false : true;
          return shouldMatch
        },
        get colorTheme() {
          return instance.elements.firstSectionColorTheme;
        },
        get hasBkgVideos() {
          return !!instance.elements.bkgVideos.length;
        },
        get defaultColorTheme() {
          let hcl = instance.elements.header.classList,
              theme = '';
          if (hcl.contains('white')) {
            theme = 'white'
          } else if (hcl.contains('white-bold')) {
            theme = 'white-bold'
          } else if (hcl.contains('light')) {
            theme = 'light'
          } else if (hcl.contains('light-bold')) {
            theme = 'light-bold'
          } else if (hcl.contains('bright-inverse')) {
            theme = 'bright-inverse'
          } else if (hcl.contains('bright')) {
            theme = 'bright'
          } else if (hcl.contains('dark')) {
            theme = 'dark'
          } else if (hcl.contains('dark-bold')) {
            theme = 'dark-bold'
          } else if (hcl.contains('black')) {
            theme = 'black'
          } else if (hcl.contains('black-bold')) {
            theme = 'black-bold'
          } else {
            theme = 'white'
          }
          return theme
        },
      };
      instance.elements = {
        body: document.body,
        get header() {
          return document.querySelector('#header')
        },
        get burger(){
          return document.querySelector('.header-burger > button');
        },
        get rootFolder() {
          return this.header.querySelector('[data-folder="root"]');
        },
        get firstSectionColorTheme() {
          return this.rootFolder.querySelector('.page-section').dataset.sectionTheme || 'white';
        },
        get scripts() {
          return this.rootFolder.querySelectorAll('script');
        },
        get bkgVideos() {
          return this.rootFolder.querySelectorAll('.section-background .sqs-video-background-native');
        },
        get bkgImages() {
          return this.rootFolder.querySelectorAll('.section-background > img:not(.wm-image-loaded)');
        }
      };

      instance.elements.body.classList.add('wm-mega-hamburger')
      window.addEventListener('megaHamburger:loaded', function(){
        menuToggleEventListener(instance);
        loadSquarespaceContent(instance);
        pushScripts(instance);
        pushSqsSpecificScripts(instance);
        loadScripts();
        imageLoader(instance);
        addClickEventToClose(instance)
      });
      buildHTML(instance);
    }

    return Constructor;
  }());

  let initContentLoads = () => {
    document.body.insertAdjacentHTML('beforeend', `<span class="wm-mega-hamburger" style"display:none;"></span>`);
    let span = document.querySelector('.wm-mega-hamburger');
    let url = utils.getPropertyValue(span, '--url');
    if (url) {
      new LoadMenu();
    }

  }
  initContentLoads();
  window.addEventListener('mercury:load', initContentLoads)
  window.wmInitContentLoad = initContentLoads;
}());