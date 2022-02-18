class SimpleEvent {
    static create() {
        let handlers = [];
        let result = (handler => {
            handlers.push(handler);
        });
        result.emit = (arg) => {
            handlers.forEach(handler => handler(arg));
        };
        return result;
    }
}
