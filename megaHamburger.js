/* =========
  Mega Hamburger
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
        return `<div class="load-error wm-alert">
          <p>
            Hey there, it looks like the url you are using, <code>${url}</code>, doesn't exist. Check the URL in your <em>Design » Custom CSS</em> area. And don't worry, this note is only showing in the Squarespace Editor, not on the live site.
          </p>
          <p>
            If you continue to have issues, reach out to our team here: <a>https://will-myers.com/ask</a>
          </p>
        </div>
        <style>
        body:not(.sqs-edit-mode) .load-error{
          display:none;
        }
        .load-error {
          max-width: var(--sqs-site-max-width);
          margin:auto;
          padding: 0 var(--sqs-site-gutter);
        }
        @media(max-width:767px){
          .load-error {
            max-width: var(--sqs-site-max-width);
            margin:auto;
            padding: 0 var(--sqs-mobile-site-gutter);
          }
        }
        </style>`
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
      if (hasLoaded.includes(el.src) || hasLoaded.includes(el.innerHTML) || el.type == 'application/json') continue;
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
        try {
          eval(el.innerHTML);
        } catch(err) {
          console.log('error: ', err)
          console.log('error loading: ', el)
        }
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
      window.Squarespace?.initializePageContent(Y, Y.one(container))

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
      let hasBkgVideos = instance.settings.hasBkgVideos;
      let hasGallerySections = instance.settings.hasGallerySections;
      let hasListSections = instance.settings.hasListSections;
      
      /*If Background Video*/
      if (hasBkgVideos || hasGallerySections || hasListSections) {
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

      header.classList.remove(colorTheme)
      header.classList.add(defaultColorTheme)
    }

    function maintainHeaderHeight(instance) {
      let header = instance.elements.header;
      let height = '';

      function setHeight() {
        height = header.getBoundingClientRect().height + 'px';
        header.style.setProperty('--wm-header-height', height);
      }

      setHeight();
      header.addEventListener('transitionend', setHeight);
      document.addEventListener('resize', setHeight)
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

    function setHamburgerWidth(instance){
      let hamburger = document.querySelector('.header-burger');
      let width = hamburger.offsetWidth + 'px';
      instance.elements.header.style.setProperty('--hamburger-width', width);
    }

    async function buildHTML(instance) {
      let rootFolder = instance.elements.rootFolder,
        url = instance.settings.desktopUrl,
        mobileUrl = instance.settings.mobileUrl,
        html = '',
        mobileHTML = '',
        onPage = (window.location.pathname == mobileUrl || window.location.pathname == url) && window.top !== window.self;
      
      if (onPage) {
        html = `<p class="load-error wm-alert">
          You're currently on the menu page! The menu won't display here.
        </p>
        <style>
        body:not(.sqs-edit-mode) .load-error{
          display:none;
        }
        .load-error {
          max-width: var(--sqs-site-max-width);
          margin:auto;
          padding: 0 var(--sqs-site-gutter);
        }
        @media(max-width:767px){
          .load-error {
            max-width: var(--sqs-site-max-width);
            margin:auto;
            padding: 0 var(--sqs-mobile-site-gutter);
          }
        }
        </style>`;
      } else {
        html = await utils.getHTML(url);
        if (mobileUrl)  {
          mobileHTML = await utils.getHTML(mobileUrl);
        }
      }
      let innerHTML = `<div class="site-wrapper">
        <div class="desktop-menu">${html}</div>
      </div>`;
      if (mobileHTML) {
        innerHTML = `<div class="site-wrapper has-mobile">
        <div class="desktop">${html}</div>
        <div class="mobile">${mobileHTML}</div>
      </div>`;
        instance.settings.hasMobile = true;
      }
      
      
      instance.elements.header.classList.add('wm-mega-hamburger')
      rootFolder.insertAdjacentHTML('beforeend', innerHTML)
      
      window.dispatchEvent(new Event('megaHamburger:loaded'));
    }

    function addMissingColorTheme() {
      const themes = ['.white', '.white-bold', '.light', '.light-bold', '.bright', '.bright-inverse', '.dark', '.dark-bold', '.black', '.black-bold'];
      const styleElement = document.getElementById('colorThemeStyles');
      let styleContent = styleElement.innerHTML;
  
      // Find which theme is missing
      let missingTheme = themes.find(theme => {
          // Use a regular expression to check for the exact class name
          const themeRegex = new RegExp(theme + '\\s*\\{', 'g');
          return !styleContent.match(themeRegex);
      });
  
      if (missingTheme) {
          // Extract the second :root rule
          const rootRuleRegex = /:root\s*\{[^\}]*\}/g;
          let rootRuleMatches = styleContent.match(rootRuleRegex);
          let secondRootRule = rootRuleMatches && rootRuleMatches[1];
  
          if (secondRootRule) {
              // Replace :root with the missing theme class
              secondRootRule = secondRootRule.replace(':root', missingTheme);
  
              // Create a new style element
              const newStyleElement = document.createElement('style');
              newStyleElement.appendChild(document.createTextNode(secondRootRule));
  
              // Insert the new style element after the original style element
              styleElement.parentNode.insertBefore(newStyleElement, styleElement.nextSibling);
            } else {
              console.error('Second :root rule not found');
          }
      } else {
          console.log('No theme is missing');
      }
    }


    function Constructor(url) {
      let instance = this;
      let el = document.querySelector('.wm-mega-hamburger');
      instance.settings = {
        hasMobile: false,
        get isOpen() {
          return document.body.classList.contains('header--menu-open');
        },
        get desktopUrl() {
          //let url = utils.getPropertyValue(el, '--url');
          return url;
        },
        get mobileUrl() {
          let prefix = '';
          let url = utils.getPropertyValue(el, '--mobile-url');
          if (url.charAt(0) !== "/") url = '/' + url;
          return url;
        },
        get colorMatch() {
          let shouldMatch = utils.getPropertyValue(el, '--color-match');
          shouldMatch = shouldMatch === false ? false : true;
          return shouldMatch
        },
        get colorTheme() {
          return instance.elements.firstSectionColorTheme;
        },
        get hasBkgVideos() {
          return !!instance.elements.bkgVideos.length;
        },
        get hasListSections() {
          return !!instance.elements.listSection.length;
        },
        get hasGallerySections() {
          return !!instance.elements.gallerySection.length;
        },
        defaultColorTheme: '',
        setColorTheme: function() {
          let hcl = instance.elements.header.classList;
          if (hcl.contains('white')) {
            this.defaultColorTheme = 'white'
          } else if (hcl.contains('white-bold')) {
            this.defaultColorTheme = 'white-bold'
          } else if (hcl.contains('light')) {
            this.defaultColorTheme = 'light'
          } else if (hcl.contains('light-bold')) {
            this.defaultColorTheme = 'light-bold'
          } else if (hcl.contains('bright-inverse')) {
            this.defaultColorTheme = 'bright-inverse'
          } else if (hcl.contains('bright')) {
            this.defaultColorTheme = 'bright'
          } else if (hcl.contains('dark')) {
            this.defaultColorTheme = 'dark'
          } else if (hcl.contains('dark-bold')) {
            this.defaultColorTheme = 'dark-bold'
          } else if (hcl.contains('black')) {
            this.defaultColorTheme = 'black'
          } else if (hcl.contains('black-bold')) {
            this.defaultColorTheme = 'black-bold'
          } else {
            this.defaultColorTheme = 'white'
          }
        }
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
          if (instance.settings.hasMobile && window.innerWidth < 767) {
            return this.rootFolder.querySelector('.mobile .page-section').dataset.sectionTheme || 'white';
          }
          return this.rootFolder.querySelector('.page-section').dataset.sectionTheme || 'white';
        },
        get scripts() {
          return this.rootFolder.querySelectorAll('script');
        },
        get bkgVideos() {
          return this.rootFolder.querySelectorAll('.section-background .sqs-video-background-native');
        },
        get listSection() {
          return this.rootFolder.querySelectorAll('.page-section.user-items-list-section');
        },
        get gallerySection() {
          return this.rootFolder.querySelectorAll('.page-section.gallery-section');
        },
        get bkgImages() {
          return this.rootFolder.querySelectorAll('.section-background > img:not(.wm-image-loaded)');
        }
      };
      
      instance.settings.setColorTheme();
      instance.elements.body.classList.add('wm-mega-hamburger')
      window.addEventListener('megaHamburger:loaded', function(){
        menuToggleEventListener(instance);
        loadSquarespaceContent(instance);
        pushScripts(instance);
        pushSqsSpecificScripts(instance);
        loadScripts();
        imageLoader(instance);
        addClickEventToClose(instance)
        addMissingColorTheme()
      });
      maintainHeaderHeight(instance);
      buildHTML(instance);
      setHamburgerWidth(instance);
    }

    return Constructor;
  }());

  let initContentLoads = () => {
    document.body.insertAdjacentHTML('beforeend', `<span class="wm-mega-hamburger" style"display:none;"></span>`);
    let span = document.querySelector('.wm-mega-hamburger');
    let url = utils.getPropertyValue(span, '--url');
    if (!url || url === 'none') return;
    if (url.charAt(0) !== "/") url = '/' + url;
    new LoadMenu(url);
  }
  initContentLoads();
  window.addEventListener('mercury:load', initContentLoads)
  window.wmInitContentLoad = initContentLoads;
}());
