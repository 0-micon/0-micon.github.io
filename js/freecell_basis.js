function createFreecellBasis(pileNum, cellNum, baseNum) {
    const RANK_NUM = Cards.RANK_NUM;
    const SUIT_NUM = Cards.SUIT_NUM;
    const CARD_NUM = Cards.CARD_NUM;

    const PILE_NUM = pileNum; // cascades
    const CELL_NUM = cellNum; // open cells
    const BASE_NUM = baseNum; // foundation piles
    const DESK_SIZE = PILE_NUM + CELL_NUM + BASE_NUM;

    const PILE_START = 0;
    const PILE_END = PILE_START + PILE_NUM;

    const BASE_START = PILE_END;
    const BASE_END = BASE_START + BASE_NUM;

    const CELL_START = BASE_END;
    const CELL_END = CELL_START + CELL_NUM;

    function isPile(index) {
        return index >= PILE_START && index < PILE_END;
    }

    function isBase(index) {
        return index >= BASE_START && index < BASE_END;
    }

    function isCell(index) {
        return index >= CELL_START && index < CELL_END;
    }

    function isTableau(cardA, cardB) {
        return Cards.rank(cardA) == ((Cards.rank(cardB) + 1) % RANK_NUM)
            && (Cards.suit(cardA) & 1) != (Cards.suit(cardB) & 1);
    }

    function toMove(source, destination) {
        return source * DESK_SIZE + destination;
    }

    function toDestination(move) {
        return move % DESK_SIZE;
    }

    function toSource(move) {
        return (move - (move % DESK_SIZE)) / DESK_SIZE;
    }

    function solve(desk, callback, filter) {
        let srcMoves = [[]], dstMoves = [], tmp;
        const moves = [], done = {};

        done[desk.baseToString() + ':' + desk.pileToString()] = true;

        while (srcMoves.length > 0) {
            for (let i = 0, sl = srcMoves.length; i < sl; i++) {
                const path = srcMoves[i];
                desk.moveForward(path);

                moves.length = 0;
                desk.getMoves(moves, filter);

                for (let j = 0, ml = moves.length; j < ml; j++) {
                    const mov = moves[j];
                    const src = toSource(mov);
                    const dst = toDestination(mov);

                    desk.moveCard(src, dst);

                    // Check if we had it already.
                    const key = desk.baseToString() + ':' + desk.pileToString();
                    if (!done[key]) {
                        const next = path.slice();
                        next.push(mov);

                        if (callback(desk, next)) {
                            // Restore the desk and return.
                            desk.moveBackward(next);
                            return;
                        }

                        dstMoves.push(next);
                        done[key] = true;
                    }

                    desk.moveCard(dst, src);
                }
                desk.moveBackward(path);
            }
            // Swap source and destination:
            tmp = srcMoves;
            srcMoves = dstMoves;
            dstMoves = tmp;
            dstMoves.length = 0;
        }
    }

    function createDesk() {
        const desk = new Array(DESK_SIZE);
        for (let i = 0; i < DESK_SIZE; i++) {
            desk[i] = [];
        }

        function clear() {
            for (let i = 0; i < DESK_SIZE; i++) {
                desk[i].length = 0;
            }
        }

        // A negative index can be used, indicating an offset from the end of the sequence.
        function cardAt(line, index) {
            if (index < 0) {
                index = desk[line].length + index;
            }
            return desk[line][index];
        }

        function numberOfCardsAt(line) {
            return desk[line].length;
        }

        // Copy other desk into itself.
        function from(other) {
            clear();
            for (let i = 0; i < DESK_SIZE; i++) {
                const line = desk[i];
                const count = other.numberOfCardsAt(i);
                for (let j = 0; j < count; j++) {
                    line.push(other.cardAt(i, j));
                }
            }
        }

        function forEachLocus(callback) {
            for (let i = 0; i < DESK_SIZE; i++) {
                const line = desk[i];
                const length = line.length;
                // Call callback. Break out of the loop if it returns true.
                if (callback(i, length > 0 ? line[length - 1] : -1)) {
                    break;
                }
            }
        }

        function getMoves(moves, filter) {
            for (let i = 0; i < DESK_SIZE; i++) {
                const src = desk[i];
                if (src.length > 0) {
                    const srcCard = src[src.length - 1];


                    if (filter && !filter(srcCard)) {
                        continue; // Only special cards can be moved.
                    }

                    const srcSuit = Cards.suit(srcCard);
                    const srcRank = Cards.rank(srcCard);
                    for (let j = 0; j < DESK_SIZE; j++) {
                        if (i != j) {
                            const dst = desk[j];
                            const dstCard = dst[dst.length - 1];
                            if (isPile(j)) {
                                if (dst.length == 0) {
                                    // 1. Can move to an empty space.
                                    moves.push(toMove(i, j));
                                } else {
                                    // 2. Can move to a tableau. It should be built down in alternating colors.
                                    if (isTableau(dstCard, srcCard)) {
                                        moves.push(toMove(i, j));
                                    }
                                }
                            } else if (isBase(j)) {
                                if (j - BASE_START == srcSuit && dst.length == srcRank) {
                                    // 3. Can move to the foundation.
                                    moves.push(toMove(i, j));
                                }
                            } else if (isCell(j)) {
                                if (dst.length == 0) {
                                    // 4. Can move to an empty cell.
                                    moves.push(toMove(i, j));
                                }
                            }
                        }
                    }
                }
            }
        }

        function deal(number) {
            clear();
            const cards = Cards.deck(number);

            for (let i = 0; i < cards.length; i++) {
                desk[PILE_START + (i % PILE_NUM)].push(cards[i]);
            }
            return cards;
        }

        function moveCard(source, destination) {
            desk[destination].push(desk[source].pop());
        }

        function moveForward(moves) {
            for (let i = 0, j = moves.length; i < j; i++) {
                moveCard(toSource(moves[i]), toDestination(moves[i]));
            }
        }

        function moveBackward(moves) {
            for (let i = moves.length; i-- > 0;) {
                moveCard(toDestination(moves[i]), toSource(moves[i]));
            }
        }

        function tableauAt(lineIndex) {
            const tableau = [];
            const line = desk[lineIndex];

            let j = line.length;
            if (j > 0) {
                tableau.push(line[j - 1]);
                while (--j > 0 && isTableau(line[j - 1], line[j])) {
                    tableau.push(line[j - 1]);
                }
            }
            tableau.reverse();
            return tableau;
        }

        function slice(line) {
            return desk[line].slice();
        }

        function baseToString() {
            let buf = '';
            let prefix = ',';
            for (let i = BASE_START; i < BASE_END; i++) {
                buf += prefix + desk[i].length;
                prefix = ',';
            }
            return buf;
        }

        function pileToString() {
            let arr = [];
            for (let i = PILE_START; i < PILE_END; i++) {
                arr.push(desk[i].join(','));
            }
            arr.sort();
            return arr.join(';');
        }

        function countEqualsBackward(lineIndex, cards) {
            const line = desk[lineIndex];
            const lA = line.length, lB = cards.length;
            const lMin = lA < lB ? lA : lB;
            let i = 0;
            while (i < lMin && line[lA - i - 1] == cards[lB - i - 1]) {
                i++;
            }
            return i;
        }

        function buildTableauFrom(card) {
            const tableau = [];
            tableau.push(card);
            for (let i = PILE_START; i < PILE_END; i++) {
                const pile = desk[i];
                let j = pile.indexOf(card);
                if (j >= 0) {
                    while (++j < pile.length && isTableau(card, pile[j])) {
                        card = pile[j];
                        tableau.push(card);
                    }
                    break;
                }
            }
            return tableau;
        }

        function tableauLengthAt(pile) {
            const cascade = desk[pile];
            const length = cascade.length;
            for (let i = length; i-- > 1;) {
                const c1 = cascade[i];
                const s1 = c1 % SUIT_NUM;
                const r1 = (c1 - s1) / SUIT_NUM;

                const c2 = cascade[i - 1];
                const s2 = c2 % SUIT_NUM;
                const r2 = (c2 - s2) / SUIT_NUM;

                if (!(r2 == ((r1 + 1) % RANK_NUM) && (s2 & 1) != (s1 & 1))) {
                    return length - i;
                }
            }

            return length;
        }

        // Desk public interface:
        return {
            // Constants:
            length: desk.length,

            // Methods:
            cardAt: cardAt,
            baseToString: baseToString,
            buildTableauFrom: buildTableauFrom,
            countEqualsBackward: countEqualsBackward,
            deal: deal,
            forEachLocus: forEachLocus,
            from: from,
            getMoves: getMoves,
            moveBackward: moveBackward,
            moveCard: moveCard,
            moveForward: moveForward,
            numberOfCardsAt: numberOfCardsAt,
            pileToString: pileToString,
            slice: slice,
            tableauAt: tableauAt,
            tableauLengthAt: tableauLengthAt
        };
    }

    return {
        // Constants:
        RANK_NUM: RANK_NUM,
        SUIT_NUM: SUIT_NUM,
        CARD_NUM: CARD_NUM,

        PILE_NUM: PILE_NUM,
        CELL_NUM: CELL_NUM,
        BASE_NUM: BASE_NUM,
        DESK_SIZE: DESK_SIZE,

        PILE_START: PILE_START,
        PILE_END: PILE_END,

        BASE_START: BASE_START,
        BASE_END: BASE_END,

        CELL_START: CELL_START,
        CELL_END: CELL_END,

        // Methods:
        isBase: isBase,
        isCell: isCell,
        isPile: isPile,
        isTableau: isTableau,

        solve: solve,

        toMove: toMove,
        toDestination: toDestination,
        toSource: toSource,

        createDesk: createDesk
    };
}
