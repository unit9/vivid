import * as platform from 'platform';

class browser {
  static BREAKPOINTS = {
    sm: 480,
    md: 768,
    lg: 1025,
  };

  static isMobile() {
    return ['Android', 'iOS', 'Windows Phone'].indexOf(platform.os.family) > -1;
  }

  static isTablet() {
    return browser.isMobile() && Math.max(window.innerWidth, window.innerHeight) >= browser.BREAKPOINTS.md;
  }

  static getOs() {
    return platform.os.family.toLowerCase();
  }

  static getBrowser() {
    return platform.name.toLowerCase();
  }

  static isSocialBrowser() {
    const isFacebook = (platform.ua.indexOf('FBAN') > -1) || (platform.ua.indexOf('FBAV') > -1);
    const isTwitter = platform.ua.toLowerCase().indexOf('twitter') > -1;
    return isFacebook || isTwitter;
  }
}

export default browser;
