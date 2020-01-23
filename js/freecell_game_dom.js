const createFreecellGameDOM = (function () {
    // Helpers:
    function toPercent(numerator, denominator) {
        return (numerator * 100 / denominator).toFixed(3) + '%';
    }
    function getBackgroundPosition(index) {
        const col = index % 8;
        const row = Math.floor(index / 8);
        return toPercent(col, 8 - 1) + ' ' + toPercent(row, 8 - 1);
    }
    
    function forEachElement(children, from, to, callback) {
        for (let i = from; i < to; i++) {
            callback(children[i], i - from);
        }
    }

    function createPlaceholders(parent, count, width, height) {
        const children = new Array(count);
        for (let i = 0; i < count; i++) {
            const element = (children[i] = document.createElement("div"));
            element.style.position = "absolute";
            element.style.width = width;
            element.style.height = height;
            element.style.zIndex = 0;
            element.classList.add("placeholder");

            parent.appendChild(element);
        }
        return children;
    }

    function positionElement(element, x, y, cx, cy, units) {
        const style = element.style;

        style.top = x + units;
        style.left = y + units;
        style.width = cx + units;
        style.height = cy + units;
    }

    function createCards(parent, count, x, y, cx, cy) {
        const cards = new Array(count);
        for (let i = 0; i < count; i++) {
            const element = document.createElement('div');
            element.classList.add('card', Cards.suitFullNameOf(i));
            element.id = 'm_card_' + i;
            element.style.position = 'absolute';
            element.style.backgroundPosition = getBackgroundPosition(i);
            
            //positionElement(element, x, y, cx, cy, units);
            element.style.top = x;
            element.style.left = y;
            element.style.width = cx;
            element.style.height = cy;

            parent.appendChild(element);
            cards[i] = { element: element, line: -1, index: -1 };
        }
        return cards;
    }

    function createAutoplay(game, timeout) {
        let path = [];
        let pathIndex = -1;
        let timerID = undefined;

        function ontimer() {
            timerID = undefined;
            next();
        }

        function isValid() {
            return pathIndex >= 0 && pathIndex < path.length;
        }

        function play(newPath) {
            stop();

            path = newPath;
            pathIndex = 0;
            next();
        }

        function stop() {
            if (timerID) {
                clearTimeout(timerID);
                timerID = undefined;
            }
            pathIndex = -1;
        }

        function next() {
            if (isValid()) {
                const move = path[pathIndex];
                const src = game.toSource(move);
                const dst = game.toDestination(move);

                if (game.isMoveValid(src, dst)) {
                    game.moveCard(src, dst);
                } else {
                    console.log('Ouch! An invalid move has been found!');
                    stop();
                }
            } else {
                stop();
            }
        }

        game.addOnDealListener(function (event) {
            stop();
        });

        game.addOnMoveListener(function (event) {
            if (isValid() &&
                path[pathIndex++] === game.toMove(event.source, event.destination) &&
                isValid()) {
                timerID = setTimeout(ontimer, timeout);
            } else {
                stop();
            }
        });

        return {
            play: play,
            stop: stop,
            get ended() {
                return pathIndex < 0 || pathIndex >= path.length;
            }
        };
    }

    return function (pileNum, cellNum, baseNum, parent) {
        // Base object
        const game = createFreecellManager(pileNum, cellNum, baseNum);
        const layout = createFreecellLayout(game);

        // Autoplay object
        const autoplay = createAutoplay(game, 250);

        const UNITS = "em";
        /*
         * The most common sizes:
         * 1. poker size (2.5 × 3.5 inches (64 × 89 mm);
         * 2. bridge size (2.25 × 3.5 inches (57 × 89 mm);
         */
        const CX = 2.5,
          CY = 3.5,
          DX = 1, // 0.25 * CX,
          DY = 1, // 0.25 * CY,
          PLAY_CX = Math.max(game.CELL_NUM + game.BASE_NUM, game.PILE_NUM) * (CX + DX) + DX,
          PLAY_CY = 8 * CY,
          TRANSITION_DEAL = 'transition_deal',
          TRANSITION_NORM = 'transition_norm',
          TRANSITION_FAST = 'transition_fast';

        // Style the parent:
        parent.style.position = "relative";
        positionElement(parent, 0, 0, PLAY_CX, PLAY_CY, UNITS);

        // Create and position placeholders:
        const placeholders = createPlaceholders(parent, game.DESK_SIZE,
                                                toPercent(layout.itemWidth, layout.width),
                                                toPercent(layout.itemHeight, layout.height));
        // position cells
        forEachElement(placeholders, game.CELL_START, game.CELL_END,
            (element, index) => {
                element.classList.add("cell");
                element.style.left = toPercent(layout.getCellX(index), layout.width);
                element.style.top = toPercent(layout.getCellY(index), layout.height);
        });
        // position bases
        forEachElement(placeholders, game.BASE_START, game.BASE_END,
           (element, index) => {
                element.classList.add("base", Cards.suitFullNameOf(index));
                element.style.left = toPercent(layout.getBaseX(index), layout.width);
                element.style.top = toPercent(layout.getBaseY(index), layout.height);
        });
        // position piles
        forEachElement(placeholders, game.PILE_START, game.PILE_END,
            (element, index) => {
                element.classList.add("pile");
                element.style.left = toPercent(layout.getPileX(index), layout.width);
                element.style.top = toPercent(layout.getPileY(index), layout.height);
        });

        // Create cards:
        function updateCardPosition(transitionClassName) {
            const i = this.line;
            if (i >= 0) {
                const count = game.numberOfCardsAt(i);
                const left = toPercent(layout.getCardX(i, this.index, count), layout.width);
                const top = toPercent(layout.getCardY(i, this.index, count), layout.height);
                
                const style = this.element.style;
                if (style.left !== left) {
                    style.left = left;
                }
                if (style.top !== top) {
                    style.top = top;
                }
            }

            if (!this.transitionClassName) {
                this.element.classList.add(transitionClassName);
                this.transitionClassName = transitionClassName;
            } else if (this.transitionClassName !== transitionClassName) {
                this.element.classList.replace(this.transitionClassName, transitionClassName);
                this.transitionClassName = transitionClassName;
            }
        }

        let dragger = null;
        const cards = createCards(parent, game.CARD_NUM, 0, 0,
                                 toPercent(layout.itemWidth, layout.width),
                                 toPercent(layout.itemHeight, layout.height));

        function getMoveTo(playCardElement, xDestination, yDestination) {
            let source = -1;
            let destination = -1;

            game.forEachLocus(function (index, card) {
                const element = (card >= 0 ? cards[card].element : placeholders[index]);
                if (element === playCardElement) {
                    source = index;
                } else {
                    const rect = element.getBoundingClientRect();
                    if (rect.left <= xDestination && xDestination <= rect.right &&
                        rect.top <= yDestination && yDestination <= rect.bottom) {
                        console.log('Collision at: ' + index + ' ' + (card >= 0 ? Cards.playNameOf(card) : card));
                        destination = index;
                    }
                }
            });

            return (source >= 0 && destination >= 0) ? game.toMove(source, destination) : -1;
        }

        cards.forEach(function (card, index) {
            card.element.onmousedown = function (event) {
                event.preventDefault();
                if (dragger) {
                    return;
                }

                autoplay.stop();

                let draggable = null;
                let tableau = game.buildTableauFrom(index);
                const canPlay = (card.line >= 0 && tableau[tableau.length - 1] === game.cardAt(card.line, -1));
                if (!canPlay) {
                    tableau.length = 1;
                }

                let zIndex = game.CARD_NUM + 1;
                tableau.forEach(function (cardIndex) {
                    cards[cardIndex].updatePosition(TRANSITION_FAST);
                    draggable = new Draggable(cards[cardIndex].element, zIndex++, draggable);
                });
                if (draggable) {
                    dragger = new Dragger(draggable, event.screenX, event.screenY);
                    dragger.ondrag = function (event) {
                        if (Math.max(Math.abs(dragger.deltaX), Math.abs(dragger.deltaY)) > 5) {
                            dragger.dragged = true;
                        }
                    };
                    dragger.ondragend = function (event) {
                        if (dragger.dragged) {
                            setTimeout(function () { dragger = null; }, 250);

                            if (canPlay) {
                                const move = getMoveTo(draggable.element, event.clientX, event.clientY);
                                if (move > 0) {
                                    const src = game.toSource(move);
                                    const dst = game.toDestination(move);
                                    if (tableau.length < 2) {
                                        if (game.isMoveValid(src, dst)) {
                                            game.moveCard(src, dst);
                                        }
                                    } else {
                                        const result = game.getPath(tableau, src, dst);
                                        if (result.count > 0) {
                                            console.log(result.path);
                                            console.log(result.destination);
                                            autoplay.play(result.path);
                                        }
                                    }
                                }
                            }
                        } else {
                            dragger = null;
                        }
                    }
                }
            };
            card.element.ondblclick = function (event) {
                event.preventDefault();
            };
            card.element.onclick = function (event) {
                event.preventDefault();
                if (dragger) {
                    return;
                }

                console.log('Card ' + Cards.playNameOf(index) + ' has been clicked at [' + card.line + ':' + card.index + ']');
                autoplay.stop();

                if (card.line < 0 || card.index < 0) {
                    return;
                }

                const result = game.findBestPath(card.line);
                if (result.count === 1) {
                    game.moveCard(card.line, result.destination);
                } else if (result.count > 1) {
                    console.log(result.path);
                    console.log(result.destination);
                    autoplay.play(result.path);
                }
            };
            card.updatePosition = updateCardPosition;
        });

        game.addOnDealListener(function (event) {
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
                        card.updatePosition(TRANSITION_DEAL);
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
            
            // Update positions:
            const transition = autoplay.ended ? TRANSITION_NORM : TRANSITION_FAST;
            if (event.source >= 0) {
                const count = game.numberOfCardsAt(event.source);
                for (let j = 0; j < count; j++) {
                  cards[game.cardAt(event.source, j)].updatePosition(transition);
                }
            }
            if (event.destination >= 0) {
                const count = game.numberOfCardsAt(event.destination);
                for (let j = 0; j < count; j++) {
                  cards[game.cardAt(event.destination, j)].updatePosition(transition);
                }
            }

            // card.updatePosition(transition);
        });

        return game;
    }
})();

