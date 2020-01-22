
type FreecellBasis = Readonly<{
  // Constants:
  RANK_NUM: number;
  SUIT_NUM: number;
  CARD_NUM: number;

  PILE_NUM: number;
  CELL_NUM: number;
  BASE_NUM: number;
  DESK_SIZE: number;

  PILE_START: number;
  PILE_END: number;

  BASE_START: number;
  BASE_END: number;

  CELL_START: number;
  CELL_END: number;

  // Methods:
  isBase: (index: number) => boolean;
  isCell: (index: number) => boolean;
  isPile: (index: number) => boolean;
}>;

function createFreecellLayout(basis: FreecellBasis, dx = 1, dy = 1, cx = 2, cy = 2) {
  return {
    get itemWidth() {
      return cx;
    },
    get itemHeight() {
      return cy;
    },
    get deltaWidth() {
      return dx;
    },
    get deltaHeight() {
      return dy;
    },
    // Cells:
    get cellStartX(): number {
      return dx;
    },
    get cellEndX(): number {
      return this.cellStartX + basis.CELL_NUM * (cx + dx);
    },
    get cellStartY(): number {
      return dy;
    },
    get cellEndY(): number {
      return this.cellStartY + cy;
    },
    // Bases:
    get baseStartX(): number {
      return this.cellEndX;
    },
    get baseEndX(): number {
      return this.baseStartX + basis.BASE_NUM * (cx + dx);
    },
    get baseStartY(): number {
      return this.cellStartY;
    },
    get baseEndY(): number {
      return this.cellEndY;
    },
    // Piles
    get pileStartX(): number {
      return dx;
    },
    get pileEndX(): number {
      return this.pileStartX + basis.PILE_NUM * (cx + dx);
    },
    get pileStartY(): number {
      return this.cellEndY + dy;
    },
    get pileEndY(): number {
      return this.pileStartY + 5 * cy;
    },
    // Total:
    get width(): number {
      return Math.max(this.baseEndX, this.cellEndX, this.pileEndX);
    },
    get height(): number {
      return Math.max(this.baseEndY, this.cellEndY, this.pileEndY) + dy;
    }
  };
}
