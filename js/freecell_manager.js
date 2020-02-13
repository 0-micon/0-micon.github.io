function createFreecellManager(pileNum, cellNum, baseNum) {
    const basis = createFreecellBasis(pileNum, cellNum, baseNum);
    const desk = basis.createDesk();
    const back = basis.createDesk();

    const moves = [];
    const queue = new EventQueue();

    function getMoves() {
        moves.length = 0;
        desk.getMoves(moves);
    }

    function isMoveValid(source, destination) {
        return moves.indexOf(basis.toMove(source, destination)) >= 0;
    }

    function forEachMove(callback) {
        for (let i = 0; i < moves.length; i++) {
            const m = moves[i];
            // Call callback. Break out of the loop if it returns true.
            if (callback(basis.toSource(m), basis.toDestination(m))) {
                break;
            }
        }
    }

    function addOnDealListener(callback) {
        return queue.addEventListener('deal', callback);
    }

    function removeOnDealListener(id) {
        return queue.removeEventListener('deal', id);
    }

    function addOnMoveListener(callback) {
        return queue.addEventListener('move', callback);
    }

    function removeOnMoveListener(id) {
        return queue.removeEventListener('move', id);
    }

    function deal(n) {
        const cards = desk.deal(n);
        getMoves();
        
        const event = {
            name: 'deal',
            deck: cards,
            deal: n
        };
        queue.notifyAll(event);

        return cards;
    }

    function moveCard(source, destination) {
        desk.moveCard(source, destination);
        getMoves();

        const event = {
            name: 'move',
            card: desk.cardAt(destination, -1),
            source: source,
            destination: destination
        };
        queue.notifyAll(event);
    }

    function toResult(destination) {
        return { count: (destination >= 0 ? 1 : 0), destination: destination };
    }

    function getTableauDestination(srcIndex) {
        let destination = -1;
        let num = 0;
        for (let i = basis.PILE_START; i < basis.PILE_END; i++) {
            const cardNum = desk.numberOfCardsAt(i);
            if (cardNum != 0 && desk.canFormTableau(i, srcIndex)) {
                if (cardNum > num) {
                    num = cardNum;
                    destination = i;
                }
            }
        }
        return destination;
    }

    function getCellCardDestination(srcIndex) {
        let destination = getTableauDestination(srcIndex);
        if (destination < 0) {
            destination = desk.getEmptyPile();
        }
        return toResult(destination);
    }

    function getBaseCardDestination(srcIndex) {
        let destination = getTableauDestination(srcIndex);
        if (destination < 0) {
            destination = desk.getEmptyCell();
        }
        if (destination < 0) {
            destination = desk.getEmptyPile();
        }

        return toResult(destination);
    }

    function getPileCardDestination(srcIndex) {
        let destination = getTableauDestination(srcIndex);
        if (destination < 0) {
            destination = desk.getEmptyCell();
        }
        if (destination < 0) {
            destination = desk.getEmptyPile();
        }

        return toResult(destination);
    }

    function getPath(tableau, from, to) {
        const result = { count: 0, destination: -1 };

        const lastCard = desk.cardAt(from, -1);
        const isDestinationEmpty = (desk.numberOfCardsAt(to) === 0);

        const cardFilter = basis.createCardFilter(tableau);
        const destinationFilter = basis.createPileFilter(function (index) {
            return isDestinationEmpty ? desk.numberOfCardsAt(index) == 0 : index == to;
        });

        back.from(desk);
        back.solve(lastCard, cardFilter, destinationFilter,
            function (path, dst) {
                const count = back.countEqualsBackward(dst, tableau);
                if (count === tableau.length) {
                    result.count = count;
                    result.path = path;
                    result.destination = dst;
                    return true;
                }
                return false;
            });
        return result;
    }

    function findBestPath(from) {
        const lastCard = desk.cardAt(from, -1);

        // Handle simple cases first.
        if (!basis.isBase(from)) {
            const destination = desk.getBase(lastCard);
            if (destination >= 0) {
                // Move this card to the foundation.
                return toResult(destination);
            }
        }

        if (basis.isCell(from)) {
            return getCellCardDestination(from);
        } else if (basis.isBase(from)) {
            return getBaseCardDestination(from);
        }
        
        const tableau = desk.tableauAt(from);

        // Remove aces from the tableau
        const threshold = Cards.index(0, 1);
        for (let i = tableau.length; i-- > 0;) {
            if (tableau[i] < threshold) {
                tableau.splice(0, i + 1);
                break;
            }
        }

        const result = getPileCardDestination(from);
        if (tableau.length < 2) {
            return result;
        }

        const cardFilter = basis.createCardFilter(tableau);
        const destinationFilter = basis.createPileFilter(function (index) { return index != from; });

        let emptySpaces = 0;
        back.from(desk);

        function callback(path, dst) {
            const count = back.countEqualsBackward(dst, tableau);
            if (count === tableau.length) {
                const spaces = back.emptyCellCount() + back.emptyPileCount();
                if (count > result.count || spaces > emptySpaces) {
                    result.count = count;
                    result.path = path;
                    result.destination = dst;
                    emptySpaces = spaces;
                }
            } else if (count > result.count) {
                const delta = tableau.length - count;
                // Update result if the rest of the tableau is still intact.
                if (back.numberOfCardsAt(from) >= delta) {
                    let j = 0;
                    for (; j < delta && back.cardAt(from, -j - 1) == tableau[delta - j - 1]; j++);
                    if (j === delta) {
                        result.count = count;
                        result.path = path;
                        result.destination = dst;
                    }
                }
            }
            return false;
        }

        back.solve(lastCard, cardFilter, destinationFilter, callback);
        return result;
    }

    // Returns how many cards you can move to the destination.
    function solveMove(from, to) {
        const destinations = [to];
        if (desk.numberOfCardsAt(to) == 0) {
            if (basis.isPile(to)) {
                for (let i = basis.PILE_START; i < basis.PILE_END; i++) {
                    if (i != to && desk.numberOfCardsAt(i) == 0) {
                        destinations.push(i);
                    }
                }
            } else if (basis.isCell(to)) {
                for (let i = basis.CELL_START; i < basis.CELL_END; i++) {
                    if (i != to && desk.numberOfCardsAt(i) == 0) {
                        destinations.push(i);
                    }
                }
            }
        }

        const result = { count: 0 };

        const tableau = desk.tableauAt(from);
        const lastCard = desk.cardAt(from, -1);

        const startTime = Date.now();

        function callback(desk, path) {
            for (let d = 0; d < destinations.length; d++) {
                const dest = destinations[d];

                const dstCount = desk.numberOfCardsAt(dest);
                // 1. Test if the last filtered card has been moved to the destination.
                if (dstCount > 0 && desk.cardAt(dest, -1) == lastCard) {
                    // 2. Count how many cards from the tableau has been moved to the destination.
                    const count = desk.countEqualsBackward(dest, tableau);
                    if (count == tableau.length) {
                        result.count = count;
                        result.path = path;
                        result.destination = dest;
                        return true;
                    } else if (count > result.count) {
                        const delta = tableau.length - count;
                        // 3. Update result if the rest of the tableau is still intact.
                        if (desk.numberOfCardsAt(from) >= delta) {
                            let i = 0;
                            for (; i < delta && desk.cardAt(from, -i - 1) == tableau[delta - i - 1]; i++);
                            if (i == delta) {
                                result.count = count;
                                result.path = path;
                                result.destination = dest;
                            }
                        }
                    }
                }
                if (Date.now() - startTime > 500) {
                    // It's time to stop the search.
                    return true;
                }
            }

        }

        back.from(desk);
        basis.solve(back, callback, function (card) { return tableau.indexOf(card) >= 0; });

        if (result.count > 0 && result.destination != to) {
            const A = to, B = result.destination;
            const path = [];
            for (let i = 0; i < result.path.length; i++) {
                const move = result.path[i];
                let s = basis.toSource(move);
                let d = basis.toDestination(move);
                if (s == A) {
                    s = B;
                } else if (s == B) {
                    s = A;
                }
                if (d == A) {
                    d = B;
                } else if (d == B) {
                    d = A;
                }
                path.push(basis.toMove(s, d));
            }
            result.path = path;
        }

        return result;
    }

    // Extend our basis and return it:
    // Desk changing methods:
    basis.deal = deal;
    basis.moveCard = moveCard;

    // Event queue and Listeners:
    basis.queue = queue;
    basis.addOnDealListener = addOnDealListener;
    basis.addOnMoveListener = addOnMoveListener;
    basis.removeOnDealListener = removeOnDealListener;
    basis.removeOnMoveListener = removeOnMoveListener;

    // Other constant methods:
    basis.getPath = getPath;
    basis.findBestPath = findBestPath;
    basis.solveMove = solveMove;
    basis.isMoveValid = isMoveValid;
    basis.forEachMove = forEachMove;

    // Some Desk const methods:
    basis.getMoves = desk.getMoves;
    basis.forEachLocus = desk.forEachLocus;
    basis.buildTableauFrom = desk.buildTableauFrom;
    basis.tableauAt = desk.tableauAt;
    basis.tableauLengthAt = desk.tableauLengthAt;
    basis.cardAt = desk.cardAt;
    basis.numberOfCardsAt = desk.numberOfCardsAt;
    basis.emptyCellCount = desk.emptyCellCount;
    basis.emptyPileCount = desk.emptyPileCount;

    return basis;
}