const createFreecellGame = (function () {
    function enableButton(btn, value) {
        if (value !== !btn.hasAttribute('disabled')) {
            if (value) {
                btn.removeAttribute('disabled');
            } else {
                btn.setAttribute('disabled', 'disabled');
            }
        }
    }

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
            const li = history.createElement('li');
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

        history.createElement = function (tagName) {
            const index = history.current;
            const item = history.currentItem;
            
            let from = '';
            let to = '';
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
            
            const emptyCount = game.emptyCellCount() + game.emptyPileCount();

            const el = document.createElement(tagName);
            el.innerHTML = '<span class="' + Cards.suitFullNameOf(item.card) + '">' + Cards.playNameOf(item.card) + '</span>'
                + ': ' + from + '&rarr;' + to + '; free ' + emptyCount;
            const levels = ['critical', 'extreme', 'very-high', 'high', 'moderate', 'low'];
            el.classList.add('danger-' + (levels[emptyCount] || 'very-low'));
            
            return el;
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
                let isBase = false;
                game.forEachMove(function (source, destination) {
                    if (game.isBase(destination)) {
                        isBase = true;
                        return true;
                    }
                });
                enableButton(gui.auto, isBase);
            }

            if (gui.undo) {
                enableButton(gui.undo, history.current >= 0);
            }

            if (gui.redo) {
                enableButton(gui.redo, history.total > history.length);
            }
        }

        SoundManager.init();

        // Game listeners:
        let emptyCount = 0;
        game.addOnDealListener(function (event) {
            emptyCount = game.emptyPileCount() + game.emptyCellCount();
            SoundManager.playDeal();

            history.clear();
            updateButtons();
        });

        game.addOnMoveListener(function (event) {
            SoundManager.playCard();

            const count = game.emptyPileCount() + game.emptyCellCount();
            if (count > emptyCount) {
                emptyCount = count;
                SoundManager.playVictory();
            }

            if (game.emptyPileCount() === game.PILE_NUM && game.emptyCellCount() === game.CELL_NUM) {
                SoundManager.playVictory();
            }

            history.moveCard(event.card, event.source, event.destination);
            updateButtons();
        });

        return game;
    }
})();
