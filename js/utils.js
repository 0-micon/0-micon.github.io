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

function EventQueue() {
    const events = {};

    this.getEventQueue = function (eventName) {
        if (!events[eventName]) {
            events[eventName] = [];
        }
        return events[eventName];
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
