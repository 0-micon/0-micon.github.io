"use strict";
function createFreecellLayout(basis, dx, dy, cx, cy) {
    if (dx === void 0) { dx = 1; }
    if (dy === void 0) { dy = 1; }
    if (cx === void 0) { cx = 2; }
    if (cy === void 0) { cy = 2; }
    var cellStartX = dx;
    var cellEndX = cellStartX + basis.CELL_NUM * (cx + dx);
    var cellStartY = dy;
    var cellEndY = cellStartY + cy;
    var baseStartX = cellEndX;
    var baseEndX = baseStartX + basis.BASE_NUM * (cx + dx);
    var baseStartY = cellStartY;
    var baseEndY = cellEndY;
    var pileStartX = dx;
    var pileEndX = pileStartX + basis.PILE_NUM * (cx + dx);
    var pileStartY = cellEndY + dy;
    var pileEndY = pileStartY + 4 * cy;
    var width = Math.max(baseEndX, cellEndX, pileEndX);
    var height = Math.max(baseEndY, cellEndY, pileEndY) + dy;
    function linearTransition(start, end, ratio) {
        return start + (end - start) * ratio;
    }
    return {
        itemWidth: cx,
        itemHeight: cy,
        deltaWidth: dx,
        deltaHeight: dy,
        // Cells:
        cellStartX: cellStartX,
        cellEndX: cellEndX,
        cellStartY: cellStartY,
        cellEndY: cellEndY,
        getCellX: function (index) {
            return linearTransition(this.cellStartX, this.cellEndX, index / basis.CELL_NUM);
        },
        getCellY: function (_index) {
            return this.cellStartY;
        },
        // Bases:
        baseStartX: baseStartX,
        baseEndX: baseEndX,
        baseStartY: baseStartY,
        baseEndY: baseEndY,
        getBaseX: function (index) {
            return linearTransition(this.baseStartX, this.baseEndX, index / basis.BASE_NUM);
        },
        getBaseY: function (_index) {
            return this.baseStartY;
        },
        // Piles
        pileStartX: pileStartX,
        pileEndX: pileEndX,
        pileStartY: pileStartY,
        pileEndY: pileEndY,
        getPileX: function (index) {
            return linearTransition(this.pileStartX, this.pileEndX, index / basis.PILE_NUM);
        },
        getPileY: function (_index) {
            return this.pileStartY;
        },
        // Cards
        getCardX: function (spotIndex, cardIndex, cardCount) {
            if (basis.isCell(spotIndex)) {
                return this.getCellX(spotIndex - basis.CELL_START);
            }
            if (basis.isBase(spotIndex)) {
                return this.getBaseX(spotIndex - basis.BASE_START);
            }
            if (basis.isPile(spotIndex - basis.PILE_START)) {
                return this.getPileX(spotIndex);
            }
            return 0;
        },
        getCardY: function (spotIndex, cardIndex, cardCount) {
            if (basis.isCell(spotIndex)) {
                return this.getCellY(spotIndex - basis.CELL_START);
            }
            if (basis.isBase(spotIndex)) {
                return this.getBaseY(spotIndex - basis.BASE_START);
            }
            if (basis.isPile(spotIndex)) {
                var y = this.getPileY(spotIndex - basis.PILE_START);
                var h = this.pileEndY - this.pileStartY - this.itemHeight;
                if (cardCount > 0) {
                    var dh = Math.min(h / cardCount, dy);
                    return linearTransition(y, y + dh * cardCount, cardIndex / cardCount);
                }
                return y;
            }
            return 0;
        },
        // Total Size:
        width: width, height: height
    };
}
var MathUtils;
(function (MathUtils) {
    function toPercent(numerator, denominator, fractionDigits) {
        if (denominator === void 0) { denominator = 100; }
        if (fractionDigits === void 0) { fractionDigits = 3; }
        return (numerator * 100 / denominator).toFixed(fractionDigits) + '%';
    }
    MathUtils.toPercent = toPercent;
    /**
     * Returns a random number between minValue (inclusive) and maxValue (exclusive)
     */
    function randomNumber(minValue, maxValue) {
        return Math.random() * (maxValue - minValue) + minValue;
    }
    MathUtils.randomNumber = randomNumber;
    function randomIneger(minValue, maxValue) {
        return Math.floor(Math.random() * (maxValue - minValue)) + minValue;
    }
    MathUtils.randomIneger = randomIneger;
    var CODE_0 = '0'.charCodeAt(0);
    var CODE_A = 'a'.charCodeAt(0);
    function byteToCode(n) {
        if (n >= 0 && n < 10) {
            return CODE_0 + n;
        }
        else {
            return CODE_A + n - 10;
        }
    }
    MathUtils.byteToCode = byteToCode;
    function codeToByte(code) {
        if (code >= CODE_A) {
            return 10 + code - CODE_A;
        }
        else {
            return code - CODE_0;
        }
    }
    MathUtils.codeToByte = codeToByte;
    function byteArrayToString(arr) {
        var codes = arr.map(function (n) { return byteToCode(n); });
        return String.fromCharCode.apply(String, codes);
    }
    MathUtils.byteArrayToString = byteArrayToString;
    function byteAt(str, index) {
        return codeToByte(str.charCodeAt(index));
    }
    MathUtils.byteAt = byteAt;
    function stringToByteArray(str) {
        var arr = [];
        for (var i = 0; i < str.length; i++) {
            arr.push(codeToByte(str.charCodeAt(i)));
        }
        return arr;
    }
    MathUtils.stringToByteArray = stringToByteArray;
})(MathUtils || (MathUtils = {}));

