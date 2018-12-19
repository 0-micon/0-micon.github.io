const createFreecellGameDOM = (function () {
    // Helpers:
    function forEachElement(children, from, to, callback) {
        for (let i = from; i < to; i++) {
            callback(children[i], i - from);
        }
    }

    function createPlaceholders(parent, number, cx, cy, units) {
        const children = new Array(number);
        for (let i = 0; i < number; i++) {
            const element = (children[i] = document.createElement("div"));
            element.style.position = "absolute";
            element.style.width = cx + units;
            element.style.height = cy + units;
            element.style.zIndex = 0;
            element.classList.add("placeholder");

            parent.appendChild(element);
        }
        return children;
    }

    function positionCell(x, y, dx, dy, units) {
        return function (element, index) {
            element.classList.add("cell");
            element.style.left = x + index * dx + units;
            element.style.top = y + index * dy + units;
        };
    }

    function positionBase(x, y, dx, dy, units) {
        return function (element, index) {
            element.classList.add("base", Cards.suitFullNameOf(index));
            element.innerHTML = Cards.suitHTMLCodeOf(index);
            element.style.left = x + index * dx + units;
            element.style.top = y + index * dy + units;
        };
    }

    function positionPile(x, y, dx, dy, units) {
        return function (element, index) {
            element.classList.add("pile");
            element.style.left = x + index * dx + units;
            element.style.top = y + index * dy + units;
        };
    }

    function positionElement(element, x, y, cx, cy, units) {
        const style = element.style;

        style.top = x + units;
        style.left = y + units;
        style.width = cx + units;
        style.height = cy + units;
    }

    function createCards(parent, number, x, y, cx, cy, units) {
        const cards = new Array(number);
        for (let i = 0; i < number; i++) {
            const element = document.createElement('div');
            element.classList.add('card', Cards.suitFullNameOf(i));
            element.id = 'm_card_' + i;
            element.innerHTML = Cards.rankPlayNameOf(i) + Cards.suitHTMLCodeOf(i);
            element.style.position = 'absolute';
            positionElement(element, x, y, cx, cy, units);

            parent.appendChild(element);
            cards[i] = { element: element, line: -1, index: -1 };
        }
        return cards;
    }

    return function (pileNum, cellNum, baseNum, parent) {
        // Base object
        const game = createFreecellManager(pileNum, cellNum, baseNum);

        const UNITS = "em";
        /*
         * The most common sizes:
         * 1. poker size (2.5 × 3.5 inches (64 × 89 mm);
         * 2. bridge size (2.25 × 3.5 inches (57 × 89 mm);
         */
        const CX = 2.5,
          CY = 3.5,
          DX = 0.25 * CX,
          DY = 0.25 * CY,
          PLAY_CX = 2 * CX + Math.max(game.CELL_NUM + game.BASE_NUM, game.PILE_NUM) * (CX + DX),
          PLAY_CY = 9 * CY,
          CELL_X = CX,
          CELL_Y = CY,
          BASE_X = CELL_X + game.CELL_NUM * (CX + DX),
          BASE_Y = CELL_Y,
          PILE_X = CELL_X,
          PILE_Y = CELL_Y + CY + DY;

        // Style the parent:
        parent.style.position = "relative";
        positionElement(parent, 0, 0, PLAY_CX, PLAY_CY, UNITS);

        // Create and position placeholders:
        const placeholders = createPlaceholders(parent, game.DESK_SIZE, CX, CY, UNITS);
        forEachElement(placeholders, game.CELL_START, game.CELL_END,
            positionCell(CELL_X, CELL_Y, CX + DX, 0, UNITS));
        forEachElement(placeholders, game.BASE_START, game.BASE_END,
            positionBase(BASE_X, BASE_Y, CX + DX, 0, UNITS));
        forEachElement(placeholders, game.PILE_START, game.PILE_END,
            positionPile(PILE_X, PILE_Y, CX + DX, 0, UNITS));

        // Create cards:
        const cards = createCards(parent, game.CARD_NUM, 0, 0, CX, CY, UNITS);
        cards.forEach(function (card, index) {
            card.element.ondblclick = function (event) {
                event.preventDefault();
            };
            card.element.onclick = function (event) {
                event.preventDefault();
                console.log('Card ' + Cards.playNameOf(index) + ' has been clicked at [' + card.line + ':' + card.index + ']');

                if (card.line < 0 || card.index < 0) {
                    return;
                }

                const result = game.findBestPath(card.line);
                if (result.count === 1) {
                    game.moveCard(card.line, result.destination);
                } else if (result.count > 1) {
                    console.log(result.path);
                    console.log(result.destination);

                    result.path.forEach(function (move) {
                        game.moveCard(game.toSource(move), game.toDestination(move));
                    });
                }
            };
            card.updatePosition = function () {
                const i = this.line;
                const style = this.element.style;

                style.left = placeholders[i].style.left;
                if (game.isPile(i)) {
                    style.top = parseFloat(placeholders[i].style.top) + this.index * DY + UNITS;
                } else {
                    style.top = placeholders[i].style.top;
                }
            };
        });

        game.addOnDealListener(function deal(event) {
            const deck = event.deck;
            for (let i = 0; i < game.CARD_NUM; i++) {
                const element = cards[deck[i]].element;
                element.style.zIndex = i;
            }

            for (let i = 0; i < game.DESK_SIZE; i++) {
                const count = game.numberOfCardsAt(i);
                if (count > 0) {
                    for (let j = 0; j < count; j++) {
                        const card = cards[game.cardAt(i, j)];
                        card.line = i;
                        card.index = j;
                        card.updatePosition();
                    }
                }
            }
        });

        game.addOnMoveListener(function (event) {
            const card = cards[event.card];
            card.line = event.destination;
            card.index = game.numberOfCardsAt(event.destination) - 1;

            const element = card.element;
            // zIndex update.
            const zIndex = parseInt(element.style.zIndex);
            cards.forEach(function (item, index) {
                const zIndexItem = parseInt(item.element.style.zIndex);
                if (zIndexItem > zIndex) {
                    item.element.style.zIndex = zIndexItem - 1;
                }
            });
            element.style.zIndex = game.CARD_NUM;

            card.updatePosition();
        })

        return game;
    }
})();

