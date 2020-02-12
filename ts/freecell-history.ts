class FreecellHistory {
  moves: number[] = [];
  mark: number = 0;

  clear() {
    this.moves.length = 0;
    this.mark = 0;
  }

  move(source: number, destination: number) {
    const moves = this.moves;
    const mark = this.mark;
    if (moves.length - mark >= 2 && moves[mark] === source && moves[mark + 1] === destination) {
      this.mark += 2; // skip forward
    } else if (mark >= 2 && moves[mark - 1] === source && moves[mark - 2] === destination) {
      this.mark -= 2; // skip backward
    } else {
      if (mark < moves.length) {
        moves.splice(mark); // drop out old moves
      }
        
      moves.push(source);
      moves.push(destination);
      this.mark = moves.length; // append
    }
  }
}
