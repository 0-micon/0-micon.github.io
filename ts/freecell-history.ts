class FreecellHistory {
  moves: { source: number, destination: number }[] = [];

  // Marks the current position
  mark: number = 0;

  get length() {
    return this.moves.length;
  }

  get available() {
    return this.moves.length - this.mark;
  }

  clear() {
    this.moves.length = 0;
    this.mark = 0;
  }

  move(source: number, destination: number) {
    const moves = this.moves;
    const mark = this.mark;
    if (moves.length > mark && moves[mark].source === source && moves[mark].destination === destination) {
      this.mark += 1; // skip forward
    } else if (mark > 0 && moves[mark - 1].source === destination && moves[mark - 1].destination === source) {
      this.mark -= 1; // skip backward
    } else {
      if (mark < moves.length) {
        moves.splice(mark); // drop out old moves
      }
        
      moves.push({ source, destination });
      this.mark = moves.length; // append
    }
  }

  toNumberArray(): number[] {
    return this.moves.reduce((a, v) => {
      a.push(v.source);
      a.push(v.destination);
      return a;
    }, [] as number[]);
  }
}