const createFreecellGame = (function () {
    function createFreecellHistory(parent) {
        const history = newHistory();
        const historySelector = newSingleElementSelector('selected');

        history.onclear = function () {
            historySelector.clear();
            if (parent) {
                parent.innerHTML = '';
            }
        };

        history.onadd = function () {
            const index = history.current;
            //const item = history.currentItem;
            const li = document.createElement('li');

            li.innerHTML = history.itemToHTML();
            li.onclick = function () {
                history.onclickitem(index);
            };

            if (parent) {
                const children = parent.querySelectorAll('li');
                for (let i = children.length; i >= history.length; i--) {
                    parent.removeChild(children[i - 1]);
                }
                parent.appendChild(li);
            }

            historySelector.select(li, history.current);
        };

        history.onmove = function () {
            if (parent) {
                const children = parent.querySelectorAll('li');
                historySelector.select(children[history.current], history.current);
            }
        };

        history.moveCard = function (card, source, destination) {
            let historyUpdated = false;
            if (history.length > 0) {
                const item = history.currentItem;
                if (item.card == card && item.from == destination && item.to == source) {
                    history.moveBackward();
                    historyUpdated = true;
                }
            }
            if (!historyUpdated && history.total > history.length) {
                const item = history.forwardItem;
                if (item.card == card && item.from == source && item.to == destination) {
                    history.moveForward();
                    historyUpdated = true;
                }
            }
            if (!historyUpdated) {
                history.add({ card: card, from: source, to: destination });
            }
        }

        return history;
    }

    return function (pileNum, cellNum, baseNum, gui) {
        // Base object
        const game = createFreecellGameDOM(pileNum, cellNum, baseNum, gui.parent);

        // History object
        const history = createFreecellHistory(gui.history);

        history.itemToHTML = function () {
            const index = history.current;
            const item = history.currentItem;
            const li = document.createElement('li');
            let from = to = '-1';
            if (game.isPile(item.to)) {
                to = 'pile ' + (item.to - game.PILE_START);
            }
            if (game.isPile(item.from)) {
                from = 'pile ' + (item.from - game.PILE_START);
            }
            if (game.isBase(item.to)) {
                to = 'base ' + (item.to - game.BASE_START);
            }
            if (game.isBase(item.from)) {
                from = 'base ' + (item.from - game.BASE_START);
            }
            if (game.isCell(item.to)) {
                to = 'cell ' + (item.to - game.CELL_START);
            }
            if (game.isCell(item.from)) {
                from = 'cell ' + (item.from - game.CELL_START);
            }

            return '<span class="' + Cards.suitFullNameOf(item.card) + '">' + Cards.playNameOf(item.card) + '</span>'
                + ': ' + from + '&rarr;' + to;
        };

        history.onclickitem = function (index) {
            // move forward
            while (history.current < index) {
                const next = history.forwardItem;
                game.moveCard(next.from, next.to);
            }

            // move backward
            while (history.current > index) {
                const prev = history.currentItem;
                game.moveCard(prev.to, prev.from);
            }
        };

        if (gui.undo) {
            gui.undo.onclick = function () {
                if (history.current >= 0) {
                    const item = history.currentItem;
                    game.moveCard(item.to, item.from);
                }
            };
        }
        
        if (gui.redo) {
            gui.redo.onclick = function () {
                if (history.total > history.length) {
                    const next = history.forwardItem;
                    game.moveCard(next.from, next.to);
                }
            };
        }

        if (gui.deal) {
            gui.deal.onclick = function () {
                game.deal(Math.floor(Math.random() * 0x80000000));
            };
        }

        if (gui.auto) {
            gui.auto.onclick = function onclick() {
                game.forEachMove(function (source, destination) {
                    console.log('Source: ' + source + ' Destination: ' + destination);
                    if (game.isBase(destination)) {
                        // Move one card at a time.
                        game.moveCard(source, destination);
                        setTimeout(onclick, 250);
                        return true;    // Skip other moves.
                    }
                });
            };
        }

        function updateButtons() {
            if (gui.auto) {
                gui.auto.setAttribute('disabled', 'disabled');
                let count = 0;
                game.forEachMove(function (source, destination) {
                    if (game.isBase(destination)) {
                        gui.auto.removeAttribute('disabled');
                        return true;
                    }
                });
            }

            if (gui.undo) {
                if (history.current >= 0) {
                    gui.undo.removeAttribute('disabled');
                } else {
                    gui.undo.setAttribute('disabled', 'disabled');
                }
            }

            if (gui.redo) {
                if (history.total > history.length) {
                    gui.redo.removeAttribute('disabled');
                } else {
                    gui.redo.setAttribute('disabled', 'disabled');
                }
            }
        }

        // Game listeners:
        game.addOnDealListener(function (event) {
            history.clear();
            updateButtons();
        });

        game.addOnMoveListener(function (event) {
            history.moveCard(event.card, event.source, event.destination);
            updateButtons();
        });

        return game;
    }
})();
