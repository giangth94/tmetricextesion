class SignalRHubProxy {
    constructor() {
        this._handlers = {};
        this._subscriptions = {};
    }
    on(methodName, newMethod) {
        let handlers = this._handlers[methodName];
        if (!handlers) {
            handlers = this._handlers[methodName] = [];
            if (this.isConnected) {
                this.subscribe(methodName);
            }
        }
        handlers.push(newMethod);
    }
    off(methodName, method) {
        let h = this._handlers[methodName] || [];
        let i = h.lastIndexOf(method);
        if (i >= 0) {
            h.splice(i, 1);
        }
    }
    onConnect(connection) {
        this._connection = connection;
        for (const methodName in this._handlers) {
            this.subscribe(methodName);
        }
    }
    onDisconnect(connection) {
        if (connection == this._connection) {
            for (const methodName in this._handlers) {
                this.unsubscribe(methodName);
            }
            this._connection = undefined;
        }
    }
    get isConnected() {
        return !!this._connection;
    }
    subscribe(methodName) {
        const subscription = (...args) => {
            let handlers = this._handlers[methodName];
            if (handlers) {
                handlers.forEach(_ => _(...args));
            }
        };
        this._subscriptions[methodName] = subscription;
        this._connection.on(methodName, subscription);
    }
    unsubscribe(methodName) {
        const subscription = this._subscriptions[methodName];
        delete this._subscriptions[methodName];
        this._connection.off(methodName, subscription);
    }
}
