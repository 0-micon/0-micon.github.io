
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
  const cellStartX = dx;
  const cellEndX = cellStartX + basis.CELL_NUM * (cx + dx);

  const cellStartY = dy;
  const cellEndY = cellStartY + cy;

  const baseStartX = cellEndX;
  const baseEndX = baseStartX + basis.BASE_NUM * (cx + dx);

  const baseStartY = cellStartY;
  const baseEndY = cellEndY;

  const pileStartX = dx;
  const pileEndX = pileStartX + basis.PILE_NUM * (cx + dx);
  const pileStartY = cellEndY + dy;
  const pileEndY = pileStartY + 5 * cy;

  const width = Math.max(baseEndX, cellEndX, pileEndX);
  const height = Math.max(baseEndY, cellEndY, pileEndY) + dy;

  function linearTransition(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio;
  }

  return {
    itemWidth: cx,
    itemHeight: cy,
    deltaWidth: dx,
    deltaHeight: dy,
    // Cells:
    cellStartX,
    cellEndX,
    cellStartY,
    cellEndY,
    getCellX(index: number): number {
      return linearTransition(this.cellStartX, this.cellEndX, index / basis.CELL_NUM);
    },
    getCellY(_index: number): number {
      return this.cellStartY;
    },
    // Bases:
    baseStartX,
    baseEndX,
    baseStartY,
    baseEndY,
    getBaseX(index: number): number {
      return linearTransition(this.baseStartX, this.baseEndX, index / basis.BASE_NUM);
    },
    getBaseY(_index: number): number {
      return this.baseStartY;
    },
    // Piles
    pileStartX,
    pileEndX,
    pileStartY,
    pileEndY,
    getPileX(index: number): number {
      return linearTransition(this.pileStartX, this.pileEndX, index / basis.PILE_NUM);
    },
    getPileY(_index: number): number {
      return this.pileStartY;
    },
    // Cards
    getCardX(spotIndex: number, cardIndex: number, cardCount: number): number {
      if (basis.isCell(spotIndex)) {
        return this.getCellX(spotIndex);
      }
      if (basis.isBase(spotIndex)) {
        return this.getBaseX(spotIndex);
      }
      if (basis.isPile(spotIndex)) {
        return this.getPileX(spotIndex);
      }
      return 0;
    },
    getCardY(spotIndex: number, cardIndex: number, cardCount: number): number {
      if (basis.isCell(spotIndex)) {
        return this.getCellY(spotIndex);
      }
      if (basis.isBase(spotIndex)) {
        return this.getBaseY(spotIndex);
      }
      if (basis.isPile(spotIndex)) {
        const y = this.getPileY(spotIndex);
        const h = this.pileEndY - this.pileStartY;
        if (cardCount > 0) {
          const dh = Math.min(h / cardCount, dy);
          return linearTransition(y, y + dh * cardCount, cardIndex / cardCount);
        }
        return y;
      }
      return 0;
    },
    // Total Size:
    width, height
  };
}