function newSingleElementSelector(selectionClassName) {
    var selectedElement, selectedData, onselectstart, onselectend;
    if (selectionClassName) {
        onselectstart = function () {
            selectedElement.classList.add(selectionClassName);
        };
        onselectend = function () {
            selectedElement.classList.remove(selectionClassName);
        };
    }
    return {
        get selection() {
            return selectedElement;
        },
        get data() {
            return selectedData;
        },
        get isSelection() {
            return selectedElement != null;
        },
        get className() {
            return selectionClassName;
        },
        onselectstart: onselectstart,
        onselectend: onselectend,
        unselect: function () {
            if (selectedElement) {
                if (this.onselectend) {
                    this.onselectend();
                }
            }
            selectedElement = null;
            selectedData = null;
        },
        clear: function () {
            selectedElement = null;
            selectedData = null;
        },
        select: function (element, data) {
            this.unselect();
            if (element) {
                selectedElement = element;
                selectedData = data;
                if (this.onselectstart) {
                    this.onselectstart();
                }
            }
        }
    };
}

function newHistory() {
    var history = [], current = -1, lockCount = 0;

    return {
        get total() {
            return history.length;
        },
        get length() {
            return current + 1;
        },
        get current() {
            return current;
        },
        get currentItem() {
            return history[current];
        },
        get backwardItem() {
            return history[current - 1];
        },
        get forwardItem() {
            return history[current + 1];
        },
        get lockCount() {
            return lockCount;
        },
        get isLocked() {
            return lockCount > 0;
        },
        lock: function() {
            return ++lockCount > 0;
        },
        unlock: function() {
            if (lockCount > 0) {
                lockCount--;
            }
            return lockCount == 0;
        },
        at: function (index) {
            return history[index];
        },
        add: function (item) {
            if (lockCount == 0) {
                if (history.length > current + 1) {
                    // truncate
                    history.length = current + 1;
                }
                history[++current] = item;
                if (this.onadd) {
                    this.onadd();
                }
                return true;
            }
        },
        moveBackward: function () {
            if (current >= 0) {
                current--;
                if (this.onmove) {
                    this.onmove();
                }
            }
        },
        moveForward: function () {
            if (current + 1 < history.length) {
                current++;
                if (this.onmove) {
                    this.onmove();
                }
            }
        },
        clear: function(){
            current = -1;
            history.length = 0;
            lockCount = 0;
            if (this.onclear) {
                this.onclear();
            }
        }
    };
}

function EventQueue(events) {
    events = events || {};

    this.getEventQueue = function (eventName) {
        let queue = events[eventName];
        if (!queue) {
            events[eventName] = queue = [];
        }
        return queue;
    };
}

EventQueue.prototype.addEventListener = function (eventName, callback) {
    const queue = this.getEventQueue(eventName);
    let id = 1;
    for (let isValidId = false; !isValidId; id++) {
        isValidId = true;
        for (let i = 0; i < queue.length; i++) {
            if (queue[i].id === id) {
                isValidId = false;
                break;
            }
        }
    }
    queue.push({ id: id, callback: callback });
    return id;
};

