class analytics {

  static tag(category, action) {
    // console.log('analytics.tag', category, action);
    if (!ga) {
      return;
    }
    ga('send', 'event', category, action);
  }
}

export default analytics;
