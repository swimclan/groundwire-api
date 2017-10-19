class Iterator {
  constructor() {
    this.iterator;
  }
  
  setIterator(callback, interval) {
    return this.iterator = setInterval(callback, interval);
  }

  killIterator() {
    return clearInterval(this.iterator);
  }
}

module.exports = Iterator;