EventQueue.prototype.removeEventListener = function (eventName, id) {
    const queue = this.getEventQueue(eventName);
    for (let i = queue.length; i-- > 0;) {
        if (queue[i].id === id) {
            queue.splice(i, 1);
            return true;
        }
    }
};

EventQueue.prototype.notifyAll = function (event) {
    const queue = this.getEventQueue(event.name);
    // LIFO queue:
    for (let i = queue.length; i-- > 0;) {
        if (queue[i].callback(event) || event.stopPropagation) {
            break;
        }
    }
};

var Draggable = /** @class */ (function () {
    function Draggable(element, zIndex, parent) {
        this.element = element;
        this.element.classList.add('selected');
        this.parent = parent;
        this.savedOffsetLeft = element.offsetLeft;
        this.savedOffsetTop = element.offsetTop;
        var style = element.style;
        this.savedTop = style.top || '';
        this.savedLeft = style.left || '';
        this.savedZIndex = style.zIndex || '';
        this.savedTransition = style.transition || '';
        style.zIndex = zIndex;
        style.transition = "none";
    }
    Draggable.prototype.restore = function () {
        if (this.parent) {
            this.parent.restore();
        }
        this.element.classList.remove('selected');
        var style = this.element.style;
        style.top = this.savedTop;
        style.left = this.savedLeft;
        style.zIndex = this.savedZIndex;
        style.transition = this.savedTransition;
    };
    Draggable.prototype.offset = function (deltaX, deltaY) {
        if (this.parent) {
            this.parent.offset(deltaX, deltaY);
        }
        this.element.style.left = this.savedOffsetLeft + deltaX + "px";
        this.element.style.top = this.savedOffsetTop + deltaY + "px";
    };
    Draggable.prototype.parentElement = function () {
        return !this.parent ? this.element : this.parent.parentElement();
    };
    return Draggable;
}());
var Dragger = /** @class */ (function () {
    function Dragger(draggable, screenX, screenY) {
        this.draggable = draggable;
        this.screenX = screenX;
        this.screenY = screenY;
        this.deltaX = 0;
        this.deltaY = 0;
        var that = this;
        // Call a function whenever the cursor moves:
        document.onmousemove = function (event) {
            event.preventDefault();
            // Calculate the new cursor position:
            that.deltaX = event.screenX - screenX;
            that.deltaY = event.screenY - screenY;
            if (window.devicePixelRatio) {
                that.deltaX /= window.devicePixelRatio;
                that.deltaY /= window.devicePixelRatio;
            }
            draggable.offset(that.deltaX, that.deltaY);
            if (typeof that.ondrag === "function") {
                that.ondrag(event);
            }
        };
        // Stop moving when mouse button is released:
        document.onmouseup = function (event) {
            document.onmousemove = null;
            document.onmouseup = null;
            draggable.restore();
            if (typeof that.ondragend === "function") {
                that.ondragend(event);
            }
        };
    }
    return Dragger;
}());
var FreecellHistory = /** @class */ (function () {
    function FreecellHistory() {
        this.moves = [];
        // Marks the current position
        this.mark = 0;
    }
    Object.defineProperty(FreecellHistory.prototype, "length", {
        get: function () {
            return this.moves.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FreecellHistory.prototype, "available", {
        get: function () {
            return this.moves.length - this.mark;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FreecellHistory.prototype, "current", {
        get: function () {
            return this.mark > 0 ? this.moves[this.mark - 1] : null;
        },
        enumerable: true,
        configurable: true
    });
    FreecellHistory.prototype.clear = function () {
        this.moves.length = 0;
        this.mark = 0;
    };
    FreecellHistory.prototype.move = function (source, destination) {
        var moves = this.moves;
        var mark = this.mark;
        if (moves.length > mark && moves[mark].source === source && moves[mark].destination === destination) {
            this.mark += 1; // skip forward
        }
        else if (mark > 0 && moves[mark - 1].source === destination && moves[mark - 1].destination === source) {
            this.mark -= 1; // skip backward
        }
        else {
            if (mark < moves.length) {
                moves.splice(mark); // drop out old moves
            }
            moves.push({ source: source, destination: destination });
            this.mark = moves.length; // append
        }
    };
    FreecellHistory.prototype.toNumberArray = function () {
        return this.moves.reduce(function (a, v) {
            a.push(v.source);
            a.push(v.destination);
            return a;
        }, []);
    };
    return FreecellHistory;
}());
